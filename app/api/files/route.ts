import { env } from "cloudflare:workers";
import { validWriteOrigin } from "../../../lib/auth-api";
import { validateFileContentForUpload } from "../../../lib/file-validation";
import { getChatGPTUser } from "../../chatgpt-auth";
const db = () => env.DB as D1Database;
export async function POST(req: Request) {
  const u = await getChatGPTUser();
  if (!u) return new Response("Unauthorized", { status: 401 });
  if (!validWriteOrigin(req))
    return new Response("Forbidden", { status: 403 });
  try {
    const form = await req.formData();
    const file = form.get("file") as File;
    const taskId = String(form.get("taskId") || "");
    if (!file || typeof file === "string" || file.size > 10 * 1024 * 1024)
      return Response.json(
        { error: "Tệp phải nhỏ hơn 10 MB." },
        { status: 400 },
      );
    if (!/\.(pdf|docx|xlsx|csv|txt|png|jpg|jpeg|webp)$/i.test(file.name))
      return Response.json(
        { error: "Chỉ nhận PDF, DOCX, XLSX, CSV, TXT và ảnh PNG/JPG/WebP." },
        { status: 400 },
      );
    if (
      taskId &&
      !(await db()
        .prepare(
          "SELECT key FROM records WHERE owner=? AND key=? AND kind='task'",
        )
        .bind(u.userId, u.userId + ":" + taskId)
        .first())
    )
      return new Response("Not found", { status: 404 });
    const id = crypto.randomUUID();
    const key = u.userId + "/" + id;
    const bucket = env.BUCKET as R2Bucket;
    const fileBytes = new Uint8Array(await file.arrayBuffer());
    const validation = validateFileContentForUpload(file.name, fileBytes);

    if (!validation.ok) {
      return Response.json(
        { error: "Invalid file content", reason: validation.reason },
        { status: 400 },
      );
    }

    await bucket.put(key, fileBytes);

    const record = {
      id,
      kind: "file",
      name: file.name,
      size: file.size,
      taskId,
      author: u.displayName,
    };

    try {
      const result = await db()
        .prepare(
          "INSERT INTO records (key,owner,kind,data,version,updated) VALUES (?,?,?,?,1,?)",
        )
        .bind(
          u.userId + ":" + id,
          u.userId,
          "file",
          JSON.stringify(record),
          new Date().toISOString(),
        )
        .run();

      if (!result.success || result.meta.changes !== 1) {
        throw new Error("D1 insert not confirmed");
      }
    } catch (error) {
      try {
        await bucket.delete(key);
      } catch (cleanupError) {
        console.error("R2 cleanup failed after D1 error", {
          key,
          cleanupError,
        });
      }
      throw error;
    }
    return Response.json({ ok: true });
  } catch {
    return Response.json({ error: "Tải tệp thất bại." }, { status: 500 });
  }
}
export async function GET(req: Request) {
  const u = await getChatGPTUser();
  if (!u) return new Response("Unauthorized", { status: 401 });
  const id = new URL(req.url).searchParams.get("id");
  const row = await db()
    .prepare("SELECT data FROM records WHERE key=? AND owner=? AND kind='file'")
    .bind(u.userId + ":" + id, u.userId)
    .first<{ data: string }>();
  if (!row) return new Response("Not found", { status: 404 });
  const object = await (env.BUCKET as R2Bucket).get(u.userId + "/" + id);
  if (!object) return new Response("Not found", { status: 404 });
  const data = JSON.parse(row.data);
  return new Response(object.body, {
    headers: {
      "Content-Type": "application/octet-stream",
      "Content-Disposition":
        "attachment; filename*=UTF-8''" + encodeURIComponent(data.name),
      "Cache-Control": "private, no-store",
      "X-Content-Type-Options": "nosniff",
    },
  });
}

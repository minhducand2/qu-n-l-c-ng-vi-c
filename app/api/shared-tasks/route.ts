import { env } from "cloudflare:workers";
import { validWriteOrigin } from "../../../lib/auth-api";
import { getChatGPTUser } from "../../chatgpt-auth";
import { validateTask } from "../../../lib/domain";
import {
  assessSharedTask,
  canTransition,
  applyReviewDecision,
} from "../../../lib/shared-task-workflow";

type Role = "admin" | "leader" | "manager" | "member" | "viewer";
type Member = { role: Role; status: string };
type TaskRow = {
  id: string;
  workspace_id: string;
  data: string;
  assigned_to: string | null;
  created_by: string;
  version: number;
  archived: number;
  updated_at: string;
};
const leaders = new Set<Role>(["admin", "leader"]);
const creators = new Set<Role>(["admin", "leader", "manager"]);
const reply = (data: unknown, status = 200) =>
  Response.json(data, {
    status,
    headers: { "Cache-Control": "private, no-store" },
  });
const validId = (x: unknown) =>
  typeof x === "string" && /^[a-zA-Z0-9_-]{1,100}$/.test(x);

async function member(
  db: D1Database,
  workspaceId: string,
  userId: string,
): Promise<Member | null> {
  const row = await db
    .prepare(
      "SELECT role,status FROM memberships WHERE workspace_id=? AND user_id=? AND status='active'",
    )
    .bind(workspaceId, userId)
    .first<Member>();
  return row &&
    ["admin", "leader", "manager", "member", "viewer"].includes(row.role)
    ? row
    : null;
}
function canRead(role: Role, userId: string, t: TaskRow) {
  return (
    leaders.has(role) ||
    t.assigned_to === userId ||
    (role === "manager" && t.created_by === userId)
  );
}
function canEdit(role: Role, userId: string, t: TaskRow) {
  return (
    leaders.has(role) ||
    (role === "manager" && t.created_by === userId) ||
    (role === "member" && t.assigned_to === userId)
  );
}
export async function GET(req: Request) {
  const u = await getChatGPTUser();
  if (!u) return reply({ error: "Vui lòng đăng nhập." }, 401);
  const workspaceId = new URL(req.url).searchParams.get("workspaceId");
  if (!validId(workspaceId))
    return reply({ error: "workspaceId không hợp lệ." }, 400);
  try {
    const db = env.DB as D1Database;
    const m = await member(db, workspaceId!, u.userId);
    if (!m) return reply({ error: "Không có quyền truy cập tổ chức." }, 403);
    const results = await db
      .prepare(
        "SELECT id,workspace_id,data,assigned_to,created_by,version,archived,updated_at FROM shared_tasks WHERE workspace_id=? AND archived=0 ORDER BY updated_at DESC LIMIT 1000",
      )
      .bind(workspaceId)
      .all<TaskRow>();
    return reply({
      tasks: (results.results || [])
        .filter((t) => canRead(m.role, u.userId, t))
        .map((t) => ({
          id: t.id,
          workspaceId: t.workspace_id,
          ...JSON.parse(t.data),
          assignedTo: t.assigned_to,
          createdBy: t.created_by,
          version: t.version,
          updatedAt: t.updated_at,
        })),
    });
  } catch {
    return reply({ error: "Không thể tải công việc chung." }, 500);
  }
}
export async function POST(req: Request) {
  const u = await getChatGPTUser();
  if (!u) return reply({ error: "Vui lòng đăng nhập." }, 401);
  if (!validWriteOrigin(req))
    return reply({ error: "Invalid request origin." }, 403);
  if (
    !req.headers
      .get("content-type")
      ?.toLowerCase()
      .startsWith("application/json")
  )
    return reply({ error: "Yêu cầu JSON." }, 415);
  try {
    const raw = await req.text();
    if (raw.length > 110000) return reply({ error: "Yêu cầu quá lớn." }, 413);
    const body: any = JSON.parse(raw);
    const { workspaceId, action, task } = body || {};
    if (
      !validId(workspaceId) ||
      !task ||
      typeof task !== "object" ||
      Array.isArray(task) ||
      !["create", "update", "submit", "approve", "reject"].includes(action)
    )
      return reply({ error: "Yêu cầu không hợp lệ." }, 400);
    if (
      !validId(task.id) ||
      typeof task.title !== "string" ||
      JSON.stringify(task).length > 100000
    )
      return reply({ error: "Thông tin công việc không hợp lệ." }, 400);
    if (task.kind !== undefined && task.kind !== "task")
      return reply({ error: "Loại công việc không hợp lệ." }, 400);
    if (
      task.assignedTo !== null &&
      task.assignedTo !== undefined &&
      !validId(task.assignedTo)
    )
      return reply({ error: "Người nhận không hợp lệ." }, 400);
    const db = env.DB as D1Database;
    const m = await member(db, workspaceId, u.userId);
    if (!m) return reply({ error: "Không có quyền truy cập tổ chức." }, 403);
    const assignedTo =
      typeof task.assignedTo === "string" ? task.assignedTo : null;
    if (assignedTo && !(await member(db, workspaceId, assignedTo)))
      return reply(
        { error: "Người nhận chưa phải thành viên hoạt động." },
        400,
      );
    const now = new Date().toISOString();
    if (action === "create") {
      if (!creators.has(m.role))
        return reply({ error: "Vai trò không được tạo công việc." }, 403);
      if (m.role === "manager" && assignedTo !== u.userId)
        return reply(
          {
            error:
              "Trưởng phòng chưa được cấp phạm vi giao việc; chỉ có thể tự giao.",
          },
          403,
        );
      const safe = {
        kind: "task",
        title: task.title,
        description: task.description ?? "",
        status: task.status,
        priority: task.priority,
        start: task.start ?? "",
        due: task.due ?? "",
        progress: task.progress,
        result: task.result ?? "",
        cancelReason: task.cancelReason ?? "",
        assignedTo,
      };
      validateTask(safe);
      if (safe.status === "Hoàn thành")
        return reply(
          {
            error:
              "Hãy tạo việc ở trạng thái Chưa bắt đầu và sử dụng quy trình phê duyệt.",
          },
          400,
        );
      const data = JSON.stringify(safe);
      const auditId = crypto.randomUUID();
      const commands = [
        db
          .prepare(
            "INSERT INTO shared_tasks (id,workspace_id,title,data,assigned_to,created_by,version,archived,created_at,updated_at) VALUES (?,?,?,?,?,?,1,0,?,?)",
          )
          .bind(
            task.id,
            workspaceId,
            safe.title,
            data,
            assignedTo,
            u.userId,
            now,
            now,
          ),
        db
          .prepare(
            "INSERT INTO shared_task_audit (id,workspace_id,task_id,actor_id,action,before_data,after_data,created_at) VALUES (?,?,?,?,?,?,?,?)",
          )
          .bind(
            auditId,
            workspaceId,
            task.id,
            u.userId,
            "create",
            null,
            data,
            now,
          ),
      ];
      await db.batch(commands);
      return reply(
        { task: { id: task.id, workspaceId, ...safe, version: 1 } },
        201,
      );
    }
    const old = await db
      .prepare(
        "SELECT id,workspace_id,data,assigned_to,created_by,version,archived,updated_at FROM shared_tasks WHERE id=? AND workspace_id=?",
      )
      .bind(task.id, workspaceId)
      .first<TaskRow>();
    if (!old || old.archived)
      return reply({ error: "Không tìm thấy công việc." }, 404);
    if (
      !canEdit(m.role, u.userId, old) &&
      !(["approve", "reject"].includes(action) && leaders.has(m.role))
    )
      return reply({ error: "Không được sửa công việc này." }, 403);
    if (!Number.isSafeInteger(task.version) || task.version !== old.version)
      return reply({ error: "Công việc đã thay đổi, vui lòng tải lại." }, 409);
    if (!leaders.has(m.role) && assignedTo !== old.assigned_to)
      return reply({ error: "Bạn không được thay đổi người nhận." }, 403);
    const previous = JSON.parse(old.data);
    if (action === "submit") {
      if (
        !["Chưa bắt đầu", "Đang thực hiện", "Xem xét", "Tạm dừng"].includes(
          previous.status,
        )
      )
        return reply(
          {
            error:
              "Chỉ công việc chưa hoàn thành và chưa trình duyệt mới được gửi duyệt.",
          },
          409,
        );
      if (typeof previous.result !== "string" || !previous.result.trim())
        return reply(
          { error: "Hãy lưu kết quả/bằng chứng trước khi trình duyệt." },
          400,
        );
      const submitted = { ...previous, status: "Chờ duyệt", submittedAt: now };
      validateTask(submitted);
      const data = JSON.stringify(submitted),
        operation = crypto.randomUUID();
      const batch = await db.batch([
        db
          .prepare(
            "UPDATE shared_tasks SET data=?,version=version+1,updated_at=? WHERE id=? AND workspace_id=? AND version=?",
          )
          .bind(data, now, task.id, workspaceId, old.version),
        db
          .prepare(
            "INSERT INTO shared_task_audit (id,workspace_id,task_id,actor_id,action,before_data,after_data,created_at) SELECT ?,?,?,?,?,?,?,? WHERE EXISTS (SELECT 1 FROM shared_tasks WHERE id=? AND workspace_id=? AND version=?)",
          )
          .bind(
            operation,
            workspaceId,
            task.id,
            u.userId,
            "submit",
            old.data,
            data,
            now,
            task.id,
            workspaceId,
            old.version + 1,
          ),
      ]);
      if (batch[0].meta.changes !== 1)
        return reply({ error: "Xung đột phiên bản, vui lòng tải lại." }, 409);
      return reply({
        task: {
          id: task.id,
          workspaceId,
          ...submitted,
          version: old.version + 1,
        },
      });
    }
    if (action === "approve" || action === "reject") {
      if (!leaders.has(m.role))
        return reply({ error: "Chỉ lãnh đạo hoặc admin được duyệt." }, 403);
      if (previous.status !== "Chờ duyệt")
        return reply({ error: "Công việc không ở trạng thái Chờ duyệt." }, 409);
      const decision = applyReviewDecision(
        previous,
        action,
        body.reason,
        u.userId,
        now,
      );
      const data = JSON.stringify(decision),
        operation = crypto.randomUUID();
      const batch = await db.batch([
        db
          .prepare(
            "UPDATE shared_tasks SET data=?,version=version+1,updated_at=? WHERE id=? AND workspace_id=? AND version=?",
          )
          .bind(data, now, task.id, workspaceId, old.version),
        db
          .prepare(
            "INSERT INTO shared_task_audit (id,workspace_id,task_id,actor_id,action,before_data,after_data,created_at) SELECT ?,?,?,?,?,?,?,? WHERE EXISTS (SELECT 1 FROM shared_tasks WHERE id=? AND workspace_id=? AND version=?)",
          )
          .bind(
            operation,
            workspaceId,
            task.id,
            u.userId,
            action,
            old.data,
            data,
            now,
            task.id,
            workspaceId,
            old.version + 1,
          ),
      ]);
      if (batch[0].meta.changes !== 1)
        return reply({ error: "Xung đột phiên bản, vui lòng tải lại." }, 409);
      return reply({
        task: {
          id: task.id,
          workspaceId,
          ...decision,
          version: old.version + 1,
        },
      });
    }
    const safe = {
      ...previous,
      title: task.title,
      description: task.description ?? previous.description,
      status: task.status,
      priority: task.priority,
      start: task.start ?? "",
      due: task.due ?? "",
      progress: task.progress,
      result: task.result ?? "",
      cancelReason: task.cancelReason ?? "",
      assignedTo,
    };
    if (
      previous.due !== safe.due &&
      (typeof body.reason !== "string" || !body.reason.trim())
    )
      return reply({ error: "Cần lý do thay đổi hạn chót." }, 400);
    if (previous.status !== "Chờ duyệt" && safe.status === "Chờ duyệt")
      return reply(
        { error: "Hãy dùng nút Trình duyệt để gửi yêu cầu phê duyệt." },
        400,
      );
    if (!canTransition(m.role, previous.status, safe.status))
      return reply(
        {
          error:
            "Trạng thái này cần quy trình phê duyệt hoặc không thuộc quyền của bạn.",
        },
        403,
      );
    if (previous.status !== "Chờ duyệt" && safe.status === "Chờ duyệt")
      safe.submittedAt = now;
    if (previous.status === "Chờ duyệt" && safe.status !== "Chờ duyệt")
      safe.submittedAt = null;
    validateTask(safe);
    const data = JSON.stringify(safe),
      operation = crypto.randomUUID();
    const batch = await db.batch([
      db
        .prepare(
          "UPDATE shared_tasks SET title=?,data=?,assigned_to=?,version=version+1,updated_at=? WHERE id=? AND workspace_id=? AND version=?",
        )
        .bind(
          safe.title,
          data,
          assignedTo,
          now,
          task.id,
          workspaceId,
          old.version,
        ),
      db
        .prepare(
          "INSERT INTO shared_task_audit (id,workspace_id,task_id,actor_id,action,before_data,after_data,created_at) SELECT ?,?,?,?,?,?,?,? WHERE EXISTS (SELECT 1 FROM shared_tasks WHERE id=? AND workspace_id=? AND version=?)",
        )
        .bind(
          operation,
          workspaceId,
          task.id,
          u.userId,
          "update",
          old.data,
          data,
          now,
          task.id,
          workspaceId,
          old.version + 1,
        ),
    ]);
    if (batch[0].meta.changes !== 1)
      return reply({ error: "Xung đột phiên bản, vui lòng tải lại." }, 409);
    return reply({
      task: { id: task.id, workspaceId, ...safe, version: old.version + 1 },
    });
  } catch (e) {
    return reply(
      { error: e instanceof Error ? e.message : "Yêu cầu không hợp lệ." },
      400,
    );
  }
}

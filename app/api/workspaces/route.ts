import { env } from 'cloudflare:workers';
import { getChatGPTUser } from '../../chatgpt-auth';

// ============================================
// GET - LAY DANH SACH TO CHUC CUA TAI KHOAN
// ============================================

export async function GET() {
  const user = await getChatGPTUser();

  if (!user) {
    return Response.json({ error: 'Vui lòng đăng nhập.' }, { status: 401 });
  }

  try {
    const db = env.DB as D1Database;

    const result = await db
      .prepare(
        `
      SELECT
        w.id,
        w.name,
        m.role,
        m.status,
        m.joined_at
      FROM workspaces w
      INNER JOIN memberships m
        ON m.workspace_id = w.id
      WHERE m.user_id = ?
        AND m.status = 'active'
      ORDER BY w.name
    `,
      )
      .bind(user.userId)
      .all();

    return Response.json(
      { workspaces: result.results },
      {
        headers: {
          'Cache-Control': 'private, no-store',
        },
      },
    );
  } catch {
    return Response.json({ error: 'Không thể tải danh sách tổ chức.' }, { status: 500 });
  }
}

// ============================================
// POST - TAO TO CHUC MOI
// ============================================

export async function POST(req: Request) {
  const user = await getChatGPTUser();

  if (!user) {
    return Response.json({ error: 'Vui lòng đăng nhập.' }, { status: 401 });
  }

  // Kiem tra nguon request
  const origin = req.headers.get('origin');
  const requestUrl = new URL(req.url);

  if (
    (origin && origin !== requestUrl.origin) ||
    req.headers.get('sec-fetch-site') === 'cross-site'
  ) {
    return Response.json({ error: 'Nguồn yêu cầu không hợp lệ.' }, { status: 403 });
  }

  // Kiem tra Content-Type
  if (!req.headers.get('content-type')?.toLowerCase().startsWith('application/json')) {
    return Response.json({ error: 'Yêu cầu phải sử dụng JSON.' }, { status: 415 });
  }

  try {
    const body: unknown = await req.json();

    // Kiem tra du lieu dau vao
    if (
      !body ||
      typeof body !== 'object' ||
      Array.isArray(body) ||
      !('name' in body) ||
      typeof body.name !== 'string'
    ) {
      return Response.json({ error: 'Tên tổ chức không hợp lệ.' }, { status: 400 });
    }

    const name = body.name.trim();

    if (name.length < 2 || name.length > 120) {
      return Response.json(
        {
          error: 'Tên tổ chức phải có từ 2 đến 120 ký tự.',
        },
        { status: 400 },
      );
    }

    // Khoi tao thong tin to chuc
    const db = env.DB as D1Database;
    const id = crypto.randomUUID();
    const now = new Date().toISOString();

    // Tao workspace va cap quyen admin
    // trong cung mot giao dich D1
    await db.batch([
      db
        .prepare(
          `
        INSERT INTO workspaces
          (id, name, created_by, created_at, updated_at)
        VALUES (?, ?, ?, ?, ?)
      `,
        )
        .bind(id, name, user.userId, now, now),

      db
        .prepare(
          `
        INSERT INTO memberships
          (
            workspace_id,
            user_id,
            role,
            status,
            joined_at
          )
        VALUES (?, ?, 'admin', 'active', ?)
      `,
        )
        .bind(id, user.userId, now),
    ]);

    return Response.json(
      {
        workspace: {
          id,
          name,
          role: 'admin',
          createdAt: now,
        },
      },
      {
        status: 201,
        headers: {
          'Cache-Control': 'private, no-store',
        },
      },
    );
  } catch {
    return Response.json({ error: 'Không thể tạo tổ chức.' }, { status: 500 });
  }
}

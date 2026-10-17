import { env } from 'cloudflare:workers';
import { cookies } from 'next/headers';
import { SESSION_COOKIE_NAME, readSessionCookie, lookupSessionUser, type AuthenticatedUser } from './session-core';

export function authDb(): D1Database { return env.DB as D1Database; }
export function json(data: unknown, status = 200, headers?: HeadersInit): Response {
  return Response.json(data, { status, headers: { 'Cache-Control': 'no-store', ...headers } });
}

// Same-origin enforcement for cookie-authenticated state-changing endpoints.
// Reject missing Origin too: browsers send it on fetch POST requests.
export function validWriteOrigin(req: Request): boolean {
  const origin = req.headers.get('origin');
  const site = req.headers.get('sec-fetch-site');
  if (!origin || origin === 'null' || site === 'cross-site') return false;
  try { return new URL(origin).origin === new URL(req.url).origin; } catch { return false; }
}
export function isJsonRequest(req: Request): boolean {
  return /^application\/json(?:\s*;|\s*$)/i.test(req.headers.get('content-type') ?? '');
}
export async function currentSessionUser(): Promise<AuthenticatedUser | null> {
  const jar = await cookies();
  const token = jar.get(SESSION_COOKIE_NAME)?.value;
  if (!token) return null;
  return lookupSessionUser(authDb(), token);
}
export function clientIp(req: Request): string | null {
  // This value is trustworthy only behind an edge that overwrites this header.
  // Do NOT use it as sole security key. Per-account throttling remains mandatory.
  const raw = req.headers.get('cf-connecting-ip');
  return raw && raw.length < 65 ? raw : null;
}
export async function consumeLoginAttempt(
  db: D1Database,
  key: string,
  now: number,
): Promise<string | null> {
  const threshold = new Date(now - 15 * 60_000).toISOString();
  const timestamp = new Date(now).toISOString();

  const row = await db.prepare(`
    INSERT INTO auth_login_limits
      (account_key, attempts, window_started_at, updated_at)
    VALUES (?, 1, ?, ?)
    ON CONFLICT(account_key) DO UPDATE SET
      attempts = CASE
        WHEN window_started_at < ? THEN 1
        ELSE attempts + 1
      END,
      window_started_at = CASE
        WHEN window_started_at < ? THEN excluded.window_started_at
        ELSE window_started_at
      END,
      updated_at = excluded.updated_at
    WHERE window_started_at < ? OR attempts < 5
    RETURNING window_started_at
  `).bind(
    key, timestamp, timestamp,
    threshold, threshold, threshold
  ).first<{ window_started_at: string }>();

  return row?.window_started_at ?? null;
}


// Release a reserved attempt after successful authentication.
// Only releases one reservation; never makes attempts negative.
export async function releaseLoginAttempt(
  db: D1Database,
  key: string,
  windowStartedAt: string,
): Promise<void> {
  await db.prepare(
    'UPDATE auth_login_limits SET attempts = MAX(0, attempts - 1) WHERE account_key = ? AND window_started_at = ?'
  ).bind(key, windowStartedAt).run();
}

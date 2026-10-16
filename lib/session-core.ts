/** TEAM360 independent authentication: session primitives (no login integration yet). */
export const SESSION_COOKIE_NAME = "team360_session";
export const SESSION_LIFETIME_SECONDS = 60 * 60 * 12;

export function newSessionToken(): string {
  const bytes = new Uint8Array(32);
  crypto.getRandomValues(bytes);
  return Array.from(bytes, (byte) => byte.toString(16).padStart(2, "0")).join("");
}

export async function hashSessionToken(token: string): Promise<string> {
  if (!/^[a-f0-9]{64}$/.test(token)) throw new Error("Invalid session token");
  const digest = await crypto.subtle.digest("SHA-256", new TextEncoder().encode(token));
  return Array.from(new Uint8Array(digest), (byte) => byte.toString(16).padStart(2, "0")).join("");
}

export function sessionCookie(token: string, secure: boolean): string {
  if (!/^[a-f0-9]{64}$/.test(token)) throw new Error("Invalid session token");
  return `${SESSION_COOKIE_NAME}=${token}; Path=/; HttpOnly; SameSite=Lax; Max-Age=${SESSION_LIFETIME_SECONDS}${secure ? "; Secure" : ""}`;
}

export function clearSessionCookie(secure: boolean): string {
  return `${SESSION_COOKIE_NAME}=; Path=/; HttpOnly; SameSite=Lax; Max-Age=0${secure ? "; Secure" : ""}`;
}

export function readSessionCookie(header: string | null): string | null {
  if (!header) return null;
  const matches = header.split(";").map((item) => item.trim()).filter((part) => part.startsWith(`${SESSION_COOKIE_NAME}=`));
  if (matches.length !== 1) return null;
  const value = matches[0].slice(SESSION_COOKIE_NAME.length + 1);
  return /^[a-f0-9]{64}$/.test(value) ? value : null;
}

export type AuthenticatedUser = { userId: string; email: string; displayName: string };

/** Reads a verified, unexpired, non-revoked session; never trusts identity headers. */
export async function lookupSessionUser(db: D1Database, token: string, now = new Date()): Promise<AuthenticatedUser | null> {
  if (!/^[a-f0-9]{64}$/.test(token)) return null;
  const tokenHash = await hashSessionToken(token);
  const row = await db.prepare(`
    SELECT u.id AS userId, u.email AS email, u.display_name AS displayName
    FROM auth_sessions s
    INNER JOIN auth_users u ON u.id = s.user_id
    WHERE s.token_hash = ?
      AND s.revoked_at IS NULL
      AND s.expires_at > ?
      AND u.status = 'active'
    LIMIT 1
  `).bind(tokenHash, now.toISOString()).first<AuthenticatedUser>();
  return row ?? null;
}

/** Caller must verify credentials before invoking. */
export async function createSession(db: D1Database, userId: string, now = new Date()): Promise<{ token: string; expiresAt: string }> {
  const token = newSessionToken();
  const tokenHash = await hashSessionToken(token);
  const expiresAt = new Date(now.getTime() + SESSION_LIFETIME_SECONDS * 1000).toISOString();
  await db.prepare(`
    INSERT INTO auth_sessions (id, user_id, token_hash, created_at, expires_at, revoked_at)
    VALUES (?, ?, ?, ?, ?, NULL)
  `).bind(crypto.randomUUID(), userId, tokenHash, now.toISOString(), expiresAt).run();
  return { token, expiresAt };
}

export async function revokeSession(db: D1Database, token: string, now = new Date()): Promise<void> {
  if (!/^[a-f0-9]{64}$/.test(token)) return;
  const tokenHash = await hashSessionToken(token);
  await db.prepare("UPDATE auth_sessions SET revoked_at = ? WHERE token_hash = ? AND revoked_at IS NULL")
    .bind(now.toISOString(), tokenHash).run();
}

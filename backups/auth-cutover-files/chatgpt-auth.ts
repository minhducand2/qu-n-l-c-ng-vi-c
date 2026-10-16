import { redirect } from 'next/navigation';
import { currentSessionUser } from '../lib/auth-api';

// Legacy name retained while existing API imports are migrated.
// Identity is ALWAYS derived from a verified D1 session, never from request headers.
export type ChatGPTUser = {
  userId: string;
  displayName: string;
  email: string;
  fullName: string | null;
};

export async function getChatGPTUser(): Promise<ChatGPTUser | null> {
  const user = await currentSessionUser();
  if (!user) return null;
  return { ...user, fullName: user.displayName };
}

export async function requireChatGPTUser(returnTo: string): Promise<ChatGPTUser> {
  const user = await getChatGPTUser();
  if (user) return user;
  redirect(chatGPTSignInPath(returnTo));
}

function safeReturnPath(value: string): string {
  if (!value.startsWith('/') || value.startsWith('//')) return '/';
  try {
    const url = new URL(value, 'https://app.local');
    if (url.origin !== 'https://app.local') return '/';
    if (['/login', '/signin-with-chatgpt', '/signout-with-chatgpt', '/callback'].includes(url.pathname)) return '/';
    return `${url.pathname}${url.search}${url.hash}`;
  } catch { return '/'; }
}

export function chatGPTSignInPath(returnTo: string): string {
  return `/login?return_to=${encodeURIComponent(safeReturnPath(returnTo))}`;
}

// Old GET logout route is not used; sign-out MUST be POSTed to /api/auth/logout.
export function chatGPTSignOutPath(_returnTo = '/'): string {
  return '/login';
}

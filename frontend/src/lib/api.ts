/**
 * api.ts — HTTP client for calling Next.js API Routes (/api/...)
 *
 * Auth is handled via NextAuth session cookies automatically — no
 * manual Authorization header or localStorage token needed.
 * The IS_MOCK flag still works for development without a database.
 */
import { mockGet, mockPost, mockPut, mockDel } from './mockApi';

// In a merged app, all API calls are same-origin (/api/...)
// NEXT_PUBLIC_API_URL can still be set to override (e.g. for mobile clients)
const API_BASE = process.env.NEXT_PUBLIC_API_URL ?? '';
const IS_MOCK  = process.env.NEXT_PUBLIC_MOCK === 'true';

async function parseResponse(res: Response) {
  const txt = await res.text();
  try { return JSON.parse(txt); } catch { return txt; }
}

export async function get(path: string) {
  if (IS_MOCK) return mockGet(path);
  const res = await fetch(`${API_BASE}${path}`, { credentials: 'include' });
  if (res.status === 401) { redirectToLogin(); throw new Error('Unauthorized'); }
  if (!res.ok) {
    const body = await parseResponse(res);
    throw new Error(body?.error ?? 'Request failed');
  }
  return res.json();
}

export async function post(path: string, body?: any, contentType = 'application/json') {
  if (IS_MOCK) return mockPost(path, body);
  const headers: Record<string, string> = {};
  if (contentType) headers['Content-Type'] = contentType;

  const res = await fetch(`${API_BASE}${path}`, {
    method: 'POST',
    headers,
    credentials: 'include',
    body: body !== undefined
      ? contentType === 'application/json' ? JSON.stringify(body) : (body as any)
      : undefined,
  });
  if (res.status === 401) { redirectToLogin(); throw new Error('Unauthorized'); }
  return parseResponse(res);
}

export async function put(path: string, body: any) {
  if (IS_MOCK) return mockPut(path, body);
  const res = await fetch(`${API_BASE}${path}`, {
    method: 'PUT',
    headers: { 'Content-Type': 'application/json' },
    credentials: 'include',
    body: JSON.stringify(body),
  });
  if (res.status === 401) { redirectToLogin(); throw new Error('Unauthorized'); }
  if (!res.ok) {
    const body = await parseResponse(res);
    throw new Error(body?.error ?? 'Request failed');
  }
  return res.json();
}

export async function patch(path: string, body: any) {
  if (IS_MOCK) return mockPut(path, body);
  const res = await fetch(`${API_BASE}${path}`, {
    method: 'PATCH',
    headers: { 'Content-Type': 'application/json' },
    credentials: 'include',
    body: JSON.stringify(body),
  });
  if (res.status === 401) { redirectToLogin(); throw new Error('Unauthorized'); }
  if (!res.ok) {
    const body = await parseResponse(res);
    throw new Error(body?.error ?? 'Request failed');
  }
  return res.json();
}

export async function del(path: string) {
  if (IS_MOCK) return mockDel(path);
  const res = await fetch(`${API_BASE}${path}`, {
    method: 'DELETE',
    credentials: 'include',
  });
  if (res.status === 401) { redirectToLogin(); throw new Error('Unauthorized'); }
  if (!res.ok) {
    const body = await parseResponse(res);
    throw new Error(body?.error ?? 'Request failed');
  }
  return res.json();
}

function redirectToLogin() {
  if (typeof window !== 'undefined') window.location.href = '/login';
}

/**
 * @deprecated Auth is now session-based (NextAuth cookies).
 * Kept for backward compatibility with any code that still calls it.
 */
export function storeAuthResponse(_data: { token?: string; user?: any; permissions?: string[] }) {
  // no-op: session is managed by NextAuth, no localStorage needed
}

/** @deprecated */
export function authHeader(): Record<string, string> {
  return {};
}

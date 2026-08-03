import { mockGet, mockPost, mockPut, mockDel } from './mockApi';

const API_BASE = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3000';
const IS_MOCK  = process.env.NEXT_PUBLIC_MOCK === 'true';

export function authHeader(): Record<string, string> {
  if (typeof window === 'undefined') return {};
  const token = localStorage.getItem('token');
  return token ? { Authorization: `Bearer ${token}` } : {};
}

function handle401() {
  if (typeof window === 'undefined') return;
  localStorage.removeItem('token');
  localStorage.removeItem('user');
  localStorage.removeItem('permissions');
  window.location.href = '/login';
}

export async function get(path: string) {
  if (IS_MOCK) return mockGet(path);
  const res = await fetch(`${API_BASE}${path}`, { headers: { ...authHeader() } });
  if (res.status === 401) { handle401(); throw new Error('Unauthorized'); }
  if (!res.ok) throw new Error((await res.json()).error || 'Request failed');
  return res.json();
}

export async function post(path: string, body?: any, contentType = 'application/json') {
  if (IS_MOCK) return mockPost(path, body);
  const headers: Record<string, string> = { ...authHeader() };
  if (contentType) headers['Content-Type'] = contentType;
  const res = await fetch(`${API_BASE}${path}`, {
    method: 'POST',
    headers,
    body: body !== undefined
      ? contentType === 'application/json' ? JSON.stringify(body) : (body as any)
      : undefined,
  });
  if (res.status === 401) { handle401(); throw new Error('Unauthorized'); }
  const txt = await res.text();
  try { return JSON.parse(txt); } catch { return txt; }
}

export async function put(path: string, body: any) {
  if (IS_MOCK) return mockPut(path, body);
  const res = await fetch(`${API_BASE}${path}`, {
    method: 'PUT',
    headers: { 'Content-Type': 'application/json', ...authHeader() },
    body: JSON.stringify(body),
  });
  if (res.status === 401) { handle401(); throw new Error('Unauthorized'); }
  if (!res.ok) throw new Error((await res.json()).error || 'Request failed');
  return res.json();
}

export async function patch(path: string, body: any) {
  if (IS_MOCK) return mockPut(path, body);
  const res = await fetch(`${API_BASE}${path}`, {
    method: 'PATCH',
    headers: { 'Content-Type': 'application/json', ...authHeader() },
    body: JSON.stringify(body),
  });
  if (res.status === 401) { handle401(); throw new Error('Unauthorized'); }
  if (!res.ok) throw new Error((await res.json()).error || 'Request failed');
  return res.json();
}

export async function del(path: string) {
  if (IS_MOCK) return mockDel(path);
  const res = await fetch(`${API_BASE}${path}`, {
    method: 'DELETE',
    headers: { ...authHeader() },
  });
  if (res.status === 401) { handle401(); throw new Error('Unauthorized'); }
  if (!res.ok) throw new Error((await res.json()).error || 'Request failed');
  return res.json();
}

/** Call after successful login to persist auth state */
export function storeAuthResponse(data: { token: string; user: any; permissions: string[] }) {
  localStorage.setItem('token', data.token);
  localStorage.setItem('user', JSON.stringify(data.user));
  localStorage.setItem('permissions', JSON.stringify(data.permissions));
}

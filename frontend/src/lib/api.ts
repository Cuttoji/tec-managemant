const API_BASE = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3000';

export function authHeader(): Record<string, string> {
  if (typeof window === 'undefined') return {};
  const token = localStorage.getItem('token');
  const h: Record<string, string> = {};
  if (token) h.Authorization = `Bearer ${token}`;
  return h;
}

export async function get(path: string) {
  const res = await fetch(`${API_BASE}${path}`, { headers: { ...authHeader() } });
  if (!res.ok) throw new Error((await res.json()).error || 'Request failed');
  return res.json();
}

export async function post(path: string, body: any, contentType = 'application/json') {
  const headers: any = { ...authHeader() };
  if (contentType) headers['Content-Type'] = contentType;
  const res = await fetch(`${API_BASE}${path}`, { method: 'POST', headers, body: contentType === 'application/json' ? JSON.stringify(body) : body });
  const txt = await res.text();
  try { return JSON.parse(txt); } catch { return txt; }
}

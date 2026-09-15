import { getApiBaseUrl } from './config';
import { getToken, clearAuth } from './storage';
import type { LoginResponse } from '@/types';

const BASE = getApiBaseUrl();

export class ApiError extends Error {
  status: number;
  constructor(message: string, status: number) {
    super(message);
    this.status = status;
  }
}

async function authHeader(): Promise<Record<string, string>> {
  const token = await getToken();
  return token ? { Authorization: `Bearer ${token}` } : {};
}

async function handle401(): Promise<never> {
  await clearAuth();
  throw new ApiError('Unauthorized', 401);
}

async function parseError(res: Response): Promise<string> {
  try {
    const data = await res.json();
    return data.error || 'Request failed';
  } catch {
    return 'Request failed';
  }
}

export async function apiGet<T>(path: string): Promise<T> {
  const res = await fetch(`${BASE}${path}`, {
    headers: { ...(await authHeader()) },
  });
  if (res.status === 401) return handle401();
  if (!res.ok) throw new ApiError(await parseError(res), res.status);
  return res.json();
}

export async function apiPost<T>(path: string, body?: unknown, contentType = 'application/json'): Promise<T> {
  const headers: Record<string, string> = { ...(await authHeader()) };
  if (contentType) headers['Content-Type'] = contentType;

  const res = await fetch(`${BASE}${path}`, {
    method: 'POST',
    headers,
    body: body !== undefined
      ? contentType === 'application/json'
        ? JSON.stringify(body)
        : (body as BodyInit)
      : undefined,
  });
  if (res.status === 401) return handle401();
  const text = await res.text();
  try {
    return JSON.parse(text) as T;
  } catch {
    if (!res.ok) throw new ApiError(text || 'Request failed', res.status);
    return text as unknown as T;
  }
}

export async function apiPut<T>(path: string, body?: unknown): Promise<T> {
  const res = await fetch(`${BASE}${path}`, {
    method: 'PUT',
    headers: { 'Content-Type': 'application/json', ...(await authHeader()) },
    body: body !== undefined ? JSON.stringify(body) : undefined,
  });
  if (res.status === 401) return handle401();
  if (!res.ok) throw new ApiError(await parseError(res), res.status);
  return res.json();
}

export async function apiPatch<T>(path: string, body?: unknown): Promise<T> {
  const res = await fetch(`${BASE}${path}`, {
    method: 'PATCH',
    headers: { 'Content-Type': 'application/json', ...(await authHeader()) },
    body: body !== undefined ? JSON.stringify(body) : undefined,
  });
  if (res.status === 401) return handle401();
  if (!res.ok) throw new ApiError(await parseError(res), res.status);
  return res.json();
}

export async function apiDelete<T>(path: string): Promise<T> {
  const res = await fetch(`${BASE}${path}`, {
    method: 'DELETE',
    headers: { ...(await authHeader()) },
  });
  if (res.status === 401) return handle401();
  if (!res.ok) throw new ApiError(await parseError(res), res.status);
  return res.json();
}

// ─── Auth ─────────────────────────────────────────────────────────────────────

export async function login(email: string, password: string): Promise<LoginResponse> {
  return apiPost<LoginResponse>('/auth/login', { email, password });
}

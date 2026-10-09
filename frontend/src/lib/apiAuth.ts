/**
 * apiAuth.ts — helpers for securing Next.js API Route handlers
 *
 * Usage:
 *   const { user } = await requireApiAuth(request);
 *   const { user } = await requireApiAdmin(request);
 */
import { auth } from '@/lib/auth';
import type { NextRequest } from 'next/server';

export interface ApiUser {
  id: string;
  role: string;
  email: string;
  permissions: string[];
}

export class ApiError extends Error {
  constructor(
    public status: number,
    message: string,
  ) {
    super(message);
  }
}

/** Resolve the current session from Next.js cookies (server-side). */
async function getApiSession() {
  const session = await auth();
  return session?.user ?? null;
}

/** Require a valid session — throws ApiError(401) if not authenticated. */
export async function requireApiAuth(_req?: NextRequest): Promise<{ user: ApiUser }> {
  const user = await getApiSession();
  if (!user) throw new ApiError(401, 'Unauthorized');
  return { user: user as ApiUser };
}

/** Require ADMIN role — throws ApiError(403) if not admin. */
export async function requireApiAdmin(_req?: NextRequest): Promise<{ user: ApiUser }> {
  const { user } = await requireApiAuth(_req);
  if (user.role !== 'ADMIN') throw new ApiError(403, 'Forbidden');
  return { user };
}

/** Require a specific permission. ADMIN always passes. */
export async function requireApiPermission(
  permission: string,
  _req?: NextRequest,
): Promise<{ user: ApiUser }> {
  const { user } = await requireApiAuth(_req);
  if (user.role === 'ADMIN') return { user };
  if (!user.permissions?.includes(permission)) {
    throw new ApiError(403, `Permission denied: ${permission}`);
  }
  return { user };
}

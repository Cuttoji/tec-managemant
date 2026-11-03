/**
 * apiAuth.ts — helpers for securing Next.js API Route handlers
 *
 * Usage:
 *   const { user } = await requireApiAuth(request);
 *   const { user } = await requireApiAdmin(request);
 */
import { auth } from '@/lib/auth';

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

async function getApiSession() {
  const session = await auth();
  return session?.user ?? null;
}

export async function requireApiAuth(_req?: Request): Promise<{ user: ApiUser }> {
  const user = await getApiSession();
  if (!user) throw new ApiError(401, 'Unauthorized');
  return { user: user as ApiUser };
}

export async function requireApiAdmin(_req?: Request): Promise<{ user: ApiUser }> {
  const { user } = await requireApiAuth(_req);
  if (user.role !== 'ADMIN') throw new ApiError(403, 'Forbidden');
  return { user };
}

export async function requireApiPermission(
  permission: string,
  _req?: Request,
): Promise<{ user: ApiUser }> {
  const { user } = await requireApiAuth(_req);
  if (user.role === 'ADMIN') return { user };
  if (!user.permissions?.includes(permission)) {
    throw new ApiError(403, `Permission denied: ${permission}`);
  }
  return { user };
}

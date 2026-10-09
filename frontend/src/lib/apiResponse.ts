/**
 * apiResponse.ts — lightweight Next.js API response helpers
 */
import { NextResponse } from 'next/server';
import { ApiError } from './apiAuth';
import { ZodError } from 'zod';

export function ok(data: unknown, status = 200) {
  return NextResponse.json(data, { status });
}

export function err(message: string, status = 500) {
  return NextResponse.json({ error: message }, { status });
}

/**
 * Wrap an async handler and translate known error types automatically.
 * Usage:
 *   export const GET = handle(async (req) => { ... return ok(data); });
 */
export function handle(
  fn: (req: Request, ctx?: any) => Promise<NextResponse>,
) {
  return async (req: Request, ctx?: any): Promise<NextResponse> => {
    try {
      return await fn(req, ctx);
    } catch (e: any) {
      if (e instanceof ApiError) {
        return err(e.message, e.status);
      }
      if (e instanceof ZodError) {
        const issues = e.issues.map((i) => ({
          field:   i.path.join('.') || 'root',
          message: i.message,
        }));
        return NextResponse.json({ error: 'Validation failed', issues }, { status: 400 });
      }
      // Prisma unique constraint
      if (e?.code === 'P2002') return err('Already exists', 409);
      // Prisma not found
      if (e?.code === 'P2025') return err('Not found', 404);

      console.error('[API Error]', e);
      return err(e?.message || 'Internal server error', 500);
    }
  };
}

/** Write an AuditLog row — fire-and-forget, never throws */
export async function writeAudit(opts: {
  userId: number;
  action: string;
  targetType: string;
  targetId: number;
  before?: unknown;
  after?: unknown;
  ip?: string | null;
  userAgent?: string | null;
}) {
  const { db } = await import('@/lib/db');
  db.auditLog
    .create({
      data: {
        userId:     opts.userId,
        action:     opts.action,
        targetType: opts.targetType,
        targetId:   opts.targetId,
        before:     opts.before ?? undefined,
        after:      opts.after  ?? undefined,
        ip:         opts.ip     ?? null,
        userAgent:  opts.userAgent?.slice(0, 500) ?? null,
      },
    })
    .catch((e: any) => console.error('[audit] write failed:', e.message));
}

import { NextRequest } from 'next/server';
import { db } from '@/lib/db';
import { handle, ok, err } from '@/lib/apiResponse';
import { requireApiAdmin } from '@/lib/apiAuth';

type Ctx = { params: Promise<{ id: string }> };

// GET /api/import/logs/[id]
export const GET = handle(async (req: NextRequest, ctx: Ctx) => {
  await requireApiAdmin(req);
  const { id } = await ctx.params;

  const log = await db.importLog.findUnique({ where: { id: Number(id) } });
  if (!log) return err('ImportLog not found', 404);

  return ok(log);
});

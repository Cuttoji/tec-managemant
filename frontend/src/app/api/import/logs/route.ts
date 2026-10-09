import { NextRequest } from 'next/server';
import { db } from '@/lib/db';
import { handle, ok } from '@/lib/apiResponse';
import { requireApiAdmin } from '@/lib/apiAuth';

// GET /api/import/logs
export const GET = handle(async (req: NextRequest) => {
  await requireApiAdmin(req);

  const sp    = req.nextUrl.searchParams;
  const page  = Math.max(1, Number(sp.get('page')  ?? 1));
  const limit = Math.min(100, Number(sp.get('limit') ?? 25));
  const skip  = (page - 1) * limit;

  const [items, total] = await Promise.all([
    db.importLog.findMany({ skip, take: limit, orderBy: { id: 'desc' } }),
    db.importLog.count(),
  ]);

  return ok({ items, total, page, limit });
});

import { NextRequest } from 'next/server';
import { db } from '@/lib/db';
import { handle, ok } from '@/lib/apiResponse';
import { requireApiAuth } from '@/lib/apiAuth';

// GET /api/assets/stats
export const GET = handle(async (req: NextRequest) => {
  await requireApiAuth(req);

  const [total, needsReview, active, retired] = await Promise.all([
    db.asset.count(),
    db.asset.count({ where: { needsReview: true } }),
    db.asset.count({ where: { isActive: true, needsReview: false } }),
    db.asset.count({ where: { isActive: false } }),
  ]);

  return ok({ total, needsReview, active, retired });
});

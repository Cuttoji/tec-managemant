import { NextRequest } from 'next/server';
import { db } from '@/lib/db';
import { handle, ok, err, writeAudit } from '@/lib/apiResponse';
import { requireApiAdmin } from '@/lib/apiAuth';

type Ctx = { params: Promise<{ id: string }> };

// POST /api/assets/[id]/approve
export const POST = handle(async (req: NextRequest, ctx: Ctx) => {
  const { user } = await requireApiAdmin(req);
  const { id } = await ctx.params;

  const existing = await db.asset.findUnique({ where: { id: Number(id) } });
  if (!existing) return err('Asset not found', 404);

  const asset = await db.asset.update({
    where: { id: Number(id) },
    data: {
      needsReview: false,
      isActive:    true,
      approvedBy:  Number(user.id),
      approvedAt:  new Date(),
      rejectedBy:  null,
      rejectedAt:  null,
    },
  });

  await writeAudit({
    userId: Number(user.id), action: 'asset.approve',
    targetType: 'Asset', targetId: asset.id, after: asset,
    ip: req.headers.get('x-forwarded-for'),
    userAgent: req.headers.get('user-agent'),
  });

  return ok(asset);
});

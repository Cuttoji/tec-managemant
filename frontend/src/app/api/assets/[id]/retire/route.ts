import { NextRequest } from 'next/server';
import { db } from '@/lib/db';
import { handle, ok, writeAudit } from '@/lib/apiResponse';
import { requireApiAdmin } from '@/lib/apiAuth';

type Ctx = { params: Promise<{ id: string }> };

// POST /api/assets/[id]/retire
export const POST = handle(async (req: NextRequest, ctx: Ctx) => {
  const { user } = await requireApiAdmin(req);
  const { id } = await ctx.params;

  const asset = await db.asset.update({
    where: { id: Number(id) },
    data:  { isActive: false, retiredAt: new Date() },
  });

  await writeAudit({
    userId: Number(user.id), action: 'asset.retire',
    targetType: 'Asset', targetId: asset.id, after: asset,
    ip: req.headers.get('x-forwarded-for'),
    userAgent: req.headers.get('user-agent'),
  });

  return ok(asset);
});

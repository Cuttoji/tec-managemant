import { db } from '@/lib/db';
import { handle, ok, writeAudit } from '@/lib/apiResponse';
import { requireApiAdmin } from '@/lib/apiAuth';

type Ctx = { params?: Promise<Record<string, string>> };

// POST /api/assets/[id]/retire
export const POST = handle(async (req: Request, ctx: Ctx | undefined) => {
  const { user } = await requireApiAdmin(req);
  const { id } = await (ctx?.params ?? Promise.resolve({ id: '' }));

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

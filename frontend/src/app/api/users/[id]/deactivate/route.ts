import { NextRequest } from 'next/server';
import { db } from '@/lib/db';
import { handle, ok, err, writeAudit } from '@/lib/apiResponse';
import { requireApiAdmin } from '@/lib/apiAuth';

type Ctx = { params: Promise<{ id: string }> };

// POST /api/users/[id]/deactivate
export const POST = handle(async (req: NextRequest, ctx: Ctx) => {
  const { user: admin } = await requireApiAdmin(req);
  const { id } = await ctx.params;

  if (Number(id) === Number(admin.id)) {
    return err('Cannot deactivate yourself', 400);
  }

  await db.user.update({ where: { id: Number(id) }, data: { isActive: false } });

  await writeAudit({
    userId: Number(admin.id), action: 'user.deactivate',
    targetType: 'User', targetId: Number(id),
    ip: req.headers.get('x-forwarded-for'),
    userAgent: req.headers.get('user-agent'),
  });

  return ok({ ok: true });
});

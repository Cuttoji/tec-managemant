import { NextRequest } from 'next/server';
import { db } from '@/lib/db';
import { handle, ok, err, writeAudit } from '@/lib/apiResponse';
import { requireApiAdmin, requireApiPermission } from '@/lib/apiAuth';
import { updateLocationSchema } from '@/lib/schemas';

type Ctx = { params: Promise<{ id: string }> };

// PUT /api/locations/[id]
export const PUT = handle(async (req: NextRequest, ctx: Ctx) => {
  const { user } = await requireApiPermission('location:manage', req);
  const { id } = await ctx.params;

  const body = updateLocationSchema.parse(await req.json());

  const loc = await db.location.update({
    where: { id: Number(id) },
    data:  { name: body.name.trim() },
  });

  await writeAudit({
    userId: Number(user.id), action: 'location.update',
    targetType: 'Location', targetId: Number(id), after: loc,
    ip: req.headers.get('x-forwarded-for'),
    userAgent: req.headers.get('user-agent'),
  });

  return ok(loc);
});

// DELETE /api/locations/[id]
export const DELETE = handle(async (req: NextRequest, ctx: Ctx) => {
  const { user } = await requireApiAdmin(req);
  const { id } = await ctx.params;

  const count = await db.asset.count({ where: { locationId: Number(id) } });
  if (count > 0) {
    return err(`Cannot delete: ${count} asset(s) assigned to this location`, 409);
  }

  await db.location.delete({ where: { id: Number(id) } });

  await writeAudit({
    userId: Number(user.id), action: 'location.delete',
    targetType: 'Location', targetId: Number(id),
    ip: req.headers.get('x-forwarded-for'),
    userAgent: req.headers.get('user-agent'),
  });

  return ok({ ok: true });
});

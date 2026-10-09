import { NextRequest } from 'next/server';
import { db } from '@/lib/db';
import { handle, ok, err, writeAudit } from '@/lib/apiResponse';
import { requireApiAdmin } from '@/lib/apiAuth';
import { updateUserSchema } from '@/lib/schemas';

type Ctx = { params: Promise<{ id: string }> };

const VALID_ROLES = ['ADMIN', 'TECHNICIAN'];

// GET /api/users/[id]
export const GET = handle(async (req: NextRequest, ctx: Ctx) => {
  await requireApiAdmin(req);
  const { id } = await ctx.params;

  const user = await db.user.findUnique({
    where: { id: Number(id) },
    select: {
      id: true, name: true, email: true, role: true,
      primarySkill: true, isActive: true, createdAt: true,
      permissions: { select: { permission: true, grantedAt: true } },
    },
  });
  if (!user) return err('User not found', 404);

  return ok({ ...user, permissions: user.permissions.map((p) => p.permission) });
});

// PUT /api/users/[id]
export const PUT = handle(async (req: NextRequest, ctx: Ctx) => {
  const { user: admin } = await requireApiAdmin(req);
  const { id } = await ctx.params;

  const body = updateUserSchema.parse(await req.json());

  const updated = await db.user.update({
    where: { id: Number(id) },
    data:  {
      ...(body.name         !== undefined && { name:         body.name }),
      ...(body.primarySkill !== undefined && { primarySkill: body.primarySkill }),
    },
  });

  await writeAudit({
    userId: Number(admin.id), action: 'user.update',
    targetType: 'User', targetId: Number(id), after: updated,
    ip: req.headers.get('x-forwarded-for'),
    userAgent: req.headers.get('user-agent'),
  });

  return ok({ id: updated.id, name: updated.name, email: updated.email, role: updated.role });
});

import { NextRequest } from 'next/server';
import { db } from '@/lib/db';
import { handle, ok, err, writeAudit } from '@/lib/apiResponse';
import { requireApiAdmin } from '@/lib/apiAuth';
import { grantPermissionSchema } from '@/lib/schemas';

type Ctx = { params: Promise<{ id: string }> };

const GRANTABLE_PERMISSIONS = ['asset:edit', 'location:manage'];

// GET /api/users/[id]/permissions
export const GET = handle(async (req: NextRequest, ctx: Ctx) => {
  await requireApiAdmin(req);
  const { id } = await ctx.params;

  const perms = await db.userPermission.findMany({
    where:   { userId: Number(id) },
    select:  { permission: true, grantedAt: true },
    orderBy: { grantedAt: 'asc' },
  });

  return ok({ permissions: perms.map((p) => p.permission) });
});

// POST /api/users/[id]/permissions — grant
export const POST = handle(async (req: NextRequest, ctx: Ctx) => {
  const { user: admin } = await requireApiAdmin(req);
  const { id } = await ctx.params;

  const body = grantPermissionSchema.parse(await req.json());

  if (!GRANTABLE_PERMISSIONS.includes(body.permission)) {
    return err(`permission must be one of: ${GRANTABLE_PERMISSIONS.join(', ')}`, 400);
  }

  const target = await db.user.findUnique({ where: { id: Number(id) } });
  if (!target) return err('User not found', 404);
  if (target.role !== 'TECHNICIAN') {
    return err('Permissions can only be granted to TECHNICIAN users', 400);
  }

  const perm = await db.userPermission.create({
    data: { userId: Number(id), permission: body.permission, grantedBy: Number(admin.id) },
  });

  await writeAudit({
    userId: Number(admin.id), action: 'user.permission_grant',
    targetType: 'User', targetId: Number(id),
    after: { permission: perm.permission },
    ip: req.headers.get('x-forwarded-for'),
    userAgent: req.headers.get('user-agent'),
  });

  return ok({ permission: perm.permission }, 201);
});

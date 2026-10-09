import { NextRequest } from 'next/server';
import { db } from '@/lib/db';
import { handle, ok, err, writeAudit } from '@/lib/apiResponse';
import { requireApiAdmin } from '@/lib/apiAuth';

type Ctx = { params: Promise<{ id: string; permission: string }> };

const DEFAULT_PERMISSIONS  = ['maintenance:claim', 'maintenance:complete', 'maintenance:edit'];
const GRANTABLE_PERMISSIONS = ['asset:edit', 'location:manage'];

// DELETE /api/users/[id]/permissions/[permission]
export const DELETE = handle(async (req: NextRequest, ctx: Ctx) => {
  const { user: admin } = await requireApiAdmin(req);
  const { id, permission } = await ctx.params;

  if (DEFAULT_PERMISSIONS.includes(permission)) {
    return err('Default permissions cannot be revoked', 400);
  }
  if (!GRANTABLE_PERMISSIONS.includes(permission)) {
    return err(`Unknown permission: ${permission}`, 400);
  }

  await db.userPermission.delete({
    where: { userId_permission: { userId: Number(id), permission } },
  });

  await writeAudit({
    userId: Number(admin.id), action: 'user.permission_revoke',
    targetType: 'User', targetId: Number(id),
    before: { permission },
    ip: req.headers.get('x-forwarded-for'),
    userAgent: req.headers.get('user-agent'),
  });

  return ok({ ok: true });
});

import { NextRequest } from 'next/server';
import bcrypt from 'bcryptjs';
import { db } from '@/lib/db';
import { handle, ok, writeAudit } from '@/lib/apiResponse';
import { requireApiAdmin } from '@/lib/apiAuth';
import { createUserSchema } from '@/lib/schemas';

const DEFAULT_PERMISSIONS = ['maintenance:claim', 'maintenance:complete', 'maintenance:edit'];

// GET /api/users
export const GET = handle(async (req: NextRequest) => {
  await requireApiAdmin(req);

  const users = await db.user.findMany({
    where:   { isActive: true },
    select: {
      id: true, name: true, email: true, role: true,
      primarySkill: true, createdAt: true,
      permissions: { select: { permission: true } },
    },
    orderBy: { id: 'asc' },
  });

  const items = users.map((u) => ({
    ...u,
    permissions: u.permissions.map((p) => p.permission),
  }));

  return ok({ items });
});

// POST /api/users
export const POST = handle(async (req: NextRequest) => {
  const { user } = await requireApiAdmin(req);
  const body = createUserSchema.parse(await req.json());

  const hash    = await bcrypt.hash(body.password, 10);
  const created = await db.user.create({
    data: {
      name:         body.name,
      email:        body.email,
      passwordHash: hash,
      role:         body.role ?? 'TECHNICIAN',
      primarySkill: body.primarySkill ?? null,
    },
  });

  if (created.role === 'TECHNICIAN') {
    await db.userPermission.createMany({
      data: DEFAULT_PERMISSIONS.map((permission) => ({
        userId:    created.id,
        permission,
        grantedBy: Number(user.id),
      })),
      skipDuplicates: true,
    });
  }

  await writeAudit({
    userId: Number(user.id), action: 'user.create',
    targetType: 'User', targetId: created.id,
    after: { id: created.id, email: created.email, role: created.role },
    ip: req.headers.get('x-forwarded-for'),
    userAgent: req.headers.get('user-agent'),
  });

  return ok({
    id: created.id, name: created.name, email: created.email, role: created.role,
    permissions: created.role === 'TECHNICIAN' ? DEFAULT_PERMISSIONS : [],
  }, 201);
});

'use server';

import bcrypt            from 'bcryptjs';
import { db }            from '@/lib/db';
import { requireSession } from '@/lib/auth';
import { writeAuditLog } from '@/lib/audit';
import { safeAction }    from '@/lib/errors';
import { assertAdmin }   from '@/lib/rbac';
import { revalidateUsers } from '@/lib/cache';
import {
  createUserSchema, updateUserSchema, grantPermissionSchema,
  type CreateUserInput, type UpdateUserInput, type GrantPermissionInput,
} from './schema';

// Default permissions seeded for every new TECHNICIAN
const DEFAULT_TECHNICIAN_PERMISSIONS = [
  'maintenance:claim',
  'maintenance:complete',
  'maintenance:edit',
];

export async function createUserAction(input: CreateUserInput) {
  return safeAction(async () => {
    const session = await requireSession();
    assertAdmin(session.user.role);

    const data = createUserSchema.parse(input);
    const hash = await bcrypt.hash(data.password, 10);

    const user = await db.user.create({
      data: {
        name:         data.name,
        email:        data.email,
        passwordHash: hash,
        role:         data.role,
        primarySkill: data.primarySkill ?? null,
      },
    });

    // Seed default permissions for technicians
    if (data.role === 'TECHNICIAN') {
      await db.userPermission.createMany({
        data: DEFAULT_TECHNICIAN_PERMISSIONS.map((permission) => ({
          userId:    user.id,
          permission,
          grantedBy: Number(session.user.id),
        })),
        skipDuplicates: true,
      });
    }

    writeAuditLog({
      userId:     Number(session.user.id),
      action:     'user.create',
      targetType: 'User',
      targetId:   user.id,
      after:      { email: user.email, role: user.role },
    });

    revalidateUsers();
    return { id: user.id, email: user.email, role: user.role };
  });
}

export async function updateUserAction(id: number, input: UpdateUserInput) {
  return safeAction(async () => {
    const session = await requireSession();
    assertAdmin(session.user.role);

    const data = updateUserSchema.parse(input);
    const user = await db.user.update({ where: { id }, data });

    writeAuditLog({
      userId:     Number(session.user.id),
      action:     'user.update',
      targetType: 'User',
      targetId:   id,
      after:      data,
    });

    revalidateUsers();
    return user;
  });
}

export async function deactivateUserAction(id: number) {
  return safeAction(async () => {
    const session = await requireSession();
    assertAdmin(session.user.role);

    if (id === Number(session.user.id)) {
      throw new Error('ไม่สามารถปิดการใช้งานบัญชีของตัวเองได้');
    }

    await db.user.update({ where: { id }, data: { isActive: false } });

    writeAuditLog({
      userId:     Number(session.user.id),
      action:     'user.deactivate',
      targetType: 'User',
      targetId:   id,
    });

    revalidateUsers();
    return { ok: true };
  });
}

export async function grantPermissionAction(userId: number, input: GrantPermissionInput) {
  return safeAction(async () => {
    const session = await requireSession();
    assertAdmin(session.user.role);

    const { permission } = grantPermissionSchema.parse(input);

    await db.userPermission.upsert({
      where:  { userId_permission: { userId, permission } },
      create: { userId, permission, grantedBy: Number(session.user.id) },
      update: {},
    });

    writeAuditLog({
      userId:     Number(session.user.id),
      action:     'user.permission_grant',
      targetType: 'User',
      targetId:   userId,
      after:      { permission },
    });

    revalidateUsers();
    return { ok: true };
  });
}

export async function revokePermissionAction(userId: number, permission: string) {
  return safeAction(async () => {
    const session = await requireSession();
    assertAdmin(session.user.role);

    await db.userPermission.deleteMany({ where: { userId, permission } });

    writeAuditLog({
      userId:     Number(session.user.id),
      action:     'user.permission_revoke',
      targetType: 'User',
      targetId:   userId,
      after:      { permission },
    });

    revalidateUsers();
    return { ok: true };
  });
}

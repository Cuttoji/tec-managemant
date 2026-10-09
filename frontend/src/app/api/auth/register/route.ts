import { NextRequest } from 'next/server';
import bcrypt from 'bcryptjs';
import { db } from '@/lib/db';
import { handle, ok } from '@/lib/apiResponse';
import { registerSchema } from '@/lib/schemas';

const DEFAULT_PERMISSIONS = ['maintenance:claim', 'maintenance:complete', 'maintenance:edit'];

export const POST = handle(async (req: NextRequest) => {
  const body = registerSchema.parse(await req.json());
  const { email, password, name, role = 'TECHNICIAN' } = body;

  const hash = await bcrypt.hash(password, 10);
  const user = await db.user.create({
    data: {
      name: name ?? email.split('@')[0],
      email,
      passwordHash: hash,
      role,
    },
  });

  if (role === 'TECHNICIAN') {
    await db.userPermission.createMany({
      data: DEFAULT_PERMISSIONS.map((permission) => ({
        userId:    user.id,
        permission,
        grantedBy: user.id,
      })),
      skipDuplicates: true,
    });
  }

  return ok({ id: user.id, email: user.email, role: user.role }, 201);
});

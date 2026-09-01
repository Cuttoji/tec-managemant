import { z } from 'zod';

export const createUserSchema = z.object({
  name:         z.string().min(1, 'กรุณากรอกชื่อ').max(100),
  email:        z.string().email('อีเมลไม่ถูกต้อง'),
  password:     z.string().min(6, 'รหัสผ่านต้องมีอย่างน้อย 6 ตัวอักษร'),
  role:         z.enum(['ADMIN', 'TECHNICIAN']).default('TECHNICIAN'),
  primarySkill: z.string().max(200).optional().nullable(),
});

export const updateUserSchema = z.object({
  name:         z.string().min(1).max(100).optional(),
  primarySkill: z.string().max(200).optional().nullable(),
});

export const grantPermissionSchema = z.object({
  permission: z.enum(['asset:edit', 'location:manage']),
});

export type CreateUserInput      = z.infer<typeof createUserSchema>;
export type UpdateUserInput      = z.infer<typeof updateUserSchema>;
export type GrantPermissionInput = z.infer<typeof grantPermissionSchema>;

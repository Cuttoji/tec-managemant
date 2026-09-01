import { db } from '@/lib/db';

const USER_SELECT = {
  id:          true,
  name:        true,
  email:       true,
  role:        true,
  primarySkill: true,
  isActive:    true,
  createdAt:   true,
  permissions: { select: { permission: true } },
} as const;

export async function listUsers(includeInactive = false) {
  return db.user.findMany({
    where:   includeInactive ? undefined : { isActive: true },
    orderBy: { name: 'asc' },
    select:  USER_SELECT,
  });
}

export async function getUser(id: number) {
  return db.user.findUnique({
    where:  { id },
    select: USER_SELECT,
  });
}

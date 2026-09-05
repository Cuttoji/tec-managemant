// Prisma `Role` type unavailable in this build — declare local Role union
export type Role = 'ADMIN' | 'TECHNICIAN';

// ─── Permission registry ──────────────────────────────────────────────────────

export type Permission =
  | 'maintenance:claim'
  | 'maintenance:complete'
  | 'maintenance:edit'
  | 'asset:edit'
  | 'asset:approve'
  | 'asset:retire'
  | 'location:manage'
  | 'user:manage'
  | 'import:run';

const ROLE_PERMISSIONS: Record<string, Permission[]> = {
  ADMIN: [
    'maintenance:claim',
    'maintenance:complete',
    'maintenance:edit',
    'asset:edit',
    'asset:approve',
    'asset:retire',
    'location:manage',
    'user:manage',
    'import:run',
  ],
  TECHNICIAN: [
    'maintenance:claim',
    'maintenance:complete',
    'maintenance:edit',
  ],
};

// ─── Checks ───────────────────────────────────────────────────────────────────

/** Check if a role has a base permission */
export function roleHas(role: string, permission: Permission): boolean {
  return ROLE_PERMISSIONS[role]?.includes(permission) ?? false;
}

/**
 * Check if a user (role + granted extra permissions) has a permission.
 * Use this in Server Actions and components.
 */
export function can(
  role: string,
  extraPermissions: string[],
  permission: Permission
): boolean {
  return roleHas(role, permission) || extraPermissions.includes(permission);
}

/** Throw FORBIDDEN if user doesn't have permission */
export function assertPermission(
  role: string,
  extraPermissions: string[],
  permission: Permission
): void {
  if (!can(role, extraPermissions, permission)) {
    throw new Error('FORBIDDEN');
  }
}

/** Throw FORBIDDEN if user is not admin */
export function assertAdmin(role: string): void {
  if (role !== 'ADMIN') throw new Error('FORBIDDEN');
}

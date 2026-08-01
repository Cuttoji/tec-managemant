import { useMemo } from 'react';

export type UserRole = 'ADMIN' | 'TECHNICIAN';

export interface AuthUser {
  id: number;
  email: string;
  name: string;
  role: UserRole;
  permissions: string[];
}

const ALL_PERMISSIONS = [
  'maintenance:claim',
  'maintenance:complete',
  'maintenance:edit',
  'asset:edit',
  'location:manage',
];

/**
 * Reads the JWT + permissions stored in localStorage after login.
 * Returns null if not authenticated or token is expired.
 */
export function useAuth(): AuthUser | null {
  return useMemo(() => {
    if (typeof window === 'undefined') return null;

    const token = localStorage.getItem('token');
    const userRaw = localStorage.getItem('user');
    const permsRaw = localStorage.getItem('permissions');

    if (!token || !userRaw) return null;

    try {
      // Check expiry from JWT payload (no signature verification — server handles that)
      const payload = JSON.parse(atob(token.split('.')[1]));
      if (payload.exp && payload.exp * 1000 < Date.now()) {
        // Token expired — clear storage
        localStorage.removeItem('token');
        localStorage.removeItem('user');
        localStorage.removeItem('permissions');
        return null;
      }

      const user = JSON.parse(userRaw) as { id: number; email: string; name: string; role: UserRole };
      const permissions: string[] = user.role === 'ADMIN'
        ? ALL_PERMISSIONS
        : permsRaw ? JSON.parse(permsRaw) : [];

      return { ...user, permissions };
    } catch {
      return null;
    }
  }, []);
}

/**
 * Standalone helper — checks a permission without the hook (for use outside components).
 */
export function hasPermission(permission: string): boolean {
  if (typeof window === 'undefined') return false;
  const userRaw = localStorage.getItem('user');
  if (!userRaw) return false;
  try {
    const user = JSON.parse(userRaw) as { role: UserRole };
    if (user.role === 'ADMIN') return true;
    const permsRaw = localStorage.getItem('permissions');
    const perms: string[] = permsRaw ? JSON.parse(permsRaw) : [];
    return perms.includes(permission);
  } catch {
    return false;
  }
}

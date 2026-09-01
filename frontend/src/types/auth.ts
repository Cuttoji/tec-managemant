import type { Role } from '@prisma/client';

export interface SessionUser {
  id:          string;
  name:        string;
  email:       string;
  role:        Role;
  permissions: string[];
}

export type { Role };

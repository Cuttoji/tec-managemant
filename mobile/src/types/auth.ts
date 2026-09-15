export type Role = 'ADMIN' | 'TECHNICIAN';

export interface SessionUser {
  id: string;
  name: string;
  email: string;
  role: string;
  permissions: string[];
}

export interface LoginResponse {
  token: string;
  user: {
    id: number;
    name: string;
    email: string;
    role: Role;
  };
  permissions: string[];
}

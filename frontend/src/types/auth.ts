// Frontend-local Role type
export type Role = 'ADMIN' | 'TECHNICIAN';

export interface SessionUser {
  id: string;
  name: string;
  email: string;
  role: string; // runtime session may carry a plain string
  permissions: string[];
}

// Role type available above

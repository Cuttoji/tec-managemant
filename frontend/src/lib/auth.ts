import NextAuth from 'next-auth';
import Credentials from 'next-auth/providers/credentials';
import { z } from 'zod';
import { db } from '@/lib/db';
// Prisma `Role` type can be unavailable in the frontend build; use `string` instead

// ─── Types ────────────────────────────────────────────────────────────────────

declare module 'next-auth' {
  interface Session {
    user: {
      id: string;
      name: string;
      email: string;
      role: string;
      permissions: string[];
    };
  }
  interface User {
    id?: string;
    name?: string | null;
    email?: string | null;
    role?: string | null;
    permissions?: string[] | null;
  }
}

// ─── Permissions ──────────────────────────────────────────────────────────────

const DEFAULT_TECHNICIAN_PERMISSIONS = [
  'maintenance:claim',
  'maintenance:complete',
  'maintenance:edit',
] as const;

const ALL_ADMIN_PERMISSIONS = [
  ...DEFAULT_TECHNICIAN_PERMISSIONS,
  'asset:edit',
  'asset:approve',
  'asset:retire',
  'location:manage',
  'user:manage',
  'import:run',
] as const;

// ─── Auth config ──────────────────────────────────────────────────────────────

export const { handlers, signIn, signOut, auth } = NextAuth({
  secret: process.env.AUTH_SECRET,
  session: { strategy: 'jwt', maxAge: 8 * 60 * 60 }, // 8 hours

  pages: {
    signIn: '/login',
    error:  '/login',
  },

  providers: [
    Credentials({
      credentials: {
        email:    { label: 'Email',    type: 'email' },
        password: { label: 'Password', type: 'password' },
      },
      async authorize(credentials) {
        const bcrypt = (await import('bcryptjs')).default;
        // Validate input shape
        const parsed = z
          .object({
            email:    z.string().email(),
            password: z.string().min(1),
          })
          .safeParse(credentials);

        if (!parsed.success) return null;

        const { email, password } = parsed.data;

        const user = await db.user.findUnique({
          where: { email },
          include: {
            permissions: { select: { permission: true } },
          },
        });

        if (!user || !user.isActive) return null;

        const valid = await bcrypt.compare(password, user.passwordHash);
        if (!valid) return null;

        // Build permissions list
        const permissions: string[] =
          user.role === 'ADMIN'
            ? [...ALL_ADMIN_PERMISSIONS]
            : user.permissions.map((p: any) => p.permission);

        return {
          id:          String(user.id),
          name:        user.name,
          email:       user.email,
          role:        user.role,
          permissions,
        };
      },
    }),
  ],

  callbacks: {
    jwt({ token, user }) {
      if (user) {
        token.id          = user.id;
        token.role        = user.role;
        token.permissions = user.permissions;
      }
      return token;
    },
    session({ session, token }) {
      session.user.id          = token.id as string;
      session.user.role        = token.role as string;
      session.user.permissions = token.permissions as string[];
      return session;
    },
  },
});

// ─── Helpers ──────────────────────────────────────────────────────────────────

/** Get session and throw if unauthenticated */
export async function requireSession() {
  const session = await auth();
  if (!session?.user) {
    throw new Error('UNAUTHORIZED');
  }
  return session;
}

/** Get session and throw if not admin */
export async function requireAdmin() {
  const session = await requireSession();
  if (session.user.role !== 'ADMIN') {
    throw new Error('FORBIDDEN');
  }
  return session;
}

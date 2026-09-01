import { auth } from '@/lib/auth';
import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

export default auth((req: NextRequest & { auth: any }) => {
  const { pathname } = req.nextUrl;
  const session = req.auth;

  // Public paths — always allow
  if (pathname.startsWith('/login') || pathname.startsWith('/api/auth')) {
    // Redirect authenticated users away from login
    if (session?.user && pathname === '/login') {
      return NextResponse.redirect(new URL('/dashboard', req.url));
    }
    return NextResponse.next();
  }

  // Protected — redirect to login if not authenticated
  if (!session?.user) {
    const loginUrl = new URL('/login', req.url);
    loginUrl.searchParams.set('callbackUrl', pathname);
    return NextResponse.redirect(loginUrl);
  }

  // Admin-only routes
  const adminOnlyPaths = ['/users', '/audit-logs'];
  if (adminOnlyPaths.some((p) => pathname.startsWith(p)) && session.user.role !== 'ADMIN') {
    return NextResponse.redirect(new URL('/dashboard', req.url));
  }

  return NextResponse.next();
});

export const config = {
  matcher: [
    /*
     * Match all paths except:
     * - _next/static, _next/image (Next.js internals)
     * - favicon.ico
     * - api/auth (NextAuth endpoints)
     */
    '/((?!_next/static|_next/image|favicon.ico|api/auth).*)',
  ],
};

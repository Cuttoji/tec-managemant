import { useEffect, useState } from 'react';
import { useRouter } from 'next/router';

const PUBLIC_PATHS = ['/login'];
const IS_MOCK = process.env.NEXT_PUBLIC_MOCK === 'true';

export default function AuthGuard({ children }: { children: React.ReactNode }) {
  const router = useRouter();
  const [ready, setReady] = useState(false);

  useEffect(() => {
    if (PUBLIC_PATHS.includes(router.pathname)) {
      setReady(true);
      return;
    }

    // Mock mode: inject fake auth automatically so all pages are accessible
    if (IS_MOCK) {
      if (!localStorage.getItem('token')) {
        const token = `eyJhbGciOiJIUzI1NiJ9.${btoa(JSON.stringify({ id: 1, exp: Math.floor(Date.now() / 1000) + 86400 }))}.mock`;
        localStorage.setItem('token', token);
        localStorage.setItem('user', JSON.stringify({ id: 1, name: 'Admin User', email: 'admin@demo.com', role: 'ADMIN' }));
        localStorage.setItem('permissions', JSON.stringify(['maintenance:claim','maintenance:complete','maintenance:edit','asset:edit','location:manage']));
      }
      setReady(true);
      return;
    }

    const token = localStorage.getItem('token');
    if (!token) {
      router.replace('/login');
      return;
    }
    // Check expiry
    try {
      const payload = JSON.parse(atob(token.split('.')[1]));
      if (payload.exp && payload.exp * 1000 < Date.now()) {
        localStorage.removeItem('token');
        localStorage.removeItem('user');
        localStorage.removeItem('permissions');
        router.replace('/login');
        return;
      }
    } catch {
      router.replace('/login');
      return;
    }
    setReady(true);
  }, [router.pathname]);

  if (!ready) {
    return (
      <div className="page-loading" style={{ minHeight: '100vh' }}>
        <div className="spinner" />
        <span>กำลังโหลด...</span>
      </div>
    );
  }
  return <>{children}</>;
}

import { useEffect, useState } from 'react';
import { useRouter } from 'next/router';

const PUBLIC_PATHS = ['/login'];

export default function AuthGuard({ children }: { children: React.ReactNode }) {
  const router = useRouter();
  const [ready, setReady] = useState(false);

  useEffect(() => {
    if (PUBLIC_PATHS.includes(router.pathname)) {
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

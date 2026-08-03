import '../styles/globals.css';
import type { AppProps } from 'next/app';
import { useState, useEffect } from 'react';
import { useRouter } from 'next/router';
import Sidebar from '../src/components/Sidebar';
import AuthGuard from '../src/components/AuthGuard';

const NO_SIDEBAR = ['/login'];

export default function App({ Component, pageProps }: AppProps) {
  const router = useRouter();
  const showSidebar = !NO_SIDEBAR.includes(router.pathname);
  const [sidebarOpen, setSidebarOpen] = useState(false);

  // Close sidebar on route change
  useEffect(() => {
    setSidebarOpen(false);
  }, [router.pathname]);

  // Prevent body scroll when sidebar drawer is open on mobile
  useEffect(() => {
    if (typeof document === 'undefined') return;
    document.body.style.overflow = sidebarOpen ? 'hidden' : '';
    return () => { document.body.style.overflow = ''; };
  }, [sidebarOpen]);

  return (
    <AuthGuard>
      {showSidebar ? (
        <div className="app-layout">
          <Sidebar mobileOpen={sidebarOpen} onClose={() => setSidebarOpen(false)} />
          <div className="page-wrap">
            {/* Top bar — visible on mobile only via CSS */}
            <div className="topbar">
              <button
                className="topbar-hamburger"
                onClick={() => setSidebarOpen(o => !o)}
                aria-label="เปิดเมนู"
              >
                ☰
              </button>
              <span className="topbar-title">⚙️ TechManage</span>
            </div>

            <div className="page-content">
              <Component {...pageProps} />
            </div>
          </div>
        </div>
      ) : (
        <Component {...pageProps} />
      )}
    </AuthGuard>
  );
}

'use client';

import * as React from 'react';
import { Sidebar } from './sidebar';
import { Topbar }  from './topbar';
import { ToastProvider } from '@/components/ui/toast';
import type { SessionUser } from '@/types/auth';

interface DashboardLayoutProps {
  user:     SessionUser;
  children: React.ReactNode;
}

export function DashboardLayout({ user, children }: DashboardLayoutProps) {
  const [sidebarOpen, setSidebarOpen] = React.useState(false);

  // Lock body scroll when sidebar drawer open (mobile)
  React.useEffect(() => {
    document.body.style.overflow = sidebarOpen ? 'hidden' : '';
    return () => { document.body.style.overflow = ''; };
  }, [sidebarOpen]);

  return (
    <ToastProvider>
      <div className="flex min-h-screen">
        <Sidebar
          user={user}
          mobileOpen={sidebarOpen}
          onClose={() => setSidebarOpen(false)}
        />

        {/* Main area — offset by sidebar width on desktop */}
        <div className="flex flex-1 flex-col lg:ml-[var(--sidebar-w)]">
          {/* Mobile topbar */}
          <Topbar onMenuClick={() => setSidebarOpen((o) => !o)} />

          {/* Page content */}
          <main className="flex-1 px-4 py-6 md:px-8 page-enter">
            {children}
          </main>
        </div>
      </div>
    </ToastProvider>
  );
}

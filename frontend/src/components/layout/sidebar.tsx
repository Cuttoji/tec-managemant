'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { signOut } from 'next-auth/react';
import { cn } from '@/lib/utils';
import type { SessionUser } from '@/types/auth';
import {
  Monitor, Wrench, Printer, CheckSquare, Users,
  Upload, ClipboardList, LogOut, Settings,
} from 'lucide-react';

interface NavItem {
  href:      string;
  icon:      React.ReactNode;
  label:     string;
  adminOnly?: boolean;
}

const NAV: NavItem[] = [
  { href: '/dashboard',        icon: <Monitor    className="h-4 w-4" />, label: 'Assets' },
  { href: '/tickets',          icon: <Wrench     className="h-4 w-4" />, label: 'Maintenance' },
  { href: '/printer-summary',  icon: <Printer    className="h-4 w-4" />, label: 'สรุปเครื่องพิมพ์' },
  { href: '/review',           icon: <CheckSquare className="h-4 w-4" />, label: 'Review',       adminOnly: true },
  { href: '/users',            icon: <Users      className="h-4 w-4" />, label: 'Users',         adminOnly: true },
  { href: '/import',           icon: <Upload     className="h-4 w-4" />, label: 'Import',        adminOnly: true },
  { href: '/audit-logs',       icon: <ClipboardList className="h-4 w-4" />, label: 'Audit Logs', adminOnly: true },
];

interface SidebarProps {
  user:        SessionUser;
  mobileOpen?: boolean;
  onClose?:    () => void;
}

export function Sidebar({ user, mobileOpen = false, onClose }: SidebarProps) {
  const pathname = usePathname();
  const visible  = NAV.filter((n) => !n.adminOnly || user.role === 'ADMIN');
  const initials = user.name.split(' ').map((w) => w[0]).join('').slice(0, 2).toUpperCase();

  return (
    <>
      {/* Mobile backdrop */}
      {mobileOpen && (
        <div className="fixed inset-0 z-40 bg-black/50 lg:hidden" onClick={onClose} aria-hidden />
      )}

      <aside className={cn(
        'fixed top-0 left-0 z-50 flex h-full flex-col bg-[hsl(var(--sidebar-bg))] text-white transition-transform duration-300 ease-in-out',
        'w-[var(--sidebar-w)]',
        // Desktop: always visible
        'lg:translate-x-0',
        // Mobile: slide in/out
        mobileOpen ? 'translate-x-0' : '-translate-x-full lg:translate-x-0'
      )}>
        {/* Logo */}
        <div className="border-b border-white/10 px-5 py-4">
          <div className="text-[15px] font-bold tracking-tight">⚙️ TechManage</div>
          <div className="mt-0.5 text-[11px] text-gray-400">ระบบจัดการครุภัณฑ์</div>
        </div>

        {/* Nav */}
        <nav className="flex-1 overflow-y-auto py-3">
          <div className="px-4 py-1 text-[10px] font-semibold uppercase tracking-widest text-gray-500">
            เมนูหลัก
          </div>
          {visible.map((item) => {
            const active = pathname === item.href ||
              (item.href !== '/dashboard' && pathname.startsWith(item.href));
            return (
              <Link
                key={item.href}
                href={item.href}
                onClick={onClose}
                className={cn(
                  'flex items-center gap-3 px-5 py-2.5 text-[13.5px] font-medium transition-colors',
                  active
                    ? 'bg-primary text-white'
                    : 'text-gray-400 hover:bg-white/10 hover:text-white'
                )}
              >
                {item.icon}
                {item.label}
              </Link>
            );
          })}
        </nav>

        {/* User info */}
        <div className="border-t border-white/10 px-4 py-3">
          <div className="flex items-center gap-3">
            <div className="flex h-8 w-8 flex-shrink-0 items-center justify-center rounded-full bg-primary text-xs font-bold">
              {initials}
            </div>
            <div className="min-w-0 flex-1">
              <div className="truncate text-[13px] font-semibold">{user.name}</div>
              <span className="rounded-full bg-white/10 px-1.5 py-0.5 text-[10px] text-gray-400">
                {user.role}
              </span>
            </div>
            <button
              onClick={() => signOut({ callbackUrl: '/login' })}
              title="ออกจากระบบ"
              className="rounded-md p-1.5 text-gray-400 hover:bg-white/10 hover:text-white transition-colors"
              aria-label="ออกจากระบบ"
            >
              <LogOut className="h-4 w-4" />
            </button>
          </div>
        </div>
      </aside>
    </>
  );
}

import Link from 'next/link';
import { useRouter } from 'next/router';
import { useAuth } from '../hooks/useAuth';

interface NavItem {
  href: string;
  icon: string;
  label: string;
  adminOnly?: boolean;
}

const NAV: NavItem[] = [
  { href: '/',                 icon: '🖥️',  label: 'Assets' },
  { href: '/maintenance',      icon: '🔧',  label: 'Maintenance' },
  { href: '/printer-summary',  icon: '🖨️',  label: 'สรุปเครื่องพิมพ์' },
  { href: '/review',           icon: '✅',  label: 'Review',      adminOnly: true },
  { href: '/users',            icon: '👥',  label: 'Users',       adminOnly: true },
  { href: '/import',           icon: '📥',  label: 'Import',      adminOnly: true },
  { href: '/import/logs',      icon: '📋',  label: 'Import Logs', adminOnly: true },
];

interface SidebarProps {
  mobileOpen: boolean;
  onClose: () => void;
}

export default function Sidebar({ mobileOpen, onClose }: SidebarProps) {
  const router = useRouter();
  const auth = useAuth();

  const logout = () => {
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    localStorage.removeItem('permissions');
    onClose();
    router.push('/login');
  };

  const initials = auth?.name
    ? auth.name.split(' ').map((w: string) => w[0]).join('').slice(0, 2).toUpperCase()
    : '?';

  const visible = NAV.filter(n => !n.adminOnly || auth?.role === 'ADMIN');

  return (
    <>
      <aside className={`sidebar${mobileOpen ? ' sidebar-open' : ''}`}>
        {/* Logo */}
        <div className="sidebar-logo">
          <div className="sidebar-logo-title">⚙️ TechManage</div>
          <div className="sidebar-logo-sub">ระบบจัดการครุภัณฑ์</div>
        </div>

        {/* Nav */}
        <nav className="sidebar-nav">
          <div className="sidebar-section">เมนูหลัก</div>
          {visible.map(item => {
            const active = router.pathname === item.href ||
              (item.href !== '/' && router.pathname.startsWith(item.href));
            return (
              <Link
                key={item.href}
                href={item.href}
                className={`nav-item${active ? ' active' : ''}`}
                onClick={onClose}
              >
                <span className="nav-icon">{item.icon}</span>
                {item.label}
              </Link>
            );
          })}
        </nav>

        {/* User info */}
        {auth && (
          <div className="sidebar-user">
            <div className="sidebar-avatar">{initials}</div>
            <div style={{ minWidth: 0 }}>
              <div className="sidebar-user-name" style={{ overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                {auth.name}
              </div>
              <span className="sidebar-user-role">{auth.role}</span>
            </div>
            <button
              onClick={logout}
              title="Logout"
              style={{ marginLeft: 'auto', background: 'none', border: 'none', cursor: 'pointer', color: 'var(--gray-400)', fontSize: 16 }}
            >
              ⏻
            </button>
          </div>
        )}
      </aside>

      {/* Backdrop — click to close on mobile */}
      {mobileOpen && (
        <div
          className="sidebar-backdrop visible"
          onClick={onClose}
          aria-hidden="true"
        />
      )}
    </>
  );
}

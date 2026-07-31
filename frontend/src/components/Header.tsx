import Link from 'next/link';

export default function Header() {
  const logout = () => {
    if (typeof window !== 'undefined') {
      localStorage.removeItem('token');
      window.location.href = '/login';
    }
  };

  return (
    <header style={{ padding: 12, borderBottom: '1px solid #eee', marginBottom: 12 }}>
      <nav style={{ display: 'flex', gap: 12 }}>
        <Link href={'/'}>Assets</Link>
        <Link href={'/import'}>Import CSV</Link>
        <Link href={'/import/logs'}>Import Logs</Link>
        <Link href={'/users'}>Users</Link>
        <Link href={'/locations'}>Locations</Link>
        <Link href={'/maintenance'}>Maintenance</Link>
        <a onClick={logout} style={{ cursor: 'pointer' }}>Logout</a>
      </nav>
    </header>
  );
}

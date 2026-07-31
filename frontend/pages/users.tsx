import useSWR from 'swr';
import { get } from '../src/lib/api';

export default function UsersPage() {
  const { data, error } = useSWR('/users', () => get('/users'));
  if (error) return <div>Failed to load users: {String(error)}</div>;
  if (!data) return <div>Loading...</div>;

  return (
    <main style={{ padding: 20 }}>
      <h1>Users</h1>
      <table style={{ width: '100%', borderCollapse: 'collapse' }}>
        <thead>
          <tr><th>ID</th><th>Name</th><th>Email</th><th>Role</th></tr>
        </thead>
        <tbody>
          {data.items.map((u: any) => (
            <tr key={u.id} style={{ borderTop: '1px solid #eee' }}>
              <td style={{ padding: 8 }}>{u.id}</td>
              <td style={{ padding: 8 }}>{u.name}</td>
              <td style={{ padding: 8 }}>{u.email}</td>
              <td style={{ padding: 8 }}>{u.role}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </main>
  );
}

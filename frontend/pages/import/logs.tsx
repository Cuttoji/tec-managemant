import useSWR from 'swr';
import { get } from '../../src/lib/api';

export default function ImportLogs() {
  const { data, error } = useSWR('/import/logs', () => get('/import/logs'));

  if (error) return <div>Failed to load logs: {String(error)}</div>;
  if (!data) return <div>Loading...</div>;

  return (
    <main style={{ padding: 20 }}>
      <h1>Import Logs</h1>
      <table style={{ width: '100%', borderCollapse: 'collapse' }}>
        <thead>
          <tr><th>id</th><th>filename</th><th>unmatched</th><th>createdAt</th></tr>
        </thead>
        <tbody>
          {data.items.map((l: any) => (
            <tr key={l.id} style={{ borderTop: '1px solid #eee' }}>
              <td style={{ padding: 8 }}>{l.id}</td>
              <td style={{ padding: 8 }}>{l.filename}</td>
              <td style={{ padding: 8 }}>{l.unmatchedCount}</td>
              <td style={{ padding: 8 }}>{new Date(l.createdAt).toLocaleString()}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </main>
  );
}

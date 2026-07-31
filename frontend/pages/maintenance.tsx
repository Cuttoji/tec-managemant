import useSWR from 'swr';
import { get, post } from '../src/lib/api';
import { useState } from 'react';

export default function MaintenancePage() {
  const { data, error, mutate } = useSWR('/maintenance', () => get('/maintenance'));
  const [assetId, setAssetId] = useState('');
  const [notes, setNotes] = useState('');

  async function create() {
    try {
      await post('/maintenance', { assetId: Number(assetId), notes });
      setAssetId(''); setNotes('');
      mutate();
    } catch (err: any) {
      alert(err.message || String(err));
    }
  }

  if (error) return <div>Failed to load maintenance logs</div>;
  if (!data) return <div>Loading...</div>;

  return (
    <main style={{ padding: 20 }}>
      <h1>Maintenance Logs</h1>
      <div>
        <input placeholder="Asset ID" value={assetId} onChange={e => setAssetId(e.target.value)} />
        <input placeholder="Notes" value={notes} onChange={e => setNotes(e.target.value)} />
        <button onClick={create}>Create</button>
      </div>
      <ul>
        {data.items.map((m: any) => (
          <li key={m.id}>#{m.id} asset:{m.assetId} {m.notes} ({new Date(m.createdAt).toLocaleString()})</li>
        ))}
      </ul>
    </main>
  );
}

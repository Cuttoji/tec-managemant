import useSWR from 'swr';
import { get, post } from '../src/lib/api';
import { useState } from 'react';

export default function LocationsPage() {
  const { data, error, mutate } = useSWR('/locations', () => get('/locations'));
  const [name, setName] = useState('');

  async function create() {
    try {
      await post('/locations', { name });
      setName('');
      mutate();
    } catch (err: any) {
      alert(err.message || String(err));
    }
  }

  if (error) return <div>Failed to load locations</div>;
  if (!data) return <div>Loading...</div>;

  return (
    <main style={{ padding: 20 }}>
      <h1>Locations</h1>
      <div>
        <input placeholder="New location name" value={name} onChange={e => setName(e.target.value)} />
        <button onClick={create}>Create</button>
      </div>
      <ul>
        {data.items.map((l: any) => <li key={l.id}>{l.name}</li>)}
      </ul>
    </main>
  );
}

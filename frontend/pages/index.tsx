import useSWR from 'swr';
import AssetList from '../src/components/AssetList';

const API_BASE = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3000';
const fetcher = (url: string) => {
  const token = typeof window !== 'undefined' ? localStorage.getItem('token') : null;
  return fetch(`${API_BASE}${url}`, { headers: token ? { Authorization: `Bearer ${token}` } : {} }).then(res => res.json());
}

export default function Home() {
  const { data, error } = useSWR('/assets', fetcher);

  if (error) return <div>Failed to load</div>;
  if (!data) return <div>Loading...</div>;

  return (
    <main style={{ padding: 20 }}>
      <h1>Assets</h1>
      <AssetList items={data.items} />
    </main>
  );
}

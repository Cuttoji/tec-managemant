import useSWR from 'swr';
import Link from 'next/link';

const API_BASE = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3000';
const fetcher = (url: string) => fetch(`${API_BASE}${url}`).then(res => res.json());

export default function ReviewList() {
  const { data, error } = useSWR('/assets', fetcher);

  if (error) return <div>Failed to load</div>;
  if (!data) return <div>Loading...</div>;

  const items = (data.items || []).filter((a: any) => a.needsReview);

  return (
    <main style={{ padding: 20 }}>
      <h1>Assets Needing Review</h1>
      {items.length === 0 ? <div>No assets pending review.</div> : (
        <ul>
          {items.map((a: any) => (
            <li key={a.id}>
              <Link href={`/assets/${a.id}`}>#{a.id} — {a.assetTag || a.serialNumber || a.type}</Link>
            </li>
          ))}
        </ul>
      )}
    </main>
  );
}

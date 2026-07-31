import useSWR from 'swr';
import { useRouter } from 'next/router';
import Link from 'next/link';

const API_BASE = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001';
const fetcher = (url: string) => {
  const token = typeof window !== 'undefined' ? localStorage.getItem('token') : null;
  const headers: any = {};
  if (token) headers.Authorization = `Bearer ${token}`;
  return fetch(`${API_BASE}${url}`, { headers }).then(res => res.json());
}

export default function AssetDetail() {
  const router = useRouter();
  const { id } = router.query;
  const { data, error, mutate } = useSWR(id ? `/assets/${id}` : null, fetcher);

  if (error) return <div>Failed to load</div>;
  if (!data) return <div>Loading...</div>;

  const handleAction = async (action: 'approve' | 'reject') => {
    const token = typeof window !== 'undefined' ? localStorage.getItem('token') : null;
    try {
      const res = await fetch(`${API_BASE}/assets/${id}/${action}`, {
        method: 'POST',
        headers: token ? { Authorization: `Bearer ${token}` } : {},
      });
      if (!res.ok) {
        const body = await res.json().catch(() => ({}));
        alert(`Failed: ${body.error || res.statusText}`);
        return;
      }
      await mutate();
    } catch (e) {
      alert('Network error');
    }
  };

  return (
    <main style={{ padding: 20 }}>
      <h1>Asset {data.id}</h1>
      <div style={{ marginBottom: 12 }}>
        <Link href="/review">← Back to review</Link>
      </div>
      <pre>{JSON.stringify(data, null, 2)}</pre>

      {data.needsReview ? (
        <div style={{ marginTop: 16 }}>
          <button onClick={() => handleAction('approve')} style={{ marginRight: 8 }}>Approve</button>
          <button onClick={() => handleAction('reject')}>Reject</button>
        </div>
      ) : null}
    </main>
  );
}

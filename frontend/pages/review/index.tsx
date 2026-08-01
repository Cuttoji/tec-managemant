import useSWR from 'swr';
import Link from 'next/link';
import { get, post } from '../../src/lib/api';

export default function ReviewList() {
  const { data, error, mutate } = useSWR(
    '/assets?needsReview=true&limit=100',
    () => get('/assets?needsReview=true&limit=100')
  );

  async function handleAction(id: number, action: 'approve' | 'reject') {
    try { await post(`/assets/${id}/${action}`); mutate(); }
    catch (err: any) { alert(err.message); }
  }

  const items = data?.items ?? [];

  return (
    <>
      <div className="page-header">
        <div>
          <h1 className="page-title">Review Assets</h1>
          <p className="page-subtitle">Asset ที่ Import มาและรอการอนุมัติ</p>
        </div>
        {data && (
          <span className="badge badge-yellow" style={{ fontSize: 14, padding: '6px 14px' }}>
            ⚠ {items.length} รายการ รอ Review
          </span>
        )}
      </div>

      {error && <div className="alert alert-error">โหลดข้อมูลไม่สำเร็จ</div>}
      {!data && !error && <div className="page-loading"><div className="spinner" /><span>กำลังโหลด...</span></div>}

      {data && items.length === 0 && (
        <div className="card">
          <div className="empty-state">
            <div className="empty-icon">✅</div>
            <div className="empty-text">ไม่มี Asset รอ Review</div>
            <div className="empty-sub">ทุก Asset ผ่านการตรวจสอบแล้ว</div>
          </div>
        </div>
      )}

      {data && items.length > 0 && (
        <div className="card">
          <div className="table-wrap">
            <table className="table">
              <thead>
                <tr>
                  <th>Asset</th>
                  <th>ประเภท</th>
                  <th>Serial Number</th>
                  <th>Location</th>
                  <th>Import เมื่อ</th>
                  <th>Actions</th>
                </tr>
              </thead>
              <tbody>
                {items.map((a: any) => (
                  <tr key={a.id}>
                    <td>
                      <Link href={`/assets/${a.id}`} style={{ fontWeight: 600, color: 'var(--primary)', textDecoration: 'none' }}>
                        {a.assetTag || `Asset #${a.id}`}
                      </Link>
                    </td>
                    <td><span className="badge badge-blue">{a.type}</span></td>
                    <td style={{ fontFamily: 'monospace', fontSize: 12 }}>{a.serialNumber || '—'}</td>
                    <td style={{ color: 'var(--gray-500)' }}>{a.location?.name || '—'}</td>
                    <td style={{ fontSize: 13, color: 'var(--gray-500)' }}>
                      {new Date(a.createdAt).toLocaleDateString('th-TH')}
                    </td>
                    <td>
                      <div style={{ display: 'flex', gap: 8 }}>
                        <button className="btn btn-success btn-sm" onClick={() => handleAction(a.id, 'approve')}>
                          ✅ Approve
                        </button>
                        <button className="btn btn-danger btn-sm" onClick={() => handleAction(a.id, 'reject')}>
                          ✗ Reject
                        </button>
                        <Link href={`/assets/${a.id}`} className="btn btn-ghost btn-sm">
                          ดู →
                        </Link>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </>
  );
}

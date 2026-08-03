import useSWR from 'swr';
import Link from 'next/link';
import { useState } from 'react';
import { get, post } from '../src/lib/api';
import { useAuth } from '../src/hooks/useAuth';

const STATUS_BADGE: Record<string, string> = {
  true:  'badge badge-yellow',
  false: 'badge badge-green',
};

export default function Home() {
  const auth = useAuth();
  const [page, setPage]       = useState(1);
  const [search, setSearch]   = useState('');
  const [searchVal, setSearchVal] = useState('');

  const key = `/assets?page=${page}&limit=20${searchVal ? `&model=${encodeURIComponent(searchVal)}` : ''}`;
  const { data, error, mutate } = useSWR(key, () => get(key));

  /* stats */
  const { data: mData } = useSWR('/maintenance', () => get('/maintenance'));
  const openJobs  = mData?.items?.filter((m: any) => m.status === 'OPEN').length ?? '—';
  const inProg    = mData?.items?.filter((m: any) => m.status === 'IN_PROGRESS').length ?? '—';
  const needRev   = data?.items?.filter((a: any) => a.needsReview).length ?? 0;

  /* create asset modal */
  const [showCreate, setShowCreate] = useState(false);
  const [form, setForm] = useState({ type: 'PRINTER', model: '', serialNumber: '', assetTag: '' });
  const [creating, setCreating] = useState(false);

  async function createAsset() {
    setCreating(true);
    try {
      await post('/assets', form);
      setShowCreate(false);
      setForm({ type: 'PRINTER', model: '', serialNumber: '', assetTag: '' });
      mutate();
    } catch (err: any) { alert(err.message); }
    finally { setCreating(false); }
  }

  const totalPages = data ? Math.ceil(data.total / 20) : 1;

  return (
    <>
      {/* Page header */}
      <div className="page-header">
        <div>
          <h1 className="page-title">Assets</h1>
          <p className="page-subtitle">ครุภัณฑ์ทั้งหมดในระบบ</p>
        </div>
        {auth?.role === 'ADMIN' && (
          <button className="btn btn-primary" onClick={() => setShowCreate(true)}>
            + เพิ่ม Asset
          </button>
        )}
      </div>

      {/* Stats */}
      <div className="stat-grid">
        {[
          { icon: '🖥️', color: '#dbeafe', value: data?.total ?? '—', label: 'Asset ทั้งหมด' },
          { icon: '⚠️', color: '#fef3c7', value: needRev,              label: 'รอตรวจสอบ' },
          { icon: '🔓', color: '#fee2e2', value: openJobs,             label: 'งานซ่อมเปิดอยู่' },
          { icon: '🔧', color: '#ede9fe', value: inProg,               label: 'กำลังซ่อม' },
        ].map(s => (
          <div className="stat-card" key={s.label}>
            <div className="stat-icon" style={{ background: s.color }}>{s.icon}</div>
            <div>
              <div className="stat-value">{s.value}</div>
              <div className="stat-label">{s.label}</div>
            </div>
          </div>
        ))}
      </div>

      {/* Filter */}
      <div className="filter-bar">
        <input
          className="form-input"
          placeholder="🔍 ค้นหา model..."
          value={search}
          onChange={e => setSearch(e.target.value)}
          onKeyDown={e => { if (e.key === 'Enter') { setSearchVal(search); setPage(1); } }}
          style={{ maxWidth: 240 }}
        />
        <button className="btn btn-ghost btn-sm" onClick={() => { setSearchVal(search); setPage(1); }}>
          ค้นหา
        </button>
        {searchVal && (
          <button className="btn btn-ghost btn-sm" onClick={() => { setSearch(''); setSearchVal(''); setPage(1); }}>
            × ล้าง
          </button>
        )}
        <span className="text-muted text-sm ml-auto">
          {data ? `${data.total} รายการ` : ''}
        </span>
      </div>

      {/* Table */}
      <div className="card">
        {error && <div className="alert alert-error card-body">โหลดข้อมูลไม่สำเร็จ</div>}
        {!data && !error && (
          <div className="page-loading"><div className="spinner" /><span>กำลังโหลด...</span></div>
        )}
        {data && (
          <>
            <div className="table-wrap">
              <table className="table">
                <thead>
                  <tr>
                    <th>ID</th>
                    <th>รหัสทรัพย์สิน</th>
                    <th>Serial Number</th>
                    <th>ประเภท</th>
                    <th>Model</th>
                    <th>Location</th>
                    <th>สถานะ</th>
                    <th></th>
                  </tr>
                </thead>
                <tbody>
                  {data.items.length === 0 && (
                    <tr>
                      <td colSpan={8}>
                        <div className="empty-state">
                          <div className="empty-icon">🖥️</div>
                          <div className="empty-text">ไม่พบ Asset</div>
                        </div>
                      </td>
                    </tr>
                  )}
                  {data.items.map((a: any) => (
                    <tr key={a.id}>
                      <td style={{ color: 'var(--gray-400)', fontSize: 12 }}>#{a.id}</td>
                      <td>
                        <span style={{ fontWeight: 600 }}>{a.assetTag || '—'}</span>
                      </td>
                      <td style={{ fontFamily: 'monospace', fontSize: 12 }}>
                        {a.serialNumber || '—'}
                      </td>
                      <td>
                        <span className="badge badge-blue">{a.type}</span>
                      </td>
                      <td>{a.model || '—'}</td>
                      <td style={{ color: 'var(--gray-500)' }}>
                        {a.location?.name || '—'}
                      </td>
                      <td>
                        {a.needsReview ? (
                          <span className="badge badge-yellow">⚠ รอตรวจสอบ</span>
                        ) : a.isActive ? (
                          <span className="badge badge-green">● ใช้งาน</span>
                        ) : (
                          <span className="badge badge-gray">○ ไม่ใช้งาน</span>
                        )}
                      </td>
                      <td>
                        <Link href={`/assets/${a.id}`} className="btn btn-ghost btn-sm">
                          ดูรายละเอียด →
                        </Link>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {/* Pagination */}
            {totalPages > 1 && (
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'flex-end', gap: 8, padding: '12px 20px', borderTop: '1px solid var(--gray-100)' }}>
                <button className="btn btn-ghost btn-sm" onClick={() => setPage(p => p - 1)} disabled={page === 1}>
                  ← ก่อนหน้า
                </button>
                <span className="text-sm text-muted">หน้า {page} / {totalPages}</span>
                <button className="btn btn-ghost btn-sm" onClick={() => setPage(p => p + 1)} disabled={page >= totalPages}>
                  ถัดไป →
                </button>
              </div>
            )}
          </>
        )}
      </div>

      {/* Create Asset Modal */}
      {showCreate && (
        <div className="modal-overlay" onClick={() => setShowCreate(false)}>
          <div className="modal" onClick={e => e.stopPropagation()}>
            <div className="modal-header">
              <span className="modal-title">เพิ่ม Asset ใหม่</span>
              <button className="modal-close" onClick={() => setShowCreate(false)}>×</button>
            </div>
            <div className="modal-body">
              <div className="form-grid-2">
                <div className="form-group">
                  <label className="form-label">ประเภท *</label>
                  <select className="form-select" value={form.type} onChange={e => setForm({ ...form, type: e.target.value })}>
                    <option value="PRINTER">Printer</option>
                    <option value="COMPUTER">Computer</option>
                    <option value="SCANNER">Scanner</option>
                    <option value="OTHER">Other</option>
                  </select>
                </div>
                <div className="form-group">
                  <label className="form-label">Model</label>
                  <input className="form-input" value={form.model} onChange={e => setForm({ ...form, model: e.target.value })} placeholder="เช่น Brother MFC-L3750CDW" />
                </div>
                <div className="form-group">
                  <label className="form-label">รหัสทรัพย์สิน</label>
                  <input className="form-input" value={form.assetTag} onChange={e => setForm({ ...form, assetTag: e.target.value })} placeholder="เช่น IT-001" />
                </div>
                <div className="form-group">
                  <label className="form-label">Serial Number</label>
                  <input className="form-input" value={form.serialNumber} onChange={e => setForm({ ...form, serialNumber: e.target.value })} placeholder="เช่น U64893-B2001" />
                </div>
              </div>
            </div>
            <div className="modal-footer">
              <button className="btn btn-ghost" onClick={() => setShowCreate(false)}>ยกเลิก</button>
              <button className="btn btn-primary" onClick={createAsset} disabled={creating}>
                {creating ? 'กำลังสร้าง...' : 'สร้าง Asset'}
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}

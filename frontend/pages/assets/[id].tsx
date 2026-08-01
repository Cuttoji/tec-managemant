import useSWR from 'swr';
import { useRouter } from 'next/router';
import Link from 'next/link';
import { useState } from 'react';
import { get, put, post } from '../../src/lib/api';
import { useAuth } from '../../src/hooks/useAuth';

const FIELDS = [
  { key: 'type',         label: 'ประเภท',        type: 'select', opts: ['PRINTER','COMPUTER','SCANNER','OTHER'] },
  { key: 'model',        label: 'Model',          type: 'text' },
  { key: 'assetTag',     label: 'Asset Tag',      type: 'text' },
  { key: 'serialNumber', label: 'Serial Number',  type: 'text' },
  { key: 'cpu',          label: 'CPU',            type: 'text' },
  { key: 'ramGb',        label: 'RAM (GB)',        type: 'number' },
  { key: 'storageType',  label: 'Storage Type',   type: 'text' },
  { key: 'storageGb',    label: 'Storage (GB)',   type: 'number' },
  { key: 'purchaseDate', label: 'วันที่ซื้อ',      type: 'date' },
] as const;

export default function AssetDetail() {
  const router  = useRouter();
  const { id }  = router.query;
  const auth    = useAuth();

  const { data, error, mutate } = useSWR(id ? `/assets/${id}` : null, () => get(`/assets/${id}`));

  const [editing, setEditing]   = useState(false);
  const [form, setForm]         = useState<any>({});
  const [saving, setSaving]     = useState(false);

  function startEdit() {
    setForm({
      type:         data.type         || '',
      model:        data.model        || '',
      assetTag:     data.assetTag     || '',
      serialNumber: data.serialNumber || '',
      cpu:          data.cpu          || '',
      ramGb:        data.ramGb        ?? '',
      storageType:  data.storageType  || '',
      storageGb:    data.storageGb    ?? '',
      purchaseDate: data.purchaseDate ? data.purchaseDate.slice(0, 10) : '',
    });
    setEditing(true);
  }

  async function save() {
    setSaving(true);
    try {
      await put(`/assets/${id}`, form);
      await mutate();
      setEditing(false);
    } catch (err: any) { alert(err.message); }
    finally { setSaving(false); }
  }

  async function handleAction(action: 'approve' | 'reject') {
    try {
      await post(`/assets/${id}/${action}`);
      await mutate();
    } catch (err: any) { alert(err.message); }
  }

  async function retire() {
    if (!confirm('ยืนยันการ Retire asset นี้?')) return;
    try { await post(`/assets/${id}/retire`); await mutate(); }
    catch (err: any) { alert(err.message); }
  }

  if (error) return <div className="alert alert-error">โหลดข้อมูลไม่สำเร็จ</div>;
  if (!data)  return <div className="page-loading"><div className="spinner" /><span>กำลังโหลด...</span></div>;

  const canEdit   = auth?.role === 'ADMIN' || auth?.permissions?.includes('asset:edit');
  const canAdmin  = auth?.role === 'ADMIN';
  const latestPage = data.pageCounters?.[0]?.total;

  return (
    <>
      {/* Header */}
      <div className="page-header">
        <div>
          <div style={{ marginBottom: 6 }}>
            <Link href="/" style={{ color: 'var(--gray-400)', fontSize: 13, textDecoration: 'none' }}>
              ← กลับหน้า Assets
            </Link>
          </div>
          <h1 className="page-title">
            {data.assetTag || data.serialNumber || `Asset #${data.id}`}
          </h1>
          <p className="page-subtitle">{data.type} {data.model ? `— ${data.model}` : ''}</p>
        </div>
        <div style={{ display: 'flex', gap: 8 }}>
          {data.needsReview && canAdmin && (
            <>
              <button className="btn btn-success" onClick={() => handleAction('approve')}>✅ Approve</button>
              <button className="btn btn-danger"  onClick={() => handleAction('reject')}>✗ Reject</button>
            </>
          )}
          {canEdit && !editing && data.isActive && (
            <button className="btn btn-ghost" onClick={startEdit}>✏️ แก้ไข</button>
          )}
          {canAdmin && data.isActive && (
            <button className="btn btn-ghost" onClick={retire} style={{ color: 'var(--danger)' }}>
              🗑 Retire
            </button>
          )}
        </div>
      </div>

      {/* Status banner */}
      {data.needsReview && (
        <div className="alert alert-info" style={{ marginBottom: 20 }}>
          ⚠️ Asset นี้รอการตรวจสอบจาก Admin
        </div>
      )}
      {!data.isActive && (
        <div className="alert alert-error" style={{ marginBottom: 20 }}>
          ○ Asset นี้ถูก Retire แล้ว {data.retiredAt && `(${new Date(data.retiredAt).toLocaleDateString('th-TH')})`}
        </div>
      )}

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 320px', gap: 20, alignItems: 'start' }}>
        {/* Main info card */}
        <div className="card">
          <div className="card-header">
            <span className="card-title">รายละเอียด Asset</span>
            {editing && (
              <div style={{ display: 'flex', gap: 8 }}>
                <button className="btn btn-ghost btn-sm" onClick={() => setEditing(false)}>ยกเลิก</button>
                <button className="btn btn-primary btn-sm" onClick={save} disabled={saving}>
                  {saving ? 'กำลังบันทึก...' : 'บันทึก'}
                </button>
              </div>
            )}
          </div>
          <div className="card-body">
            <div className="form-grid-2">
              {FIELDS.map(f => (
                <div className="form-group" key={f.key}>
                  <label className="form-label">{f.label}</label>
                  {editing ? (
                    f.type === 'select' ? (
                      <select className="form-select" value={form[f.key] ?? ''} onChange={e => setForm({ ...form, [f.key]: e.target.value })}>
                        {(f as any).opts.map((o: string) => <option key={o}>{o}</option>)}
                      </select>
                    ) : (
                      <input className="form-input" type={f.type} value={form[f.key] ?? ''} onChange={e => setForm({ ...form, [f.key]: e.target.value })} />
                    )
                  ) : (
                    <div style={{ padding: '9px 12px', background: 'var(--gray-50)', borderRadius: 'var(--radius)', fontSize: 14, border: '1px solid var(--gray-200)', minHeight: 38 }}>
                      {data[f.key] != null ? (
                        f.key === 'purchaseDate'
                          ? new Date(data[f.key]).toLocaleDateString('th-TH')
                          : String(data[f.key])
                      ) : <span style={{ color: 'var(--gray-300)' }}>—</span>}
                    </div>
                  )}
                </div>
              ))}

              {/* Location — read only for now */}
              <div className="form-group">
                <label className="form-label">Location</label>
                <div style={{ padding: '9px 12px', background: 'var(--gray-50)', borderRadius: 'var(--radius)', fontSize: 14, border: '1px solid var(--gray-200)' }}>
                  {data.location?.name || <span style={{ color: 'var(--gray-300)' }}>—</span>}
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Right column */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
          {/* Status card */}
          <div className="card">
            <div className="card-header"><span className="card-title">สถานะ</span></div>
            <div className="card-body">
              <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
                {[
                  { label: 'สถานะการใช้งาน', value: data.isActive ? <span className="badge badge-green">● ใช้งาน</span> : <span className="badge badge-gray">○ ไม่ใช้งาน</span> },
                  { label: 'รอตรวจสอบ', value: data.needsReview ? <span className="badge badge-yellow">⚠ รอ Review</span> : <span className="badge badge-green">✓ ผ่านแล้ว</span> },
                  { label: 'เพิ่มเข้าระบบ', value: new Date(data.createdAt).toLocaleDateString('th-TH') },
                  latestPage != null ? { label: 'Total Page ล่าสุด', value: latestPage.toLocaleString() } : null,
                ].filter(Boolean).map((row: any) => (
                  <div key={row.label} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <span style={{ fontSize: 13, color: 'var(--gray-500)' }}>{row.label}</span>
                    <span style={{ fontSize: 13 }}>{row.value}</span>
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* Page counter history */}
          {data.pageCounters?.length > 0 && (
            <div className="card">
              <div className="card-header"><span className="card-title">📄 Page Counter</span></div>
              <div className="card-body" style={{ padding: 0 }}>
                <table className="table" style={{ fontSize: 13 }}>
                  <thead>
                    <tr><th>วันที่</th><th style={{ textAlign: 'right' }}>Total</th></tr>
                  </thead>
                  <tbody>
                    {data.pageCounters.map((pc: any) => (
                      <tr key={pc.id}>
                        <td>{new Date(pc.recordedAt).toLocaleDateString('th-TH')}</td>
                        <td style={{ textAlign: 'right', fontFamily: 'monospace' }}>{pc.total?.toLocaleString()}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}
        </div>
      </div>
    </>
  );
}

import useSWR from 'swr';
import { useRouter } from 'next/router';
import Link from 'next/link';
import { useState, useRef } from 'react';
import { get, put, post, del } from '../../src/lib/api';
import { useAuth } from '../../src/hooks/useAuth';

// ─── Field definitions ────────────────────────────────────────────────────────

const COMMON_FIELDS = [
  { key: 'type',         label: 'ประเภท',         type: 'select', opts: ['PRINTER','COMPUTER','SCANNER','OTHER'] },
  { key: 'model',        label: 'Model',           type: 'text' },
  { key: 'assetTag',     label: 'รหัสทรัพย์สิน',  type: 'text' },
  { key: 'serialNumber', label: 'Serial Number',  type: 'text' },
  { key: 'purchaseDate', label: 'วันที่ซื้อ',      type: 'date' },
] as const;

const COMPUTER_FIELDS = [
  { key: 'cpu',         label: 'CPU',          type: 'text'   },
  { key: 'ramGb',       label: 'RAM (GB)',      type: 'number' },
  { key: 'storageType', label: 'Storage Type', type: 'text'   },
  { key: 'storageGb',   label: 'Storage (GB)', type: 'number' },
] as const;

const ALL_EDIT_FIELDS = [...COMMON_FIELDS, ...COMPUTER_FIELDS] as const;

// ─── Status labels ────────────────────────────────────────────────────────────
const STATUS_LABEL: Record<string, string> = {
  OPEN: 'รอรับงาน', IN_PROGRESS: 'กำลังซ่อม', COMPLETED: 'รอ Review', REVIEWED: 'เสร็จสิ้น',
};
const STATUS_CLASS: Record<string, string> = {
  OPEN: 'badge-yellow', IN_PROGRESS: 'badge-blue', COMPLETED: 'badge-purple', REVIEWED: 'badge-green',
};

// ─── Helper ───────────────────────────────────────────────────────────────────
function FieldValue({ data, fieldKey }: { data: any; fieldKey: string }) {
  const val = data[fieldKey];
  if (val == null || val === '') return <span style={{ color: 'var(--gray-300)' }}>—</span>;
  if (fieldKey === 'purchaseDate') return <>{new Date(val).toLocaleDateString('th-TH')}</>;
  return <>{String(val)}</>;
}

// ─── Main component ───────────────────────────────────────────────────────────
export default function AssetDetail() {
  const router = useRouter();
  const { id } = router.query;
  const auth   = useAuth();

  const { data, error, mutate } = useSWR(
    id ? `/assets/${id}` : null,
    () => get(`/assets/${id}`)
  );
  const { data: histData } = useSWR(
    id ? `/assets/${id}/maintenance` : null,
    () => get(`/assets/${id}/maintenance`)
  );

  const [editing, setEditing] = useState(false);
  const [form, setForm]       = useState<any>({});
  const [saving, setSaving]   = useState(false);

  // map image upload
  const [mapPreview,     setMapPreview]     = useState<string | null>(null);
  const [mapUploading,   setMapUploading]   = useState(false);
  const mapFileRef = useRef<HTMLInputElement>(null);

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
    try { await put(`/assets/${id}`, form); await mutate(); setEditing(false); }
    catch (err: any) { alert(err.message); }
    finally { setSaving(false); }
  }

  async function handleAction(action: 'approve' | 'reject') {
    try { await post(`/assets/${id}/${action}`); await mutate(); }
    catch (err: any) { alert(err.message); }
  }

  async function retire() {
    if (!confirm('ยืนยันการ Retire asset นี้?')) return;
    try { await post(`/assets/${id}/retire`); await mutate(); }
    catch (err: any) { alert(err.message); }
  }

  function onMapFileChange(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    if (file.size > 5 * 1024 * 1024) { alert('ไฟล์ใหญ่เกิน 5 MB'); return; }
    const reader = new FileReader();
    reader.onload = async ev => {
      const imageData = ev.target?.result as string;
      setMapPreview(imageData);
      setMapUploading(true);
      try {
        await post(`/locations/${data.locationId}/map-image`, { imageData });
        await mutate();
      } catch (err: any) {
        alert(err.message);
        setMapPreview(null);
      } finally {
        setMapUploading(false);
        if (mapFileRef.current) mapFileRef.current.value = '';
      }
    };
    reader.readAsDataURL(file);
  }

  async function removeMapImage() {
    if (!confirm('ลบรูปผังอาคารนี้?')) return;
    setMapUploading(true);
    try {
      await del(`/locations/${data.locationId}/map-image`);
      setMapPreview(null);
      await mutate();
    } catch (err: any) { alert(err.message); }
    finally { setMapUploading(false); }
  }

  if (error) return <div className="alert alert-error">โหลดข้อมูลไม่สำเร็จ</div>;
  if (!data)  return <div className="page-loading"><div className="spinner" /><span>กำลังโหลด...</span></div>;

  const canEdit  = auth?.role === 'ADMIN' || auth?.permissions?.includes('asset:edit');
  const canAdmin = auth?.role === 'ADMIN';
  const latestPage = data.pageCounters?.[0]?.total;
  const isPrinter  = data.type === 'PRINTER';
  const isComputer = data.type === 'COMPUTER' || data.type === 'OTHER';
  const histItems: any[] = histData?.items ?? [];
  // map image: preview (fresh upload) overrides stored URL
  const mapImageSrc: string | null = mapPreview ?? data.location?.mapImageUrl ?? null;

  return (
    <>
      {/* ── Header ── */}
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
          <p className="page-subtitle">
            <span className={`badge ${data.type === 'PRINTER' ? 'badge-blue' : data.type === 'COMPUTER' ? 'badge-purple' : 'badge-gray'}`} style={{ marginRight: 8 }}>
              {data.type}
            </span>
            {data.model || ''}
          </p>
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
            <button className="btn btn-ghost" onClick={retire} style={{ color: 'var(--danger)' }}>🗑 Retire</button>
          )}
        </div>
      </div>

      {/* ── Banners ── */}
      {data.needsReview && (
        <div className="alert alert-info" style={{ marginBottom: 20 }}>⚠️ Asset นี้รอการตรวจสอบจาก Admin</div>
      )}
      {!data.isActive && (
        <div className="alert alert-error" style={{ marginBottom: 20 }}>
          ○ Asset นี้ถูก Retire แล้ว {data.retiredAt && `(${new Date(data.retiredAt).toLocaleDateString('th-TH')})`}
        </div>
      )}

      {/* ── Main layout ── */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 320px', gap: 20, alignItems: 'start' }}>

        {/* ── Left column ── */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>

          {/* Info card */}
          <div className="card">
            <div className="card-header">
              <span className="card-title">
                {isPrinter ? '🖨️ รายละเอียดเครื่องพิมพ์' : isComputer ? '🖥️ รายละเอียดคอมพิวเตอร์' : '📦 รายละเอียด Asset'}
              </span>
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
              {editing ? (
                <div className="form-grid-2">
                  {ALL_EDIT_FIELDS.map(f => (
                    <div className="form-group" key={f.key}>
                      <label className="form-label">{f.label}</label>
                      {f.type === 'select' ? (
                        <select className="form-select" value={form[f.key] ?? ''} onChange={e => setForm({ ...form, [f.key]: e.target.value })}>
                          {(f as any).opts.map((o: string) => <option key={o}>{o}</option>)}
                        </select>
                      ) : (
                        <input className="form-input" type={f.type} value={form[f.key] ?? ''} onChange={e => setForm({ ...form, [f.key]: e.target.value })} />
                      )}
                    </div>
                  ))}
                  <div className="form-group">
                    <label className="form-label">Location</label>
                    <div style={{ padding: '9px 12px', background: 'var(--gray-50)', borderRadius: 'var(--radius)', fontSize: 14, border: '1px solid var(--gray-200)' }}>
                      {data.location?.name || <span style={{ color: 'var(--gray-300)' }}>—</span>}
                    </div>
                  </div>
                </div>
              ) : (
                <>
                  {/* Common fields */}
                  <div className="form-grid-2" style={{ marginBottom: 16 }}>
                    {COMMON_FIELDS.map(f => (
                      <div key={f.key}>
                        <div className="form-label" style={{ marginBottom: 3 }}>{f.label}</div>
                        <div style={{ padding: '7px 10px', background: 'var(--gray-50)', borderRadius: 'var(--radius)', fontSize: 14, border: '1px solid var(--gray-200)' }}>
                          <FieldValue data={data} fieldKey={f.key} />
                        </div>
                      </div>
                    ))}
                    <div>
                      <div className="form-label" style={{ marginBottom: 3 }}>Location</div>
                      <div style={{ padding: '7px 10px', background: 'var(--gray-50)', borderRadius: 'var(--radius)', fontSize: 14, border: '1px solid var(--gray-200)' }}>
                        {data.location?.name || <span style={{ color: 'var(--gray-300)' }}>—</span>}
                      </div>
                    </div>
                  </div>

                  {/* Computer specs section */}
                  {isComputer && (
                    <div style={{ borderTop: '1px solid var(--gray-100)', paddingTop: 16 }}>
                      <div style={{ fontSize: 12, fontWeight: 600, color: 'var(--gray-500)', textTransform: 'uppercase', letterSpacing: '.6px', marginBottom: 12 }}>
                        🖥️ สเปคฮาร์ดแวร์
                      </div>
                      <div className="form-grid-2">
                        {COMPUTER_FIELDS.map(f => (
                          <div key={f.key}>
                            <div className="form-label" style={{ marginBottom: 3 }}>{f.label}</div>
                            <div style={{ padding: '7px 10px', background: 'var(--gray-50)', borderRadius: 'var(--radius)', fontSize: 14, border: '1px solid var(--gray-200)' }}>
                              <FieldValue data={data} fieldKey={f.key} />
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* Printer: page counter inline */}
                  {isPrinter && latestPage != null && (
                    <div style={{ borderTop: '1px solid var(--gray-100)', paddingTop: 14, marginTop: 4 }}>
                      <div style={{ fontSize: 12, fontWeight: 600, color: 'var(--gray-500)', textTransform: 'uppercase', letterSpacing: '.6px', marginBottom: 10 }}>
                        📄 Page Counter ล่าสุด
                      </div>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 24 }}>
                        <div>
                          <div style={{ fontSize: 28, fontWeight: 700, color: 'var(--primary)', fontFamily: 'monospace' }}>
                            {latestPage.toLocaleString()}
                          </div>
                          <div style={{ fontSize: 12, color: 'var(--gray-500)' }}>Total Pages</div>
                        </div>
                        <div style={{ fontSize: 12, color: 'var(--gray-400)' }}>
                          บันทึกล่าสุด: {new Date(data.pageCounters[0].recordedAt).toLocaleDateString('th-TH')}
                        </div>
                      </div>
                    </div>
                  )}
                </>
              )}
            </div>
          </div>

          {/* Maintenance history */}
          <div className="card">
            <div className="card-header">
              <span className="card-title">🔧 ประวัติการซ่อม</span>
              <span className="badge badge-gray">{histItems.length} งาน</span>
            </div>
            {histItems.length === 0 ? (
              <div className="empty-state" style={{ padding: '32px 20px' }}>
                <div className="empty-icon">🔧</div>
                <div className="empty-text">ยังไม่มีประวัติการซ่อม</div>
              </div>
            ) : (
              <div style={{ display: 'flex', flexDirection: 'column' }}>
                {histItems.map((m: any, idx: number) => (
                  <div key={m.id} style={{ padding: '14px 20px', borderBottom: idx < histItems.length - 1 ? '1px solid var(--gray-100)' : 'none' }}>
                    <div style={{ display: 'flex', alignItems: 'flex-start', gap: 10, marginBottom: 6 }}>
                      <span className={`badge ${STATUS_CLASS[m.status] || 'badge-gray'}`} style={{ flexShrink: 0 }}>
                        {STATUS_LABEL[m.status] || m.status}
                      </span>
                      <span style={{ flex: 1, fontSize: 13.5, fontWeight: 500 }}>{m.issueDetails}</span>
                      <span style={{ fontSize: 12, color: 'var(--gray-400)', whiteSpace: 'nowrap', flexShrink: 0 }}>
                        {new Date(m.createdAt).toLocaleDateString('th-TH', { day: '2-digit', month: 'short', year: '2-digit' })}
                      </span>
                    </div>
                    <div style={{ display: 'flex', flexWrap: 'wrap', gap: '4px 16px', fontSize: 12, color: 'var(--gray-500)' }}>
                      {m.technician && <span>👤 {m.technician.name}</span>}
                      {m.totalPageAtRepair != null && <span>📄 Page: {m.totalPageAtRepair.toLocaleString()}</span>}
                      {m.symptom && <span>⚠ {m.symptom}</span>}
                      {m.repairDetails && (
                        <span style={{ color: 'var(--gray-600)' }}>✏ {m.repairDetails.length > 60 ? m.repairDetails.slice(0, 60) + '…' : m.repairDetails}</span>
                      )}
                    </div>
                    {m.components?.length > 0 && (
                      <div style={{ marginTop: 6, display: 'flex', flexWrap: 'wrap', gap: 4 }}>
                        {m.components.map((c: any, i: number) => {
                          const isToner = /toner/i.test(c.part);
                          const isDrum  = /drum/i.test(c.part);
                          return (
                            <span key={i} className={`badge ${isToner ? 'badge-yellow' : isDrum ? 'badge-purple' : 'badge-gray'}`}>
                              {isToner ? '🟡' : isDrum ? '⭕' : '🔩'} {c.part} ×{c.quantity}
                            </span>
                          );
                        })}
                      </div>
                    )}
                  </div>
                ))}
              </div>
            )}
          </div>

        </div>

        {/* ── Right column ── */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>

          {/* Status card */}
          <div className="card">
            <div className="card-header"><span className="card-title">สถานะ</span></div>
            <div className="card-body">
              <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
                {[
                  { label: 'สถานะ',         value: data.isActive ? <span className="badge badge-green">● ใช้งาน</span> : <span className="badge badge-gray">○ ไม่ใช้งาน</span> },
                  { label: 'รอตรวจสอบ',     value: data.needsReview ? <span className="badge badge-yellow">⚠ รอ Review</span> : <span className="badge badge-green">✓ ผ่านแล้ว</span> },
                  { label: 'เพิ่มเข้าระบบ', value: new Date(data.createdAt).toLocaleDateString('th-TH') },
                  { label: 'งานซ่อมทั้งหมด', value: <strong>{histItems.length} งาน</strong> },
                ].map(row => (
                  <div key={row.label} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <span style={{ fontSize: 13, color: 'var(--gray-500)' }}>{row.label}</span>
                    <span style={{ fontSize: 13 }}>{row.value}</span>
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* ── ผังอาคาร ── */}
          {data.locationId && (
            <div className="card">
              <div className="card-header">
                <span className="card-title">🗺️ ผังอาคาร</span>
                <span style={{ fontSize: 12, color: 'var(--gray-500)' }}>{data.location?.name}</span>
              </div>

              {/* Image area */}
              <div style={{
                position: 'relative',
                background: 'var(--gray-100)',
                minHeight: 160,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                overflow: 'hidden',
              }}>
                {mapImageSrc ? (
                  <>
                    <img
                      src={mapImageSrc}
                      alt={`ผัง ${data.location?.name}`}
                      style={{ width: '100%', display: 'block', objectFit: 'contain', maxHeight: 280 }}
                    />
                    {/* admin hover overlay */}
                    {canAdmin && (
                      <div
                        style={{
                          position: 'absolute', inset: 0,
                          background: 'rgba(0,0,0,.45)',
                          display: 'flex', alignItems: 'center', justifyContent: 'center',
                          gap: 8, opacity: 0, transition: 'opacity .2s',
                        }}
                        onMouseEnter={e => (e.currentTarget.style.opacity = '1')}
                        onMouseLeave={e => (e.currentTarget.style.opacity = '0')}
                      >
                        <button
                          className="btn btn-sm"
                          style={{ background: '#fff', color: 'var(--gray-700)' }}
                          onClick={() => mapFileRef.current?.click()}
                          disabled={mapUploading}
                        >🔄 เปลี่ยน</button>
                        <button
                          className="btn btn-sm"
                          style={{ background: '#fff', color: 'var(--danger)' }}
                          onClick={removeMapImage}
                          disabled={mapUploading}
                        >🗑 ลบ</button>
                      </div>
                    )}
                  </>
                ) : (
                  <div style={{ textAlign: 'center', padding: '24px 16px', color: 'var(--gray-400)' }}>
                    <div style={{ fontSize: 32, marginBottom: 8 }}>🗺️</div>
                    <div style={{ fontSize: 13, marginBottom: canAdmin ? 12 : 0 }}>ยังไม่มีผังอาคาร</div>
                    {canAdmin && (
                      <button
                        className="btn btn-ghost btn-sm"
                        onClick={() => mapFileRef.current?.click()}
                        disabled={mapUploading}
                      >
                        {mapUploading
                          ? <><span className="spinner" style={{ width: 12, height: 12 }} /> กำลังอัปโหลด...</>
                          : '📤 อัปโหลดผัง'}
                      </button>
                    )}
                  </div>
                )}

                {/* upload spinner overlay */}
                {mapUploading && (
                  <div style={{
                    position: 'absolute', inset: 0,
                    background: 'rgba(255,255,255,.7)',
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                  }}>
                    <div className="spinner" />
                  </div>
                )}

                {/* hidden file input */}
                <input
                  ref={mapFileRef}
                  type="file"
                  accept="image/png,image/jpeg,image/webp"
                  style={{ display: 'none' }}
                  onChange={onMapFileChange}
                />
              </div>

              {/* Admin upload button below image when image exists */}
              {canAdmin && mapImageSrc && (
                <div style={{ padding: '10px 14px', borderTop: '1px solid var(--gray-100)', fontSize: 12, color: 'var(--gray-400)', textAlign: 'center' }}>
                  วางเมาส์บนรูปเพื่อเปลี่ยนหรือลบ
                </div>
              )}
            </div>
          )}

          {/* Page counter history (Printer only) */}
          {isPrinter && data.pageCounters?.length > 0 && (
            <div className="card">
              <div className="card-header"><span className="card-title">📄 Page Counter History</span></div>
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

          {/* Printer summary link */}
          {isPrinter && (
            <div className="card">
              <div className="card-body" style={{ padding: '14px 18px' }}>
                <div style={{ fontSize: 13, color: 'var(--gray-500)', marginBottom: 8 }}>🖨️ ดูสรุปวัสดุสิ้นเปลือง</div>
                <Link href="/printer-summary" className="btn btn-ghost btn-sm" style={{ width: '100%', justifyContent: 'center' }}>
                  ไปหน้าสรุป Toner / Drum →
                </Link>
              </div>
            </div>
          )}

        </div>
      </div>
    </>
  );
}

import useSWR from 'swr';
import { useState } from 'react';
import { get, post } from '../src/lib/api';
import { useAuth } from '../src/hooks/useAuth';
import MaintenanceDetailForm from '../src/components/MaintenanceDetailForm';

type FormMode = { type: 'complete' | 'edit'; maintenanceId: number; item: any } | null;

const STATUS_LABEL: Record<string, string> = {
  OPEN: 'รอรับงาน', IN_PROGRESS: 'กำลังซ่อม', COMPLETED: 'รอ Review', REVIEWED: 'เสร็จสิ้น',
};
const STATUS_CLASS: Record<string, string> = {
  OPEN: 'badge-yellow', IN_PROGRESS: 'badge-blue', COMPLETED: 'badge-purple', REVIEWED: 'badge-green',
};

const TABS = ['ทั้งหมด', 'OPEN', 'IN_PROGRESS', 'COMPLETED', 'REVIEWED'] as const;

export default function MaintenancePage() {
  const auth = useAuth();
  const [tab, setTab]           = useState<string>('ทั้งหมด');
  const [page, setPage]         = useState(1);
  const [formMode, setFormMode] = useState<FormMode>(null);
  const [reviewId, setReviewId] = useState<number | null>(null);
  const [reviewNotes, setReviewNotes] = useState('');

  /* create form */
  const [showCreate, setShowCreate]   = useState(false);
  const [newAssetId, setNewAssetId]   = useState('');
  const [newIssue, setNewIssue]       = useState('');
  const [creating, setCreating]       = useState(false);

  const statusQ = tab === 'ทั้งหมด' ? '' : `&status=${tab}`;
  const key = `/maintenance?page=${page}&limit=20${statusQ}`;
  const { data, error, mutate } = useSWR(key, () => get(key));

  async function create() {
    if (!newAssetId || !newIssue) { alert('กรุณากรอก Asset ID และรายละเอียดปัญหา'); return; }
    setCreating(true);
    try {
      await post('/maintenance', { assetId: Number(newAssetId), issueDetails: newIssue });
      setNewAssetId(''); setNewIssue(''); setShowCreate(false); mutate();
    } catch (err: any) { alert(err.message); }
    finally { setCreating(false); }
  }

  async function claim(id: number) {
    try { await post(`/maintenance/${id}/claim`); mutate(); }
    catch (err: any) { alert(err.message); }
  }

  async function review(id: number, approved: boolean) {
    try {
      await post(`/maintenance/${id}/review`, { approved, reviewNotes });
      setReviewId(null); setReviewNotes(''); mutate();
    } catch (err: any) { alert(err.message); }
  }

  const totalPages = data ? Math.ceil((data.total ?? data.items?.length ?? 0) / 20) : 1;

  return (
    <>
      <div className="page-header">
        <div>
          <h1 className="page-title">Maintenance</h1>
          <p className="page-subtitle">งานซ่อมบำรุงทั้งหมด</p>
        </div>
        {auth?.role === 'ADMIN' && (
          <button className="btn btn-primary" onClick={() => setShowCreate(true)}>+ เปิดงานซ่อม</button>
        )}
      </div>

      {/* Tabs */}
      <div style={{ display: 'flex', gap: 4, marginBottom: 20, borderBottom: '1px solid var(--gray-200)', paddingBottom: 0 }}>
        {TABS.map(t => (
          <button
            key={t}
            onClick={() => { setTab(t); setPage(1); }}
            style={{
              background: 'none', border: 'none', padding: '8px 16px', cursor: 'pointer',
              fontWeight: tab === t ? 600 : 400,
              color: tab === t ? 'var(--primary)' : 'var(--gray-500)',
              borderBottom: tab === t ? '2px solid var(--primary)' : '2px solid transparent',
              marginBottom: -1, fontSize: 13.5,
              transition: 'color .15s',
            }}
          >
            {t === 'ทั้งหมด' ? t : STATUS_LABEL[t]}
            {data && t === 'ทั้งหมด' && (
              <span className="badge badge-gray" style={{ marginLeft: 6 }}>{data.total ?? data.items?.length}</span>
            )}
          </button>
        ))}
      </div>

      {/* Detail form */}
      {formMode && (
        <div style={{ marginBottom: 20 }}>
          <MaintenanceDetailForm
            maintenanceId={formMode.maintenanceId}
            assetModel={formMode.item.asset?.model}
            latestPage={formMode.item.asset?.pageCounters?.[0]?.total}
            existing={formMode.type === 'edit' ? {
              symptom: formMode.item.symptom,
              partReplacedAt: formMode.item.partReplacedAt ? new Date(formMode.item.partReplacedAt).toISOString().slice(0, 16) : '',
              brand: formMode.item.brand,
              totalPageAtRepair: formMode.item.totalPageAtRepair,
              repairDetails: formMode.item.repairDetails,
              usedLoaner: formMode.item.usedLoaner,
              loanerAssetId: formMode.item.loanerAssetId,
              loanerPageStart: formMode.item.loanerPageStart,
              loanerPageEnd: formMode.item.loanerPageEnd,
              components: formMode.item.components || [],
            } : undefined}
            mode={formMode.type}
            onSuccess={() => { setFormMode(null); mutate(); }}
            onCancel={() => setFormMode(null)}
          />
        </div>
      )}

      {/* Cards */}
      {error && <div className="alert alert-error">โหลดข้อมูลไม่สำเร็จ</div>}
      {!data && !error && <div className="page-loading"><div className="spinner" /><span>กำลังโหลด...</span></div>}

      {data && (
        <>
          {data.items.length === 0 && (
            <div className="card">
              <div className="empty-state">
                <div className="empty-icon">🔧</div>
                <div className="empty-text">ไม่มีงานซ่อม</div>
                <div className="empty-sub">ยังไม่มีงานในสถานะนี้</div>
              </div>
            </div>
          )}

          <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
            {data.items.map((m: any) => {
              const isMine     = auth && Number(m.technicianId) === Number(auth.id);
              const canComplete = m.status === 'IN_PROGRESS' && isMine;
              const canReview   = m.status === 'COMPLETED' && auth?.role === 'ADMIN';
              const canEdit     = (m.status === 'COMPLETED' || m.status === 'REVIEWED') && (auth?.role === 'ADMIN' || isMine);

              return (
                <div key={m.id} className="card">
                  <div className="card-body" style={{ padding: '16px 20px' }}>
                    {/* Header row */}
                    <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: 12, marginBottom: 10 }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 10, flexWrap: 'wrap' }}>
                        <span style={{ fontWeight: 700, color: 'var(--gray-400)', fontSize: 12 }}>#{m.id}</span>
                        <span className={`badge ${STATUS_CLASS[m.status] || 'badge-gray'}`}>
                          {STATUS_LABEL[m.status] || m.status}
                        </span>
                        <span style={{ fontWeight: 600, fontSize: 14 }}>
                          {m.asset?.assetTag || m.asset?.serialNumber || `Asset #${m.assetId}`}
                          {m.asset?.model && <span style={{ fontWeight: 400, color: 'var(--gray-500)' }}> — {m.asset.model}</span>}
                        </span>
                      </div>
                      <span style={{ fontSize: 12, color: 'var(--gray-400)', whiteSpace: 'nowrap' }}>
                        {new Date(m.createdAt).toLocaleDateString('th-TH', { day: '2-digit', month: 'short', year: '2-digit' })}
                      </span>
                    </div>

                    {/* Issue */}
                    <div style={{ fontSize: 14, marginBottom: 8 }}>
                      <span style={{ color: 'var(--gray-500)', marginRight: 6 }}>📋 ปัญหา:</span>
                      {m.issueDetails}
                    </div>

                    {/* Meta row */}
                    <div style={{ display: 'flex', gap: 16, flexWrap: 'wrap', fontSize: 13, color: 'var(--gray-500)', marginBottom: 8 }}>
                      {m.technician && <span>👤 ช่าง: <strong style={{ color: 'var(--gray-700)' }}>{m.technician.name}</strong></span>}
                      {m.dispatcher && <span>📤 เปิดโดย: {m.dispatcher.name}</span>}
                      {m.brand      && <span>🏷 {m.brand}</span>}
                      {m.totalPageAtRepair != null && <span>📄 Page: {m.totalPageAtRepair.toLocaleString()}</span>}
                      {m.claimedAt  && <span>⏱ รับงาน: {new Date(m.claimedAt).toLocaleDateString('th-TH')}</span>}
                      {m.completedAt && <span>✅ ปิดงาน: {new Date(m.completedAt).toLocaleDateString('th-TH')}</span>}
                    </div>

                    {m.symptom && (
                      <div style={{ fontSize: 13, color: 'var(--gray-600)', marginBottom: 6 }}>
                        <span style={{ color: 'var(--danger)', marginRight: 4 }}>⚠</span>อาการ: {m.symptom}
                      </div>
                    )}
                    {m.repairDetails && (
                      <div style={{ fontSize: 13, background: 'var(--gray-50)', padding: '8px 12px', borderRadius: 6, marginBottom: 6 }}>
                        <strong>รายละเอียดซ่อม:</strong> {m.repairDetails}
                      </div>
                    )}
                    {m.usedLoaner && m.loanerAsset && (
                      <div style={{ fontSize: 13, color: 'var(--accent)', marginBottom: 6 }}>
                        🔄 เครื่องสำรอง: {m.loanerAsset.assetTag || m.loanerAsset.serialNumber}
                        {m.loanerPageStart != null && ` (Page ${m.loanerPageStart.toLocaleString()} → ${(m.loanerPageEnd ?? '?').toLocaleString?.() ?? '?'})`}
                      </div>
                    )}
                    {m.components?.length > 0 && (
                      <div style={{ fontSize: 13, marginBottom: 6 }}>
                        🔩 อะไหล่: {m.components.map((c: any, i: number) => (
                          <span key={i} className="badge badge-gray" style={{ marginRight: 4 }}>{c.part} ×{c.quantity}</span>
                        ))}
                      </div>
                    )}
                    {m.reviewNotes && (
                      <div style={{ fontSize: 13, color: 'var(--danger)', background: 'var(--danger-light)', padding: '6px 10px', borderRadius: 6, marginBottom: 6 }}>
                        📝 หมายเหตุ Review: {m.reviewNotes}
                      </div>
                    )}

                    {/* Actions */}
                    <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap', marginTop: 12 }}>
                      {m.status === 'OPEN' && (
                        <button className="btn btn-primary btn-sm" onClick={() => claim(m.id)}>
                          ✋ รับงาน
                        </button>
                      )}
                      {canComplete && formMode?.maintenanceId !== m.id && (
                        <button className="btn btn-success btn-sm" onClick={() => setFormMode({ type: 'complete', maintenanceId: m.id, item: m })}>
                          ✅ ปิดงาน + บันทึก
                        </button>
                      )}
                      {canEdit && formMode?.maintenanceId !== m.id && (
                        <button className="btn btn-warning btn-sm" onClick={() => setFormMode({ type: 'edit', maintenanceId: m.id, item: m })}>
                          ✏️ แก้ไขรายละเอียด
                        </button>
                      )}
                      {canReview && reviewId !== m.id && (
                        <button className="btn btn-accent btn-sm" onClick={() => setReviewId(m.id)}>
                          🔍 Review
                        </button>
                      )}
                    </div>

                    {/* Review panel */}
                    {canReview && reviewId === m.id && (
                      <div style={{ marginTop: 12, padding: 14, background: 'var(--gray-50)', borderRadius: 8, border: '1px solid var(--gray-200)' }}>
                        <textarea
                          className="form-textarea"
                          placeholder="หมายเหตุ (optional)"
                          value={reviewNotes}
                          onChange={e => setReviewNotes(e.target.value)}
                          rows={2}
                          style={{ marginBottom: 10 }}
                        />
                        <div style={{ display: 'flex', gap: 8 }}>
                          <button className="btn btn-success btn-sm" onClick={() => review(m.id, true)}>✅ อนุมัติ</button>
                          <button className="btn btn-danger btn-sm" onClick={() => review(m.id, false)}>↩ ส่งซ่อมใหม่</button>
                          <button className="btn btn-ghost btn-sm" onClick={() => setReviewId(null)}>ยกเลิก</button>
                        </div>
                      </div>
                    )}
                  </div>
                </div>
              );
            })}
          </div>

          {/* Pagination */}
          {totalPages > 1 && (
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 12, marginTop: 20 }}>
              <button className="btn btn-ghost btn-sm" onClick={() => setPage(p => p - 1)} disabled={page === 1}>← ก่อนหน้า</button>
              <span className="text-sm text-muted">หน้า {page} / {totalPages}</span>
              <button className="btn btn-ghost btn-sm" onClick={() => setPage(p => p + 1)} disabled={page >= totalPages}>ถัดไป →</button>
            </div>
          )}
        </>
      )}

      {/* Create modal */}
      {showCreate && (
        <div className="modal-overlay" onClick={() => setShowCreate(false)}>
          <div className="modal" onClick={e => e.stopPropagation()}>
            <div className="modal-header">
              <span className="modal-title">เปิดงานซ่อมใหม่</span>
              <button className="modal-close" onClick={() => setShowCreate(false)}>×</button>
            </div>
            <div className="modal-body">
              <div className="form-group">
                <label className="form-label">Asset ID *</label>
                <input className="form-input" type="number" value={newAssetId} onChange={e => setNewAssetId(e.target.value)} placeholder="เช่น 42" />
              </div>
              <div className="form-group">
                <label className="form-label">รายละเอียดปัญหา *</label>
                <textarea className="form-textarea" value={newIssue} onChange={e => setNewIssue(e.target.value)} placeholder="อธิบายปัญหาที่พบ..." rows={3} />
              </div>
            </div>
            <div className="modal-footer">
              <button className="btn btn-ghost" onClick={() => setShowCreate(false)}>ยกเลิก</button>
              <button className="btn btn-primary" onClick={create} disabled={creating}>
                {creating ? 'กำลังสร้าง...' : 'เปิดงาน'}
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}

import useSWR from 'swr';
import { useState, useRef } from 'react';
import { get, post, put, del } from '../src/lib/api';
import { useAuth } from '../src/hooks/useAuth';

export default function LocationsPage() {
  const auth = useAuth();
  const canManage = auth?.role === 'ADMIN' || auth?.permissions?.includes('location:manage');
  const isAdmin   = auth?.role === 'ADMIN';

  const { data, error, mutate } = useSWR('/locations', () => get('/locations'));

  const [newName,  setNewName]  = useState('');
  const [creating, setCreating] = useState(false);
  const [editId,   setEditId]   = useState<number | null>(null);
  const [editName, setEditName] = useState('');
  const [saving,   setSaving]   = useState(false);
  const [deleting, setDeleting] = useState<number | null>(null);

  // map image upload state
  const [uploadingId, setUploadingId] = useState<number | null>(null);
  const [previewMap,  setPreviewMap]  = useState<Record<number, string | null>>({});
  const fileRefs = useRef<Record<number, HTMLInputElement | null>>({});

  async function create() {
    if (!newName.trim()) return;
    setCreating(true);
    try { await post('/locations', { name: newName.trim() }); setNewName(''); mutate(); }
    catch (err: any) { alert(err.message); }
    finally { setCreating(false); }
  }

  async function save(id: number) {
    if (!editName.trim()) return;
    setSaving(true);
    try { await put(`/locations/${id}`, { name: editName.trim() }); setEditId(null); mutate(); }
    catch (err: any) { alert(err.message); }
    finally { setSaving(false); }
  }

  async function remove(id: number, name: string) {
    if (!confirm(`ลบ Location "${name}"?`)) return;
    setDeleting(id);
    try { await del(`/locations/${id}`); mutate(); }
    catch (err: any) { alert(err.message); }
    finally { setDeleting(null); }
  }

  // read file → base64, preview, then upload
  function onFileChange(id: number, e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    if (file.size > 5 * 1024 * 1024) { alert('ไฟล์ใหญ่เกิน 5 MB'); return; }

    const reader = new FileReader();
    reader.onload = async ev => {
      const imageData = ev.target?.result as string;
      // show preview immediately
      setPreviewMap(prev => ({ ...prev, [id]: imageData }));
      // upload
      setUploadingId(id);
      try {
        await post(`/locations/${id}/map-image`, { imageData });
        mutate();
      } catch (err: any) {
        alert(err.message);
        setPreviewMap(prev => ({ ...prev, [id]: null }));
      } finally {
        setUploadingId(null);
        // reset input so same file can be re-selected
        if (fileRefs.current[id]) fileRefs.current[id]!.value = '';
      }
    };
    reader.readAsDataURL(file);
  }

  async function removeMapImage(id: number) {
    if (!confirm('ลบรูปผังนี้?')) return;
    setUploadingId(id);
    try {
      await del(`/locations/${id}/map-image`);
      setPreviewMap(prev => ({ ...prev, [id]: null }));
      mutate();
    } catch (err: any) { alert(err.message); }
    finally { setUploadingId(null); }
  }

  if (error) return <div className="alert alert-error">โหลดข้อมูลไม่สำเร็จ</div>;
  if (!data)  return <div className="page-loading"><div className="spinner" /><span>กำลังโหลด...</span></div>;

  return (
    <>
      <div className="page-header">
        <div>
          <h1 className="page-title">Locations</h1>
          <p className="page-subtitle">สถานที่ติดตั้งครุภัณฑ์ ({data.items.length} แห่ง)</p>
        </div>
      </div>

      {/* Add location */}
      {canManage && (
        <div className="card" style={{ marginBottom: 20 }}>
          <div className="card-body">
            <div style={{ display: 'flex', gap: 10, alignItems: 'flex-end' }}>
              <div className="form-group" style={{ flex: 1, marginBottom: 0 }}>
                <label className="form-label">ชื่อ Location ใหม่</label>
                <input
                  className="form-input"
                  placeholder="เช่น ชั้น 1 อาคาร A"
                  value={newName}
                  onChange={e => setNewName(e.target.value)}
                  onKeyDown={e => e.key === 'Enter' && create()}
                />
              </div>
              <button className="btn btn-primary" onClick={create} disabled={creating || !newName.trim()}>
                {creating ? 'กำลังสร้าง...' : '+ เพิ่ม'}
              </button>
            </div>
          </div>
        </div>
      )}

      {data.items.length === 0 ? (
        <div className="card">
          <div className="empty-state">
            <div className="empty-icon">📍</div>
            <div className="empty-text">ยังไม่มี Location</div>
            <div className="empty-sub">เพิ่ม Location แรกได้เลย</div>
          </div>
        </div>
      ) : (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))', gap: 16 }}>
          {data.items.map((loc: any) => {
            const assetCount = loc._count?.assets ?? 0;
            // preview overrides stored URL (after fresh upload before mutate resolves)
            const imgSrc = previewMap[loc.id] !== undefined
              ? previewMap[loc.id]
              : loc.mapImageUrl ?? null;
            const isUploading = uploadingId === loc.id;

            return (
              <div key={loc.id} className="card">

                {/* Map image area */}
                <div style={{
                  position: 'relative',
                  background: 'var(--gray-100)',
                  borderRadius: 'var(--radius-lg) var(--radius-lg) 0 0',
                  overflow: 'hidden',
                  height: 180,
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                }}>
                  {imgSrc ? (
                    <>
                      <img
                        src={imgSrc}
                        alt={`ผัง ${loc.name}`}
                        style={{ width: '100%', height: '100%', objectFit: 'contain' }}
                      />
                      {/* overlay on hover — admin only */}
                      {isAdmin && (
                        <div style={{
                          position: 'absolute', inset: 0,
                          background: 'rgba(0,0,0,.45)',
                          display: 'flex', alignItems: 'center', justifyContent: 'center',
                          gap: 10, opacity: 0, transition: 'opacity .2s',
                        }}
                          onMouseEnter={e => (e.currentTarget.style.opacity = '1')}
                          onMouseLeave={e => (e.currentTarget.style.opacity = '0')}
                        >
                          <button
                            className="btn btn-ghost btn-sm"
                            style={{ background: '#fff', color: 'var(--gray-700)' }}
                            onClick={() => fileRefs.current[loc.id]?.click()}
                            disabled={isUploading}
                          >
                            🔄 เปลี่ยนรูป
                          </button>
                          <button
                            className="btn btn-ghost btn-sm"
                            style={{ background: '#fff', color: 'var(--danger)' }}
                            onClick={() => removeMapImage(loc.id)}
                            disabled={isUploading}
                          >
                            🗑 ลบรูป
                          </button>
                        </div>
                      )}
                    </>
                  ) : (
                    <div style={{ textAlign: 'center', color: 'var(--gray-400)' }}>
                      <div style={{ fontSize: 36, marginBottom: 8 }}>🗺️</div>
                      <div style={{ fontSize: 13 }}>ยังไม่มีผังอาคาร</div>
                      {isAdmin && (
                        <button
                          className="btn btn-ghost btn-sm"
                          style={{ marginTop: 10, fontSize: 12 }}
                          onClick={() => fileRefs.current[loc.id]?.click()}
                          disabled={isUploading}
                        >
                          {isUploading ? (
                            <><span className="spinner" style={{ width: 12, height: 12 }} /> กำลังอัปโหลด...</>
                          ) : '📤 อัปโหลดผัง'}
                        </button>
                      )}
                    </div>
                  )}

                  {/* loading overlay */}
                  {isUploading && (
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
                    ref={el => { fileRefs.current[loc.id] = el; }}
                    type="file"
                    accept="image/png,image/jpeg,image/webp"
                    style={{ display: 'none' }}
                    onChange={e => onFileChange(loc.id, e)}
                  />
                </div>

                {/* Card body */}
                <div className="card-body" style={{ padding: '14px 16px' }}>
                  {editId === loc.id ? (
                    <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
                      <input
                        className="form-input"
                        value={editName}
                        onChange={e => setEditName(e.target.value)}
                        onKeyDown={e => e.key === 'Enter' && save(loc.id)}
                        autoFocus
                      />
                      <div style={{ display: 'flex', gap: 8 }}>
                        <button className="btn btn-primary btn-sm" onClick={() => save(loc.id)} disabled={saving}>
                          {saving ? '...' : 'บันทึก'}
                        </button>
                        <button className="btn btn-ghost btn-sm" onClick={() => setEditId(null)}>ยกเลิก</button>
                      </div>
                    </div>
                  ) : (
                    <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: 8 }}>
                      <div>
                        <div style={{ fontSize: 15, fontWeight: 700, marginBottom: 5 }}>
                          📍 {loc.name}
                        </div>
                        <span className="badge badge-blue">{assetCount} Assets</span>
                        <div style={{ fontSize: 11, color: 'var(--gray-400)', marginTop: 6 }}>
                          สร้างเมื่อ {new Date(loc.createdAt).toLocaleDateString('th-TH')}
                        </div>
                      </div>
                      {canManage && (
                        <div style={{ display: 'flex', gap: 4, flexShrink: 0 }}>
                          <button
                            className="btn btn-ghost btn-sm"
                            onClick={() => { setEditId(loc.id); setEditName(loc.name); }}
                            title="แก้ไขชื่อ"
                          >✏️</button>
                          {isAdmin && assetCount === 0 && (
                            <button
                              className="btn btn-ghost btn-sm"
                              onClick={() => remove(loc.id, loc.name)}
                              disabled={deleting === loc.id}
                              style={{ color: 'var(--danger)' }}
                              title="ลบ"
                            >{deleting === loc.id ? '...' : '🗑'}</button>
                          )}
                        </div>
                      )}
                    </div>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}
    </>
  );
}

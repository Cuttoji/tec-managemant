import useSWR from 'swr';
import { useState } from 'react';
import { get, post, put, del } from '../src/lib/api';
import { useAuth } from '../src/hooks/useAuth';

export default function LocationsPage() {
  const auth = useAuth();
  const canManage = auth?.role === 'ADMIN' || auth?.permissions?.includes('location:manage');

  const { data, error, mutate } = useSWR('/locations', () => get('/locations'));

  const [newName,    setNewName]    = useState('');
  const [creating,   setCreating]   = useState(false);
  const [editId,     setEditId]     = useState<number | null>(null);
  const [editName,   setEditName]   = useState('');
  const [saving,     setSaving]     = useState(false);
  const [deleting,   setDeleting]   = useState<number | null>(null);

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
                  placeholder="เช่น ชั้น 1, ห้องเซิร์ฟเวอร์"
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

      {/* Grid of location cards */}
      {data.items.length === 0 ? (
        <div className="card">
          <div className="empty-state">
            <div className="empty-icon">📍</div>
            <div className="empty-text">ยังไม่มี Location</div>
            <div className="empty-sub">เพิ่ม Location แรกได้เลย</div>
          </div>
        </div>
      ) : (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(240px, 1fr))', gap: 14 }}>
          {data.items.map((loc: any) => {
            const assetCount = loc._count?.assets ?? loc.assets?.length ?? 0;
            return (
              <div key={loc.id} className="card">
                <div className="card-body" style={{ padding: '16px 18px' }}>
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
                    <>
                      <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: 8 }}>
                        <div>
                          <div style={{ fontSize: 16, fontWeight: 700, marginBottom: 6 }}>
                            📍 {loc.name}
                          </div>
                          <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                            <span className="badge badge-blue">{assetCount} Assets</span>
                          </div>
                        </div>
                        {canManage && (
                          <div style={{ display: 'flex', gap: 4 }}>
                            <button
                              className="btn btn-ghost btn-sm"
                              onClick={() => { setEditId(loc.id); setEditName(loc.name); }}
                              title="แก้ไข"
                            >
                              ✏️
                            </button>
                            {auth?.role === 'ADMIN' && assetCount === 0 && (
                              <button
                                className="btn btn-ghost btn-sm"
                                onClick={() => remove(loc.id, loc.name)}
                                disabled={deleting === loc.id}
                                style={{ color: 'var(--danger)' }}
                                title="ลบ"
                              >
                                {deleting === loc.id ? '...' : '🗑'}
                              </button>
                            )}
                          </div>
                        )}
                      </div>
                      <div style={{ fontSize: 12, color: 'var(--gray-400)', marginTop: 10 }}>
                        สร้างเมื่อ {new Date(loc.createdAt).toLocaleDateString('th-TH')}
                      </div>
                    </>
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

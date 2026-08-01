import useSWR from 'swr';
import { useState } from 'react';
import { get, post, put, del } from '../src/lib/api';
import { useAuth } from '../src/hooks/useAuth';

const GRANTABLE = [
  { key: 'asset:edit',      label: '🖥 แก้ไข Asset' },
  { key: 'location:manage', label: '📍 จัดการ Location' },
];

export default function UsersPage() {
  const auth  = useAuth();
  const { data, error, mutate } = useSWR('/users', () => get('/users'));

  const [showCreate, setShowCreate]   = useState(false);
  const [form, setForm] = useState({ name: '', email: '', password: '', role: 'TECHNICIAN', primarySkill: '' });
  const [creating, setCreating]       = useState(false);

  const [editId,   setEditId]   = useState<number | null>(null);
  const [editForm, setEditForm] = useState({ name: '', primarySkill: '' });
  const [saving,   setSaving]   = useState(false);

  const [permLoading, setPermLoading] = useState('');

  if (error) return <div className="alert alert-error">โหลดข้อมูลไม่สำเร็จ</div>;
  if (!data)  return <div className="page-loading"><div className="spinner" /><span>กำลังโหลด...</span></div>;

  async function createUser() {
    setCreating(true);
    try {
      await post('/users', form);
      setForm({ name: '', email: '', password: '', role: 'TECHNICIAN', primarySkill: '' });
      setShowCreate(false); mutate();
    } catch (err: any) { alert(err.message); }
    finally { setCreating(false); }
  }

  async function saveEdit(id: number) {
    setSaving(true);
    try { await put(`/users/${id}`, editForm); setEditId(null); mutate(); }
    catch (err: any) { alert(err.message); }
    finally { setSaving(false); }
  }

  async function deactivate(id: number, name: string) {
    if (!confirm(`ปิดการใช้งาน "${name}"?`)) return;
    try { await post(`/users/${id}/deactivate`); mutate(); }
    catch (err: any) { alert(err.message); }
  }

  async function togglePerm(userId: number, permission: string, has: boolean) {
    const key = `${userId}:${permission}`;
    setPermLoading(key);
    try {
      has ? await del(`/users/${userId}/permissions/${permission}`)
          : await post(`/users/${userId}/permissions`, { permission });
      mutate();
    } catch (err: any) { alert(err.message); }
    finally { setPermLoading(''); }
  }

  return (
    <>
      <div className="page-header">
        <div>
          <h1 className="page-title">Users</h1>
          <p className="page-subtitle">ผู้ใช้งานในระบบ ({data.items.length} คน)</p>
        </div>
        {auth?.role === 'ADMIN' && (
          <button className="btn btn-primary" onClick={() => setShowCreate(true)}>+ เพิ่ม User</button>
        )}
      </div>

      {/* Table */}
      <div className="card">
        <div className="table-wrap">
          <table className="table">
            <thead>
              <tr>
                <th>ชื่อ</th>
                <th>Email</th>
                <th>Role</th>
                <th>ทักษะหลัก</th>
                <th>สิทธิ์เพิ่มเติม</th>
                {auth?.role === 'ADMIN' && <th style={{ width: 160 }}>Actions</th>}
              </tr>
            </thead>
            <tbody>
              {data.items.map((u: any) => (
                <tr key={u.id}>
                  {/* Name */}
                  <td>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                      <div style={{
                        width: 32, height: 32, borderRadius: '50%',
                        background: u.role === 'ADMIN' ? 'var(--primary-light)' : 'var(--success-light)',
                        display: 'flex', alignItems: 'center', justifyContent: 'center',
                        fontSize: 13, fontWeight: 700,
                        color: u.role === 'ADMIN' ? 'var(--primary-dark)' : '#15803d',
                        flexShrink: 0,
                      }}>
                        {u.name.slice(0, 2).toUpperCase()}
                      </div>
                      <div>
                        {editId === u.id ? (
                          <input className="form-input" style={{ padding: '5px 8px', fontSize: 13 }}
                            value={editForm.name} onChange={e => setEditForm({ ...editForm, name: e.target.value })} />
                        ) : (
                          <span style={{ fontWeight: 600 }}>{u.name}</span>
                        )}
                      </div>
                    </div>
                  </td>
                  <td style={{ color: 'var(--gray-500)', fontSize: 13 }}>{u.email}</td>
                  <td>
                    <span className={`badge ${u.role === 'ADMIN' ? 'badge-blue' : 'badge-green'}`}>
                      {u.role}
                    </span>
                  </td>
                  <td style={{ color: 'var(--gray-500)' }}>
                    {editId === u.id ? (
                      <input className="form-input" style={{ padding: '5px 8px', fontSize: 13 }}
                        value={editForm.primarySkill} onChange={e => setEditForm({ ...editForm, primarySkill: e.target.value })} />
                    ) : (u.primarySkill || '—')}
                  </td>
                  {/* Permissions */}
                  <td>
                    {u.role === 'TECHNICIAN' ? (
                      <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap' }}>
                        {GRANTABLE.map(({ key, label }) => {
                          const has     = (u.permissions || []).includes(key);
                          const loading = permLoading === `${u.id}:${key}`;
                          return (
                            <label key={key} style={{
                              display: 'flex', alignItems: 'center', gap: 5,
                              fontSize: 12, cursor: auth?.role === 'ADMIN' ? 'pointer' : 'default',
                              padding: '3px 8px', borderRadius: 9999,
                              background: has ? 'var(--success-light)' : 'var(--gray-100)',
                              color: has ? '#15803d' : 'var(--gray-500)',
                              border: `1px solid ${has ? '#86efac' : 'var(--gray-200)'}`,
                              transition: 'all .15s',
                            }}>
                              <input type="checkbox" checked={has}
                                disabled={auth?.role !== 'ADMIN' || loading}
                                onChange={() => auth?.role === 'ADMIN' && togglePerm(u.id, key, has)}
                                style={{ cursor: 'pointer' }}
                              />
                              {loading ? '...' : label}
                            </label>
                          );
                        })}
                      </div>
                    ) : (
                      <span style={{ fontSize: 12, color: 'var(--gray-400)' }}>ทุกสิทธิ์ (Admin)</span>
                    )}
                  </td>
                  {auth?.role === 'ADMIN' && (
                    <td>
                      {editId === u.id ? (
                        <div style={{ display: 'flex', gap: 6 }}>
                          <button className="btn btn-primary btn-sm" onClick={() => saveEdit(u.id)} disabled={saving}>
                            {saving ? '...' : 'บันทึก'}
                          </button>
                          <button className="btn btn-ghost btn-sm" onClick={() => setEditId(null)}>ยกเลิก</button>
                        </div>
                      ) : (
                        <div style={{ display: 'flex', gap: 6 }}>
                          <button className="btn btn-ghost btn-sm" onClick={() => { setEditId(u.id); setEditForm({ name: u.name, primarySkill: u.primarySkill || '' }); }}>
                            แก้ไข
                          </button>
                          {u.id !== auth?.id && (
                            <button className="btn btn-ghost btn-sm" onClick={() => deactivate(u.id, u.name)} style={{ color: 'var(--danger)' }}>
                              ปิดใช้งาน
                            </button>
                          )}
                        </div>
                      )}
                    </td>
                  )}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Create Modal */}
      {showCreate && (
        <div className="modal-overlay" onClick={() => setShowCreate(false)}>
          <div className="modal" onClick={e => e.stopPropagation()}>
            <div className="modal-header">
              <span className="modal-title">เพิ่ม User ใหม่</span>
              <button className="modal-close" onClick={() => setShowCreate(false)}>×</button>
            </div>
            <div className="modal-body">
              <div className="form-grid-2">
                {[
                  { k: 'name',         l: 'ชื่อ',        t: 'text' },
                  { k: 'email',        l: 'Email',       t: 'email' },
                  { k: 'password',     l: 'Password',    t: 'password' },
                  { k: 'primarySkill', l: 'ทักษะหลัก',   t: 'text' },
                ].map(({ k, l, t }) => (
                  <div className="form-group" key={k}>
                    <label className="form-label">{l}</label>
                    <input className="form-input" type={t} value={(form as any)[k]}
                      onChange={e => setForm({ ...form, [k]: e.target.value })} />
                  </div>
                ))}
                <div className="form-group">
                  <label className="form-label">Role</label>
                  <select className="form-select" value={form.role} onChange={e => setForm({ ...form, role: e.target.value })}>
                    <option value="TECHNICIAN">TECHNICIAN</option>
                    <option value="ADMIN">ADMIN</option>
                  </select>
                </div>
              </div>
            </div>
            <div className="modal-footer">
              <button className="btn btn-ghost" onClick={() => setShowCreate(false)}>ยกเลิก</button>
              <button className="btn btn-primary" onClick={createUser} disabled={creating}>
                {creating ? 'กำลังสร้าง...' : 'สร้าง User'}
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}

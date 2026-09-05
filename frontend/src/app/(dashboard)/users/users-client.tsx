'use client';

import { useRouter } from 'next/navigation';
import { useState } from 'react';
import { Badge }    from '@/components/ui/badge';
import { Button }   from '@/components/ui/button';
import { Input }    from '@/components/ui/input';
import { Label }    from '@/components/ui/label';
import { Select }   from '@/components/ui/select';
import { Dialog, DialogHeader, DialogBody, DialogFooter } from '@/components/ui/dialog';
import { Spinner }  from '@/components/ui/spinner';
import { useToast } from '@/components/ui/toast';
import {
  createUserAction, updateUserAction,
  deactivateUserAction, grantPermissionAction, revokePermissionAction,
} from '@/features/users/actions';

const GRANTABLE = [
  { key: 'asset:edit',      label: '🖥 แก้ไข Asset' },
  { key: 'location:manage', label: '📍 จัดการ Location' },
];

export function UsersClient({ users }: { users: any[] }) {
  const router = useRouter();
  const toast  = useToast();

  const [showCreate, setShowCreate] = useState(false);
  const [creating,   setCreating]   = useState(false);
  const [form, setForm] = useState({ name: '', email: '', password: '', role: 'TECHNICIAN', primarySkill: '' });

  const [editId,   setEditId]   = useState<number | null>(null);
  const [editForm, setEditForm] = useState({ name: '', primarySkill: '' });
  const [saving,   setSaving]   = useState(false);

  async function handleCreate() {
    setCreating(true);
    const res = await createUserAction(form as any);
    setCreating(false);
    if (!res.success) { toast.error(res.error); return; }
    toast.success('สร้าง User สำเร็จ');
    setShowCreate(false);
    setForm({ name: '', email: '', password: '', role: 'TECHNICIAN', primarySkill: '' });
    router.refresh();
  }

  async function handleEdit(id: number) {
    setSaving(true);
    const res = await updateUserAction(id, editForm);
    setSaving(false);
    if (!res.success) { toast.error(res.error); return; }
    toast.success('บันทึกสำเร็จ');
    setEditId(null);
    router.refresh();
  }

  async function handleDeactivate(id: number, name: string) {
    const res = await deactivateUserAction(id);
    if (!res.success) { toast.error(res.error); return; }
    toast.success(`ปิดการใช้งาน ${name} แล้ว`);
    router.refresh();
  }

  async function handlePerm(userId: number, permission: string, has: boolean) {
    const res = has
      ? await revokePermissionAction(userId, permission)
      : await grantPermissionAction(userId, { permission: permission as any });
    if (!res.success) { toast.error(res.error); return; }
    router.refresh();
  }

  return (
    <>
      <div className="flex justify-end mb-3">
        <Button onClick={() => setShowCreate(true)}>+ เพิ่ม User</Button>
      </div>

      <div className="rounded-xl border border-border bg-white shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="bg-gray-50 border-b border-border text-xs font-semibold text-gray-500">
                <th className="px-4 py-2.5 text-left">ชื่อ</th>
                <th className="px-4 py-2.5 text-left">Email</th>
                <th className="px-4 py-2.5 text-left">Role</th>
                <th className="px-4 py-2.5 text-left">ทักษะหลัก</th>
                <th className="px-4 py-2.5 text-left">สิทธิ์เพิ่มเติม</th>
                <th className="px-4 py-2.5" />
              </tr>
            </thead>
            <tbody className="divide-y divide-border">
              {users.map((u: any) => (
                <tr key={u.id} className="hover:bg-gray-50 transition-colors">
                  <td className="px-4 py-3">
                    <div className="flex items-center gap-2">
                      <div className={`flex h-8 w-8 flex-shrink-0 items-center justify-center rounded-full text-xs font-bold ${u.role === 'ADMIN' ? 'bg-blue-100 text-blue-700' : 'bg-green-100 text-green-700'}`}>
                        {u.name.slice(0, 2).toUpperCase()}
                      </div>
                      <div>
                        {editId === u.id ? (
                          <Input className="h-7 text-xs" value={editForm.name}
                            onChange={(e) => setEditForm({ ...editForm, name: e.target.value })} />
                        ) : (
                          <span className="font-semibold">{u.name}</span>
                        )}
                        {!u.isActive && <Badge variant="destructive" className="ml-1 text-[10px]">ปิดใช้งาน</Badge>}
                      </div>
                    </div>
                  </td>
                  <td className="px-4 py-3 text-gray-500 text-xs">{u.email}</td>
                  <td className="px-4 py-3">
                    <Badge variant={u.role === 'ADMIN' ? 'blue' : 'success'}>{u.role}</Badge>
                  </td>
                  <td className="px-4 py-3 text-gray-500 text-xs">
                    {editId === u.id ? (
                      <Input className="h-7 text-xs" value={editForm.primarySkill}
                        onChange={(e) => setEditForm({ ...editForm, primarySkill: e.target.value })} />
                    ) : (u.primarySkill ?? '—')}
                  </td>
                  <td className="px-4 py-3">
                    {u.role === 'TECHNICIAN' ? (
                      <div className="flex gap-1.5 flex-wrap">
                        {GRANTABLE.map(({ key, label }) => {
                          const has = (u.permissions ?? []).some((p: any) => p.permission === key);
                          return (
                            <label key={key} className={`flex cursor-pointer items-center gap-1 rounded-full border px-2 py-0.5 text-[11px] font-medium transition-colors ${
                              has ? 'border-green-300 bg-green-50 text-green-700' : 'border-gray-200 bg-gray-50 text-gray-500'
                            }`}>
                              <input type="checkbox" checked={has} className="sr-only"
                                onChange={() => handlePerm(u.id, key, has)} />
                              {label}
                            </label>
                          );
                        })}
                      </div>
                    ) : (
                      <span className="text-xs text-gray-400">ทุกสิทธิ์ (Admin)</span>
                    )}
                  </td>
                  <td className="px-4 py-3">
                    {editId === u.id ? (
                      <div className="flex gap-1">
                        <Button size="sm" onClick={() => handleEdit(u.id)} disabled={saving}>
                          {saving ? '...' : 'บันทึก'}
                        </Button>
                        <Button size="sm" variant="outline" onClick={() => setEditId(null)}>ยกเลิก</Button>
                      </div>
                    ) : (
                      <div className="flex gap-1">
                        <Button size="sm" variant="ghost" onClick={() => { setEditId(u.id); setEditForm({ name: u.name, primarySkill: u.primarySkill ?? '' }); }}>
                          แก้ไข
                        </Button>
                        {u.isActive && (
                          <Button size="sm" variant="ghost" className="text-red-500"
                            onClick={() => handleDeactivate(u.id, u.name)}>
                            ปิดใช้งาน
                          </Button>
                        )}
                      </div>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Create dialog */}
      <Dialog open={showCreate} onClose={() => setShowCreate(false)}>
        <DialogHeader onClose={() => setShowCreate(false)}>เพิ่ม User ใหม่</DialogHeader>
        <DialogBody className="space-y-3">
          <div className="grid grid-cols-2 gap-3">
            {[{ k: 'name', l: 'ชื่อ', t: 'text' }, { k: 'email', l: 'Email', t: 'email' },
              { k: 'password', l: 'Password', t: 'password' }, { k: 'primarySkill', l: 'ทักษะหลัก', t: 'text' }].map(({ k, l, t }) => (
              <div key={k} className={k === 'password' || k === 'primarySkill' ? '' : ''}>
                <Label>{l}</Label>
                <Input type={t} value={(form as any)[k]} onChange={(e) => setForm({ ...form, [k]: e.target.value })} />
              </div>
            ))}
          </div>
          <div>
            <Label>Role</Label>
            <Select value={form.role} onChange={(e) => setForm({ ...form, role: e.target.value })}>
              <option value="TECHNICIAN">TECHNICIAN</option>
              <option value="ADMIN">ADMIN</option>
            </Select>
          </div>
        </DialogBody>
        <DialogFooter>
          <Button variant="outline" onClick={() => setShowCreate(false)}>ยกเลิก</Button>
          <Button onClick={handleCreate} disabled={creating}>
            {creating ? <><Spinner className="h-4 w-4" /> กำลังสร้าง...</> : 'สร้าง User'}
          </Button>
        </DialogFooter>
      </Dialog>
    </>
  );
}

'use client';

import { useRouter } from 'next/navigation';
import { useState }  from 'react';
import { Badge }     from '@/components/ui/badge';
import { Button }    from '@/components/ui/button';
import { Input }     from '@/components/ui/input';
import { Label }     from '@/components/ui/label';
import { Dialog, DialogHeader, DialogBody, DialogFooter } from '@/components/ui/dialog';
import { Spinner }   from '@/components/ui/spinner';
import { EmptyState } from '@/components/ui/empty-state';
import { useToast }  from '@/components/ui/toast';
import {
  createLocationAction,
  updateLocationAction,
  deleteLocationAction,
} from '@/features/locations/actions';

interface Location {
  id: number;
  name: string;
  building?: string | null;
  floor?: string | null;
  mapImageUrl?: string | null;
  _count: { assets: number };
}

interface Props { locations: Location[] }

const EMPTY_FORM = { name: '', building: '', floor: '' };

export function LocationsClient({ locations }: Props) {
  const router = useRouter();
  const toast  = useToast();

  const [showCreate, setShowCreate] = useState(false);
  const [creating,   setCreating]   = useState(false);
  const [form, setForm] = useState(EMPTY_FORM);

  const [editId,   setEditId]   = useState<number | null>(null);
  const [editForm, setEditForm] = useState(EMPTY_FORM);
  const [saving,   setSaving]   = useState(false);

  const [deletingId, setDeletingId] = useState<number | null>(null);

  // ─── Create ──────────────────────────────────────────────────────────────
  async function handleCreate() {
    if (!form.name.trim()) { toast.error('กรุณากรอกชื่อ Location'); return; }
    setCreating(true);
    const res = await createLocationAction(form);
    setCreating(false);
    if (!res.success) { toast.error(res.error); return; }
    toast.success('สร้าง Location สำเร็จ');
    setShowCreate(false);
    setForm(EMPTY_FORM);
    router.refresh();
  }

  // ─── Edit ─────────────────────────────────────────────────────────────────
  function startEdit(loc: Location) {
    setEditId(loc.id);
    setEditForm({ name: loc.name, building: loc.building ?? '', floor: loc.floor ?? '' });
  }

  async function handleSave(id: number) {
    if (!editForm.name.trim()) { toast.error('กรุณากรอกชื่อ Location'); return; }
    setSaving(true);
    const res = await updateLocationAction(id, editForm);
    setSaving(false);
    if (!res.success) { toast.error(res.error); return; }
    toast.success('บันทึกสำเร็จ');
    setEditId(null);
    router.refresh();
  }

  // ─── Delete ───────────────────────────────────────────────────────────────
  async function handleDelete(id: number) {
    setDeletingId(id);
    const res = await deleteLocationAction(id);
    setDeletingId(null);
    if (!res.success) { toast.error(res.error); return; }
    toast.success('ลบสำเร็จ');
    router.refresh();
  }

  return (
    <>
      <div className="flex justify-end mb-3">
        <Button onClick={() => setShowCreate(true)}>+ เพิ่ม Location</Button>
      </div>

      {locations.length === 0 ? (
        <EmptyState icon="📍" title="ยังไม่มี Location" subtitle="กดปุ่ม + เพิ่ม Location เพื่อเริ่มต้น" />
      ) : (
        <div className="rounded-xl border border-border bg-white shadow-sm overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="bg-gray-50 border-b border-border text-xs font-semibold text-gray-500">
                  <th className="px-4 py-2.5 text-left">ชื่อสถานที่</th>
                  <th className="px-4 py-2.5 text-left">อาคาร</th>
                  <th className="px-4 py-2.5 text-left">ชั้น</th>
                  <th className="px-4 py-2.5 text-left">Assets</th>
                  <th className="px-4 py-2.5 text-left">แผนที่</th>
                  <th className="px-4 py-2.5" />
                </tr>
              </thead>
              <tbody className="divide-y divide-border">
                {locations.map((loc) => (
                  <tr key={loc.id} className="hover:bg-gray-50 transition-colors">
                    {/* Name */}
                    <td className="px-4 py-3 font-semibold">
                      {editId === loc.id ? (
                        <Input
                          className="h-7 text-xs"
                          value={editForm.name}
                          onChange={(e) => setEditForm({ ...editForm, name: e.target.value })}
                        />
                      ) : loc.name}
                    </td>

                    {/* Building */}
                    <td className="px-4 py-3 text-gray-600">
                      {editId === loc.id ? (
                        <Input
                          className="h-7 text-xs"
                          placeholder="เช่น อาคาร 1"
                          value={editForm.building}
                          onChange={(e) => setEditForm({ ...editForm, building: e.target.value })}
                        />
                      ) : (loc.building ?? '—')}
                    </td>

                    {/* Floor */}
                    <td className="px-4 py-3 text-gray-600">
                      {editId === loc.id ? (
                        <Input
                          className="h-7 text-xs"
                          placeholder="เช่น ชั้น 2"
                          value={editForm.floor}
                          onChange={(e) => setEditForm({ ...editForm, floor: e.target.value })}
                        />
                      ) : (loc.floor ?? '—')}
                    </td>

                    {/* Asset count */}
                    <td className="px-4 py-3">
                      <Badge variant={loc._count.assets > 0 ? 'blue' : 'gray'}>
                        {loc._count.assets} รายการ
                      </Badge>
                    </td>

                    {/* Map */}
                    <td className="px-4 py-3">
                      {loc.mapImageUrl ? (
                        <Badge variant="success">✓ มีแผนที่</Badge>
                      ) : (
                        <span className="text-xs text-gray-400">—</span>
                      )}
                    </td>

                    {/* Actions */}
                    <td className="px-4 py-3">
                      {editId === loc.id ? (
                        <div className="flex gap-1">
                          <Button size="sm" onClick={() => handleSave(loc.id)} disabled={saving}>
                            {saving ? '...' : 'บันทึก'}
                          </Button>
                          <Button size="sm" variant="outline" onClick={() => setEditId(null)}>
                            ยกเลิก
                          </Button>
                        </div>
                      ) : (
                        <div className="flex gap-1">
                          <Button size="sm" variant="ghost" onClick={() => startEdit(loc)}>
                            แก้ไข
                          </Button>
                          {loc._count.assets === 0 && (
                            <Button
                              size="sm"
                              variant="ghost"
                              className="text-red-500"
                              disabled={deletingId === loc.id}
                              onClick={() => handleDelete(loc.id)}
                            >
                              {deletingId === loc.id ? <Spinner className="h-3 w-3" /> : 'ลบ'}
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
      )}

      {/* Create dialog */}
      <Dialog open={showCreate} onClose={() => setShowCreate(false)}>
        <DialogHeader onClose={() => setShowCreate(false)}>เพิ่ม Location ใหม่</DialogHeader>
        <DialogBody className="space-y-3">
          <div>
            <Label>ชื่อสถานที่ *</Label>
            <Input
              placeholder="เช่น อบจ.เชียงใหม่"
              value={form.name}
              onChange={(e) => setForm({ ...form, name: e.target.value })}
            />
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <Label>อาคาร</Label>
              <Input
                placeholder="เช่น อาคาร 1"
                value={form.building}
                onChange={(e) => setForm({ ...form, building: e.target.value })}
              />
            </div>
            <div>
              <Label>ชั้น</Label>
              <Input
                placeholder="เช่น ชั้น 2"
                value={form.floor}
                onChange={(e) => setForm({ ...form, floor: e.target.value })}
              />
            </div>
          </div>
        </DialogBody>
        <DialogFooter>
          <Button variant="outline" onClick={() => setShowCreate(false)}>ยกเลิก</Button>
          <Button onClick={handleCreate} disabled={creating}>
            {creating
              ? <><Spinner className="h-4 w-4" /> กำลังสร้าง...</>
              : 'สร้าง Location'}
          </Button>
        </DialogFooter>
      </Dialog>
    </>
  );
}

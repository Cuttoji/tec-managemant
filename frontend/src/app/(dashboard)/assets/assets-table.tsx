'use client';

import Link from 'next/link';
import { useRouter, useSearchParams, usePathname } from 'next/navigation';
import { useState, useTransition } from 'react';
import { Badge }      from '@/components/ui/badge';
import { Button }     from '@/components/ui/button';
import { Input }      from '@/components/ui/input';
import { Select }     from '@/components/ui/select';
import { Pagination } from '@/components/ui/pagination';
import { EmptyState } from '@/components/ui/empty-state';
import { Spinner }    from '@/components/ui/spinner';
import { Dialog, DialogHeader, DialogBody, DialogFooter } from '@/components/ui/dialog';
import { Label }      from '@/components/ui/label';
import { createAssetAction } from '@/features/assets/actions';
import { useToast }   from '@/components/ui/toast';

interface AssetRow {
  id: number; assetTag?: string | null; serialNumber?: string | null;
  type: string; model?: string | null; isActive: boolean; needsReview: boolean;
  location?: { id: number; name: string } | null;
}

interface Props {
  items: AssetRow[]; total: number; page: number; limit: number; isAdmin: boolean;
}

const TYPE_BADGE: Record<string, any> = {
  PRINTER: 'blue', COMPUTER: 'purple', SCANNER: 'success', OTHER: 'gray',
};

export function AssetsTable({ items, total, page, limit, isAdmin }: Props) {
  const router       = useRouter();
  const pathname     = usePathname();
  const searchParams = useSearchParams();
  const [isPending, start] = useTransition();
  const toast        = useToast();
  const [showCreate, setShowCreate] = useState(false);
  const [creating,   setCreating]   = useState(false);
  const [form, setForm] = useState({ type: 'PRINTER', model: '', assetTag: '', serialNumber: '' });

  const totalPages = Math.ceil(total / limit);

  function updateParam(key: string, val: string) {
    const p = new URLSearchParams(searchParams.toString());
    if (val) p.set(key, val); else p.delete(key);
    p.delete('page');
    start(() => router.push(`${pathname}?${p}`));
  }

  async function handleCreate() {
    setCreating(true);
    const res = await createAssetAction(form as any);
    setCreating(false);
    if (!res.success) { toast.error(res.error); return; }
    toast.success('สร้าง Asset สำเร็จ');
    setShowCreate(false);
    setForm({ type: 'PRINTER', model: '', assetTag: '', serialNumber: '' });
    router.refresh();
  }

  return (
    <>
      {/* Toolbar */}
      <div className="flex flex-wrap items-end gap-3 mb-4">
        <Input
          placeholder="🔍 ค้นหา รหัส / Serial / Model..."
          defaultValue={searchParams.get('q') ?? ''}
          onChange={(e) => updateParam('q', e.target.value)}
          className="w-full sm:w-64"
        />
        <Select value={searchParams.get('type') ?? ''} onChange={(e) => updateParam('type', e.target.value)} className="w-40">
          <option value="">ทุกประเภท</option>
          <option value="PRINTER">Printer</option>
          <option value="COMPUTER">Computer</option>
          <option value="SCANNER">Scanner</option>
          <option value="OTHER">Other</option>
        </Select>
        {isPending && <Spinner className="h-4 w-4" />}
        <span className="ml-auto text-xs text-gray-500">{total} รายการ</span>
        {isAdmin && <Button onClick={() => setShowCreate(true)}>+ เพิ่ม Asset</Button>}
      </div>

      <div className="rounded-xl border border-border bg-white shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="bg-gray-50 border-b border-border text-xs font-semibold text-gray-500">
                <th className="px-4 py-2.5 text-left">ID</th>
                <th className="px-4 py-2.5 text-left">รหัสทรัพย์สิน</th>
                <th className="px-4 py-2.5 text-left">Serial</th>
                <th className="px-4 py-2.5 text-left">ประเภท</th>
                <th className="px-4 py-2.5 text-left">Model</th>
                <th className="px-4 py-2.5 text-left">Location</th>
                <th className="px-4 py-2.5 text-left">สถานะ</th>
                <th className="px-4 py-2.5" />
              </tr>
            </thead>
            <tbody className="divide-y divide-border">
              {items.length === 0 && (
                <tr><td colSpan={8}><EmptyState icon="🖥️" title="ไม่พบ Asset" /></td></tr>
              )}
              {items.map((a) => (
                <tr key={a.id} className="hover:bg-gray-50 transition-colors">
                  <td className="px-4 py-3 text-xs text-gray-400">#{a.id}</td>
                  <td className="px-4 py-3 font-semibold">{a.assetTag ?? '—'}</td>
                  <td className="px-4 py-3 font-mono text-xs text-gray-600">{a.serialNumber ?? '—'}</td>
                  <td className="px-4 py-3"><Badge variant={TYPE_BADGE[a.type]}>{a.type}</Badge></td>
                  <td className="px-4 py-3 text-gray-700">{a.model ?? '—'}</td>
                  <td className="px-4 py-3 text-gray-500 text-xs">{a.location?.name ?? '—'}</td>
                  <td className="px-4 py-3">
                    {a.needsReview ? <Badge variant="warning">⚠ รอตรวจสอบ</Badge>
                      : a.isActive ? <Badge variant="success">● ใช้งาน</Badge>
                      : <Badge variant="gray">○ ปลดระวาง</Badge>}
                  </td>
                  <td className="px-4 py-3">
                    <Button asChild variant="ghost" size="sm">
                      <Link href={`/assets/${a.id}`}>ดู →</Link>
                    </Button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        <Pagination page={page} totalPages={totalPages} onPage={(p) => updateParam('page', String(p))} />
      </div>

      {/* Create dialog */}
      <Dialog open={showCreate} onClose={() => setShowCreate(false)}>
        <DialogHeader onClose={() => setShowCreate(false)}>เพิ่ม Asset ใหม่</DialogHeader>
        <DialogBody className="space-y-3">
          <div>
            <Label>ประเภท *</Label>
            <Select value={form.type} onChange={(e) => setForm({ ...form, type: e.target.value })}>
              <option value="PRINTER">Printer</option><option value="COMPUTER">Computer</option>
              <option value="SCANNER">Scanner</option><option value="OTHER">Other</option>
            </Select>
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div><Label>รหัสทรัพย์สิน</Label><Input placeholder="IT-001" value={form.assetTag} onChange={(e) => setForm({ ...form, assetTag: e.target.value })} /></div>
            <div><Label>Serial Number</Label><Input placeholder="BRO-001" value={form.serialNumber} onChange={(e) => setForm({ ...form, serialNumber: e.target.value })} /></div>
          </div>
          <div><Label>Model</Label><Input placeholder="Brother HL-L8360DW" value={form.model} onChange={(e) => setForm({ ...form, model: e.target.value })} /></div>
        </DialogBody>
        <DialogFooter>
          <Button variant="outline" onClick={() => setShowCreate(false)}>ยกเลิก</Button>
          <Button onClick={handleCreate} disabled={creating}>
            {creating ? <><Spinner className="h-4 w-4" /> กำลังสร้าง...</> : 'สร้าง Asset'}
          </Button>
        </DialogFooter>
      </Dialog>
    </>
  );
}

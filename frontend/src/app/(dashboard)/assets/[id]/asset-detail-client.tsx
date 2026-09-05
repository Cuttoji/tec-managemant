'use client';

import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useState, useRef } from 'react';
import { Button }   from '@/components/ui/button';
import { Badge }    from '@/components/ui/badge';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { Input }    from '@/components/ui/input';
import { Label }    from '@/components/ui/label';
import { Select }   from '@/components/ui/select';
import { Alert }    from '@/components/ui/alert';
import { Spinner }  from '@/components/ui/spinner';
import { Dialog, DialogHeader, DialogBody, DialogFooter } from '@/components/ui/dialog';
import { useToast } from '@/components/ui/toast';
import {
  updateAssetAction, retireAssetAction,
  approveAssetAction, rejectAssetAction,
  uploadLocationMapAction, deleteLocationMapAction,
} from '@/features/assets/actions';
import { formatDateTH, formatNumber } from '@/lib/utils';
import type { SessionUser } from '@/types/auth';

const STATUS_LABEL: Record<string, string> = {
  OPEN: 'รอรับงาน', IN_PROGRESS: 'กำลังซ่อม', COMPLETED: 'รอ Review', REVIEWED: 'เสร็จสิ้น',
};
const STATUS_BADGE: Record<string, any> = {
  OPEN: 'warning', IN_PROGRESS: 'blue', COMPLETED: 'purple', REVIEWED: 'success',
};

interface Props {
  asset:   any;
  history: any[];
  user:    SessionUser;
}

export function AssetDetailClient({ asset, history, user }: Props) {
  const router  = useRouter();
  const toast   = useToast();
  const mapRef  = useRef<HTMLInputElement>(null);

  const [editing,      setEditing]      = useState(false);
  const [saving,       setSaving]       = useState(false);
  const [mapUploading, setMapUploading] = useState(false);
  const [mapPreview,   setMapPreview]   = useState<string | null>(null);
  const [confirmRetire, setConfirmRetire] = useState(false);
  const [form, setForm] = useState({
    type:         asset.type,
    model:        asset.model        ?? '',
    assetTag:     asset.assetTag     ?? '',
    serialNumber: asset.serialNumber ?? '',
    cpu:          asset.cpu          ?? '',
    ramGb:        asset.ramGb        ?? '',
    storageType:  asset.storageType  ?? '',
    storageGb:    asset.storageGb    ?? '',
    purchaseDate: asset.purchaseDate ? new Date(asset.purchaseDate).toISOString().slice(0, 10) : '',
    notes:        asset.notes        ?? '',
  });

  const canEdit  = user.role === 'ADMIN' || user.permissions.includes('asset:edit');
  const isAdmin  = user.role === 'ADMIN';
  const isPrinter  = asset.type === 'PRINTER';
  const isComputer = asset.type === 'COMPUTER' || asset.type === 'OTHER';
  const mapSrc     = mapPreview ?? asset.location?.mapImageUrl ?? null;

  async function handleSave() {
    setSaving(true);
    const res = await updateAssetAction(asset.id, form as any);
    setSaving(false);
    if (!res.success) { toast.error(res.error); return; }
    toast.success('บันทึกสำเร็จ');
    setEditing(false);
    router.refresh();
  }

  async function handleRetire() {
    const res = await retireAssetAction(asset.id);
    if (!res.success) { toast.error(res.error); return; }
    toast.success('ปลดระวาง Asset แล้ว');
    setConfirmRetire(false);
    router.refresh();
  }

  async function handleApprove() {
    const res = await approveAssetAction(asset.id);
    if (!res.success) { toast.error(res.error); return; }
    toast.success('Approve สำเร็จ');
    router.refresh();
  }

  async function handleReject() {
    const res = await rejectAssetAction(asset.id);
    if (!res.success) { toast.error(res.error); return; }
    toast.success('Reject สำเร็จ');
    router.refresh();
  }

  function onMapFile(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    if (file.size > 5 * 1024 * 1024) { toast.error('ไฟล์ใหญ่เกิน 5 MB'); return; }
    const reader = new FileReader();
    reader.onload = async (ev) => {
      const imageData = ev.target?.result as string;
      setMapPreview(imageData);
      setMapUploading(true);
      const res = await uploadLocationMapAction(asset.locationId, imageData);
      setMapUploading(false);
      if (!res.success) { toast.error(res.error); setMapPreview(null); return; }
      toast.success('อัปโหลดผังแล้ว');
      router.refresh();
      if (mapRef.current) mapRef.current.value = '';
    };
    reader.readAsDataURL(file);
  }

  async function handleDeleteMap() {
    setMapUploading(true);
    const res = await deleteLocationMapAction(asset.locationId);
    setMapUploading(false);
    if (!res.success) { toast.error(res.error); return; }
    setMapPreview(null);
    toast.success('ลบผังแล้ว');
    router.refresh();
  }

  return (
    <>
      {/* Header */}
      <div className="mb-6">
        <Link href="/assets" className="text-xs text-gray-400 hover:text-gray-600">← กลับหน้า Assets</Link>
        <div className="mt-2 flex flex-wrap items-start justify-between gap-3">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">
              {asset.assetTag ?? asset.serialNumber ?? `Asset #${asset.id}`}
            </h1>
            <div className="mt-1 flex items-center gap-2">
              <Badge variant={asset.type === 'PRINTER' ? 'blue' : asset.type === 'COMPUTER' ? 'purple' : 'gray'}>
                {asset.type}
              </Badge>
              <span className="text-sm text-gray-500">{asset.model}</span>
            </div>
          </div>
          <div className="flex gap-2 flex-wrap">
            {asset.needsReview && isAdmin && (
              <>
                <Button size="sm" variant="success" onClick={handleApprove}>✅ Approve</Button>
                <Button size="sm" variant="destructive" onClick={handleReject}>✗ Reject</Button>
              </>
            )}
            {canEdit && !editing && asset.isActive && (
              <Button size="sm" variant="outline" onClick={() => setEditing(true)}>✏️ แก้ไข</Button>
            )}
            {isAdmin && asset.isActive && (
              <Button size="sm" variant="outline" className="text-red-600" onClick={() => setConfirmRetire(true)}>
                🗑 Retire
              </Button>
            )}
          </div>
        </div>
      </div>

      {/* Banners */}
      {asset.needsReview && (
        <Alert variant="warning" className="mb-4">⚠️ Asset นี้รอการตรวจสอบจาก Admin</Alert>
      )}
      {!asset.isActive && (
        <Alert variant="error" className="mb-4">
          ○ Asset นี้ถูกปลดระวางแล้ว {asset.retiredAt && `(${formatDateTH(asset.retiredAt)})`}
        </Alert>
      )}

      {/* Main layout */}
      <div className="grid gap-5 lg:grid-cols-[1fr_300px]">
        {/* LEFT */}
        <div className="space-y-5">
          {/* Info card */}
          <Card>
            <CardHeader>
              <CardTitle>{isPrinter ? '🖨️ รายละเอียดเครื่องพิมพ์' : isComputer ? '🖥️ รายละเอียดคอมพิวเตอร์' : '📦 รายละเอียด Asset'}</CardTitle>
              {editing && (
                <div className="flex gap-2">
                  <Button size="sm" variant="outline" onClick={() => setEditing(false)}>ยกเลิก</Button>
                  <Button size="sm" onClick={handleSave} disabled={saving}>
                    {saving ? <Spinner className="h-3 w-3" /> : 'บันทึก'}
                  </Button>
                </div>
              )}
            </CardHeader>
            <CardContent>
              {editing ? (
                <div className="grid grid-cols-2 gap-4">
                  {[
                    { key: 'assetTag',     label: 'รหัสทรัพย์สิน', type: 'text' },
                    { key: 'serialNumber', label: 'Serial Number',  type: 'text' },
                    { key: 'model',        label: 'Model',          type: 'text' },
                    { key: 'purchaseDate', label: 'วันที่ซื้อ',      type: 'date' },
                  ].map((f) => (
                    <div key={f.key}>
                      <Label>{f.label}</Label>
                      <Input type={f.type} value={(form as any)[f.key]} onChange={(e) => setForm({ ...form, [f.key]: e.target.value })} />
                    </div>
                  ))}
                  {isComputer && [
                    { key: 'cpu', label: 'CPU' }, { key: 'ramGb', label: 'RAM (GB)' },
                    { key: 'storageType', label: 'Storage Type' }, { key: 'storageGb', label: 'Storage (GB)' },
                  ].map((f) => (
                    <div key={f.key}>
                      <Label>{f.label}</Label>
                      <Input value={(form as any)[f.key]} onChange={(e) => setForm({ ...form, [f.key]: e.target.value })} />
                    </div>
                  ))}
                  <div className="col-span-2">
                    <Label>หมายเหตุ</Label>
                    <Input value={form.notes} onChange={(e) => setForm({ ...form, notes: e.target.value })} />
                  </div>
                </div>
              ) : (
                <div className="grid grid-cols-2 gap-4">
                  {[
                    { label: 'รหัสทรัพย์สิน', value: asset.assetTag },
                    { label: 'Serial Number',  value: asset.serialNumber },
                    { label: 'Model',          value: asset.model },
                    { label: 'Location',       value: asset.location?.name },
                    { label: 'วันที่ซื้อ',      value: formatDateTH(asset.purchaseDate) },
                    { label: 'รับประกันถึง',    value: formatDateTH(asset.warrantyDate) },
                  ].map(({ label, value }) => (
                    <div key={label}>
                      <div className="text-xs font-medium text-gray-500 mb-1">{label}</div>
                      <div className="rounded-md border border-border bg-gray-50 px-3 py-2 text-sm min-h-[36px]">
                        {value ?? <span className="text-gray-300">—</span>}
                      </div>
                    </div>
                  ))}
                  {isComputer && [
                    { label: 'CPU',          value: asset.cpu },
                    { label: 'RAM (GB)',     value: asset.ramGb },
                    { label: 'Storage Type', value: asset.storageType },
                    { label: 'Storage (GB)', value: asset.storageGb },
                    { label: 'OS',           value: asset.os },
                  ].map(({ label, value }) => (
                    <div key={label}>
                      <div className="text-xs font-medium text-gray-500 mb-1">{label}</div>
                      <div className="rounded-md border border-border bg-gray-50 px-3 py-2 text-sm min-h-[36px]">
                        {value ?? <span className="text-gray-300">—</span>}
                      </div>
                    </div>
                  ))}
                </div>
              )}

              {/* Page counter for printer */}
              {isPrinter && asset.pageCounters?.length > 0 && !editing && (
                <div className="mt-5 border-t border-border pt-4">
                  <div className="text-xs font-semibold uppercase tracking-wider text-gray-500 mb-3">📄 Page Counter ล่าสุด</div>
                  <div className="text-3xl font-bold text-primary font-mono">
                    {formatNumber(asset.pageCounters[0].total)}
                  </div>
                  <div className="text-xs text-gray-400 mt-1">
                    บันทึกเมื่อ {formatDateTH(asset.pageCounters[0].recordedAt)}
                  </div>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Maintenance history */}
          <Card>
            <CardHeader>
              <CardTitle>🔧 ประวัติการซ่อม</CardTitle>
              <Badge variant="gray">{history.length} งาน</Badge>
            </CardHeader>
            {history.length === 0 ? (
              <div className="py-8 text-center text-sm text-gray-400">ยังไม่มีประวัติการซ่อม</div>
            ) : (
              <div className="divide-y divide-border">
                {history.map((m: any) => (
                  <div key={m.id} className="px-5 py-3">
                    <div className="flex items-start justify-between gap-2">
                      <div className="flex items-center gap-2 flex-wrap">
                        <Badge variant={STATUS_BADGE[m.status]}>{STATUS_LABEL[m.status]}</Badge>
                        <span className="text-sm font-medium">{m.issueDetails}</span>
                      </div>
                      <span className="text-xs text-gray-400 flex-shrink-0">{formatDateTH(m.createdAt)}</span>
                    </div>
                    <div className="mt-1 flex flex-wrap gap-x-4 gap-y-0.5 text-xs text-gray-500">
                      {m.technician && <span>👤 {m.technician.name}</span>}
                      {m.totalPageAtRepair != null && <span>📄 Page: {formatNumber(m.totalPageAtRepair)}</span>}
                      {m.symptom && <span>⚠ {m.symptom}</span>}
                    </div>
                    {m.components?.length > 0 && (
                      <div className="mt-1.5 flex flex-wrap gap-1">
                        {m.components.map((c: any, i: number) => (
                          <Badge key={i} variant={/toner/i.test(c.part) ? 'yellow' : /drum/i.test(c.part) ? 'purple' : 'gray'}>
                            {c.part} ×{c.quantity}
                          </Badge>
                        ))}
                      </div>
                    )}
                  </div>
                ))}
              </div>
            )}
          </Card>
        </div>

        {/* RIGHT */}
        <div className="space-y-4">
          {/* Status card */}
          <Card>
            <CardHeader><CardTitle>สถานะ</CardTitle></CardHeader>
            <CardContent className="space-y-3">
              {[
                { label: 'สถานะ',         value: asset.isActive ? <Badge variant="success">● ใช้งาน</Badge> : <Badge variant="gray">○ ปลดระวาง</Badge> },
                { label: 'รอตรวจสอบ',    value: asset.needsReview ? <Badge variant="warning">⚠ รอ Review</Badge> : <Badge variant="success">✓ ผ่านแล้ว</Badge> },
                { label: 'เพิ่มเข้าระบบ', value: <span className="text-sm">{formatDateTH(asset.createdAt)}</span> },
                { label: 'งานซ่อมทั้งหมด', value: <strong className="text-sm">{history.length} งาน</strong> },
              ].map((r) => (
                <div key={r.label} className="flex items-center justify-between">
                  <span className="text-xs text-gray-500">{r.label}</span>
                  {r.value}
                </div>
              ))}
            </CardContent>
          </Card>

          {/* Map image */}
          {asset.locationId && (
            <Card>
              <CardHeader>
                <CardTitle>🗺️ ผังอาคาร</CardTitle>
                <span className="text-xs text-gray-400">{asset.location?.name}</span>
              </CardHeader>
              <div className="relative bg-gray-100 min-h-[160px] flex items-center justify-center overflow-hidden">
                {mapSrc ? (
                  <>
                    <img src={mapSrc} alt="ผังอาคาร" className="w-full max-h-64 object-contain" />
                    {isAdmin && (
                      <div className="absolute inset-0 bg-black/40 opacity-0 hover:opacity-100 transition-opacity flex items-center justify-center gap-2">
                        <Button size="sm" variant="secondary" onClick={() => mapRef.current?.click()} disabled={mapUploading}>🔄 เปลี่ยน</Button>
                        <Button size="sm" variant="destructive" onClick={handleDeleteMap} disabled={mapUploading}>🗑 ลบ</Button>
                      </div>
                    )}
                  </>
                ) : (
                  <div className="text-center p-6">
                    <div className="text-4xl mb-2">🗺️</div>
                    <p className="text-sm text-gray-400">ยังไม่มีผังอาคาร</p>
                    {isAdmin && (
                      <Button size="sm" variant="outline" className="mt-3" onClick={() => mapRef.current?.click()} disabled={mapUploading}>
                        {mapUploading ? <Spinner className="h-3 w-3" /> : '📤 อัปโหลดผัง'}
                      </Button>
                    )}
                  </div>
                )}
                {mapUploading && (
                  <div className="absolute inset-0 bg-white/70 flex items-center justify-center"><Spinner /></div>
                )}
                <input ref={mapRef} type="file" accept="image/png,image/jpeg,image/webp" className="hidden" onChange={onMapFile} />
              </div>
              {isAdmin && mapSrc && (
                <div className="px-4 py-2 border-t border-border text-center text-xs text-gray-400">
                  วางเมาส์บนรูปเพื่อแก้ไข
                </div>
              )}
            </Card>
          )}

          {/* Link to printer summary */}
          {isPrinter && (
            <Card>
              <CardContent className="py-3">
                <p className="text-xs text-gray-500 mb-2">🖨️ ดูสรุปวัสดุสิ้นเปลือง</p>
                <Button asChild variant="outline" size="sm" className="w-full">
                  <Link href="/printer-summary">ไปหน้าสรุป Toner/Drum →</Link>
                </Button>
              </CardContent>
            </Card>
          )}
        </div>
      </div>

      {/* Retire confirm dialog */}
      <Dialog open={confirmRetire} onClose={() => setConfirmRetire(false)}>
        <DialogHeader onClose={() => setConfirmRetire(false)}>ยืนยันการปลดระวาง</DialogHeader>
        <DialogBody>
          <p className="text-sm text-gray-700">
            คุณต้องการปลดระวาง <strong>{asset.assetTag ?? `Asset #${asset.id}`}</strong> ใช่ไหม?<br />
            การดำเนินการนี้จะทำให้ Asset ไม่สามารถใช้งานได้อีก
          </p>
        </DialogBody>
        <DialogFooter>
          <Button variant="outline" onClick={() => setConfirmRetire(false)}>ยกเลิก</Button>
          <Button variant="destructive" onClick={handleRetire}>ยืนยัน Retire</Button>
        </DialogFooter>
      </Dialog>
    </>
  );
}

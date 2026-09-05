'use client';

import { useRouter, useSearchParams, usePathname } from 'next/navigation';
import { useState, useTransition } from 'react';
import { Badge }      from '@/components/ui/badge';
import { Button }     from '@/components/ui/button';
import { Select }     from '@/components/ui/select';
import { Input }      from '@/components/ui/input';
import { Pagination } from '@/components/ui/pagination';
import { EmptyState } from '@/components/ui/empty-state';
import { Spinner }    from '@/components/ui/spinner';
import { Textarea }   from '@/components/ui/textarea';
import { Label }      from '@/components/ui/label';
import { Dialog, DialogHeader, DialogBody, DialogFooter } from '@/components/ui/dialog';
import { useToast }   from '@/components/ui/toast';
import {
  createTicketAction, claimTicketAction,
  reviewTicketAction, completeTicketAction,
} from '@/features/tickets/actions';
import { formatDateTH } from '@/lib/utils';
import type { SessionUser } from '@/types/auth';

const TABS = [
  { value: '',            label: 'ทั้งหมด' },
  { value: 'OPEN',        label: 'รอรับงาน' },
  { value: 'IN_PROGRESS', label: 'กำลังซ่อม' },
  { value: 'COMPLETED',   label: 'รอ Review' },
  { value: 'REVIEWED',    label: 'เสร็จสิ้น' },
];

const STATUS_BADGE: Record<string, any> = {
  OPEN: 'warning', IN_PROGRESS: 'blue', COMPLETED: 'purple', REVIEWED: 'success',
};
const STATUS_LABEL: Record<string, string> = {
  OPEN: 'รอรับงาน', IN_PROGRESS: 'กำลังซ่อม', COMPLETED: 'รอ Review', REVIEWED: 'เสร็จสิ้น',
};

interface Props {
  items: any[]; total: number; page: number; limit: number; user: SessionUser;
}

export function TicketList({ items, total, page, limit, user }: Props) {
  const router       = useRouter();
  const pathname     = usePathname();
  const searchParams = useSearchParams();
  const [isPending, start] = useTransition();
  const toast        = useToast();

  const currentStatus = searchParams.get('status') ?? '';
  const totalPages    = Math.ceil(total / limit);

  // Create ticket dialog
  const [showCreate, setShowCreate] = useState(false);
  const [newAssetId, setNewAssetId] = useState('');
  const [newIssue,   setNewIssue]   = useState('');
  const [creating,   setCreating]   = useState(false);

  // Review panel
  const [reviewId,    setReviewId]    = useState<number | null>(null);
  const [reviewNotes, setReviewNotes] = useState('');
  const [reviewing,   setReviewing]   = useState(false);

  // Complete form (inline)
  const [completeId,   setCompleteId]   = useState<number | null>(null);
  const [completeForm, setCompleteForm] = useState({ repairDetails: '', symptom: '', totalPageAtRepair: '' });
  const [completing,   setCompleting]   = useState(false);

  function updateParam(key: string, val: string) {
    const p = new URLSearchParams(searchParams.toString());
    if (val) p.set(key, val); else p.delete(key);
    p.delete('page');
    start(() => router.push(`${pathname}?${p}`));
  }

  async function handleCreate() {
    if (!newAssetId || !newIssue) { toast.error('กรุณากรอกข้อมูลให้ครบ'); return; }
    setCreating(true);
    const res = await createTicketAction({ assetId: Number(newAssetId), issueDetails: newIssue });
    setCreating(false);
    if (!res.success) { toast.error(res.error); return; }
    toast.success('เปิดงานซ่อมสำเร็จ');
    setShowCreate(false); setNewAssetId(''); setNewIssue('');
    router.refresh();
  }

  async function handleClaim(id: number) {
    const res = await claimTicketAction(id);
    if (!res.success) { toast.error(res.error); return; }
    toast.success('รับงานสำเร็จ');
    router.refresh();
  }

  async function handleReview(approved: boolean) {
    if (!reviewId) return;
    setReviewing(true);
    const res = await reviewTicketAction(reviewId, { approved, reviewNotes: reviewNotes || null });
    setReviewing(false);
    if (!res.success) { toast.error(res.error); return; }
    toast.success(approved ? 'อนุมัติสำเร็จ' : 'ส่งซ่อมใหม่แล้ว');
    setReviewId(null); setReviewNotes('');
    router.refresh();
  }

  async function handleComplete(id: number) {
    if (!completeForm.repairDetails) { toast.error('กรุณากรอกรายละเอียดการซ่อม'); return; }
    setCompleting(true);
    const res = await completeTicketAction(id, {
      repairDetails:     completeForm.repairDetails,
      symptom:           completeForm.symptom || null,
      totalPageAtRepair: completeForm.totalPageAtRepair ? Number(completeForm.totalPageAtRepair) : null,
      usedLoaner:        false,
    });
    setCompleting(false);
    if (!res.success) { toast.error(res.error); return; }
    toast.success('ปิดงานสำเร็จ');
    setCompleteId(null); setCompleteForm({ repairDetails: '', symptom: '', totalPageAtRepair: '' });
    router.refresh();
  }

  return (
    <>
      {/* Tabs */}
      <div className="flex gap-0 border-b border-border mb-4 overflow-x-auto">
        {TABS.map((t: any) => (
          <button
            key={t.value}
            onClick={() => updateParam('status', t.value)}
            className={`px-4 py-2.5 text-sm font-medium whitespace-nowrap border-b-2 transition-colors ${
              currentStatus === t.value
                ? 'border-primary text-primary'
                : 'border-transparent text-gray-500 hover:text-gray-800'
            }`}
          >
            {t.label}
            {currentStatus === t.value && total > 0 && (
              <Badge variant="gray" className="ml-1.5">{total}</Badge>
            )}
          </button>
        ))}
        {isPending && <Spinner className="h-4 w-4 ml-3 self-center" />}

        <div className="ml-auto flex items-center gap-2 pb-1">
          {/* Date filter */}
          <Input type="date" className="h-7 text-xs w-36"
            defaultValue={searchParams.get('dateFrom') ?? ''}
            onChange={(e) => updateParam('dateFrom', e.target.value)} />
          <span className="text-xs text-gray-400">—</span>
          <Input type="date" className="h-7 text-xs w-36"
            defaultValue={searchParams.get('dateTo') ?? ''}
            onChange={(e) => updateParam('dateTo', e.target.value)} />

          {user.role === 'ADMIN' && (
            <Button size="sm" onClick={() => setShowCreate(true)}>+ เปิดงานซ่อม</Button>
          )}
        </div>
      </div>

      {/* List */}
      {items.length === 0 ? (
        <EmptyState icon="🔧" title="ไม่มีงานซ่อม" subtitle="ยังไม่มีงานในสถานะนี้" />
      ) : (
        <div className="space-y-3">
          {items.map((m: any) => {
            const isMine      = Number(m.technicianId) === Number(user.id);
            const canClaim    = m.status === 'OPEN';
            const canComplete = m.status === 'IN_PROGRESS' && isMine;
            const canReview   = m.status === 'COMPLETED' && user.role === 'ADMIN';
            const canEdit     = (m.status === 'COMPLETED' || m.status === 'REVIEWED') && (user.role === 'ADMIN' || isMine);

            return (
              <div key={m.id} className="rounded-xl border border-border bg-white shadow-sm">
                <div className="p-4">
                  {/* Header row */}
                  <div className="flex items-start justify-between gap-2 mb-2">
                    <div className="flex items-center gap-2 flex-wrap">
                      <span className="text-xs font-bold text-gray-400">#{m.id}</span>
                      <Badge variant={STATUS_BADGE[m.status]}>{STATUS_LABEL[m.status]}</Badge>
                      <span className="font-semibold text-sm">
                        {m.asset?.assetTag ?? m.asset?.serialNumber ?? `Asset #${m.assetId}`}
                        {m.asset?.model && <span className="font-normal text-gray-500"> — {m.asset.model}</span>}
                      </span>
                    </div>
                    <span className="text-xs text-gray-400 flex-shrink-0">{formatDateTH(m.createdAt)}</span>
                  </div>

                  {/* Issue */}
                  <div className="text-sm text-gray-700 mb-2">
                    <span className="text-gray-400 mr-1">📋 ปัญหา:</span>{m.issueDetails}
                  </div>

                  {/* Meta */}
                  <div className="flex flex-wrap gap-x-4 gap-y-0.5 text-xs text-gray-500 mb-3">
                    {m.technician && <span>👤 ช่าง: <strong className="text-gray-700">{m.technician.name}</strong></span>}
                    {m.dispatcher && <span>📤 เปิดโดย: {m.dispatcher.name}</span>}
                    {m.totalPageAtRepair != null && <span>📄 Page: {m.totalPageAtRepair.toLocaleString()}</span>}
                    {m.completedAt && <span>✅ ปิดงาน: {formatDateTH(m.completedAt)}</span>}
                  </div>

                  {m.symptom && <div className="text-xs text-gray-600 mb-1">⚠ อาการ: {m.symptom}</div>}
                  {m.repairDetails && (
                    <div className="rounded-md bg-gray-50 px-3 py-2 text-xs text-gray-700 mb-2">
                      ✏ รายละเอียดซ่อม: {m.repairDetails}
                    </div>
                  )}
                  {m.components?.length > 0 && (
                    <div className="flex flex-wrap gap-1 mb-2">
                      {m.components.map((c: any, i: number) => (
                        <Badge key={i} variant={/toner/i.test(c.part) ? 'yellow' : /drum/i.test(c.part) ? 'purple' : 'gray'}>
                          {c.part} ×{c.quantity}
                        </Badge>
                      ))}
                    </div>
                  )}
                  {m.reviewNotes && (
                    <div className="rounded-md bg-red-50 border-l-4 border-red-400 px-3 py-2 text-xs text-red-700 mb-2">
                      📝 หมายเหตุ Review: {m.reviewNotes}
                    </div>
                  )}

                  {/* Actions */}
                  <div className="flex flex-wrap gap-2 mt-2">
                    {canClaim && (
                      <Button size="sm" onClick={() => handleClaim(m.id)}>✋ รับงาน</Button>
                    )}
                    {canComplete && completeId !== m.id && (
                      <Button size="sm" variant="success" onClick={() => setCompleteId(m.id)}>
                        ✅ ปิดงาน + บันทึก
                      </Button>
                    )}
                    {canReview && reviewId !== m.id && (
                      <Button size="sm" variant="warning" onClick={() => setReviewId(m.id)}>🔍 Review</Button>
                    )}
                  </div>

                  {/* Inline complete form */}
                  {canComplete && completeId === m.id && (
                    <div className="mt-3 rounded-lg border border-border bg-gray-50 p-4 space-y-3">
                      <div className="text-sm font-semibold">บันทึกรายละเอียดการซ่อม</div>
                      <div>
                        <Label>รายละเอียดการซ่อม *</Label>
                        <Textarea
                          rows={2} placeholder="อธิบายขั้นตอนการซ่อม..."
                          value={completeForm.repairDetails}
                          onChange={(e) => setCompleteForm({ ...completeForm, repairDetails: e.target.value })}
                        />
                      </div>
                      <div className="grid grid-cols-2 gap-3">
                        <div>
                          <Label>อาการเสีย</Label>
                          <Input placeholder="เช่น กระดาษติด" value={completeForm.symptom}
                            onChange={(e) => setCompleteForm({ ...completeForm, symptom: e.target.value })} />
                        </div>
                        <div>
                          <Label>Total Page (ขณะซ่อม)</Label>
                          <Input type="number" placeholder="0" value={completeForm.totalPageAtRepair}
                            onChange={(e) => setCompleteForm({ ...completeForm, totalPageAtRepair: e.target.value })} />
                        </div>
                      </div>
                      <div className="flex gap-2">
                        <Button size="sm" onClick={() => handleComplete(m.id)} disabled={completing}>
                          {completing ? <Spinner className="h-3 w-3" /> : 'ปิดงาน'}
                        </Button>
                        <Button size="sm" variant="outline" onClick={() => setCompleteId(null)}>ยกเลิก</Button>
                      </div>
                    </div>
                  )}

                  {/* Review panel */}
                  {canReview && reviewId === m.id && (
                    <div className="mt-3 rounded-lg border border-border bg-gray-50 p-4 space-y-3">
                      <Label>หมายเหตุ (optional)</Label>
                      <Textarea rows={2} value={reviewNotes} onChange={(e) => setReviewNotes(e.target.value)} />
                      <div className="flex gap-2">
                        <Button size="sm" variant="success" onClick={() => handleReview(true)} disabled={reviewing}>
                          {reviewing ? <Spinner className="h-3 w-3" /> : '✅ อนุมัติ'}
                        </Button>
                        <Button size="sm" variant="destructive" onClick={() => handleReview(false)} disabled={reviewing}>
                          ↩ ส่งซ่อมใหม่
                        </Button>
                        <Button size="sm" variant="outline" onClick={() => { setReviewId(null); setReviewNotes(''); }}>ยกเลิก</Button>
                      </div>
                    </div>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}

      <Pagination page={page} totalPages={totalPages} onPage={(p) => updateParam('page', String(p))} />

      {/* Create dialog */}
      <Dialog open={showCreate} onClose={() => setShowCreate(false)}>
        <DialogHeader onClose={() => setShowCreate(false)}>เปิดงานซ่อมใหม่</DialogHeader>
        <DialogBody className="space-y-3">
          <div>
            <Label>Asset ID *</Label>
            <Input type="number" placeholder="เช่น 42" value={newAssetId} onChange={(e) => setNewAssetId(e.target.value)} />
          </div>
          <div>
            <Label>รายละเอียดปัญหา *</Label>
            <Textarea rows={3} placeholder="อธิบายปัญหาที่พบ..." value={newIssue} onChange={(e) => setNewIssue(e.target.value)} />
          </div>
        </DialogBody>
        <DialogFooter>
          <Button variant="outline" onClick={() => setShowCreate(false)}>ยกเลิก</Button>
          <Button onClick={handleCreate} disabled={creating}>
            {creating ? <><Spinner className="h-4 w-4" /> กำลังเปิดงาน...</> : 'เปิดงาน'}
          </Button>
        </DialogFooter>
      </Dialog>
    </>
  );
}

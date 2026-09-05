'use client';

import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { Badge }     from '@/components/ui/badge';
import { Button }    from '@/components/ui/button';
import { EmptyState } from '@/components/ui/empty-state';
import { useToast }  from '@/components/ui/toast';
import { approveAssetAction, rejectAssetAction } from '@/features/assets/actions';
import { formatDateTH } from '@/lib/utils';

export function ReviewClient({ items }: { items: any[] }) {
  const router = useRouter();
  const toast  = useToast();

  async function handle(id: number, action: 'approve' | 'reject') {
    const fn  = action === 'approve' ? approveAssetAction : rejectAssetAction;
    const res = await fn(id);
    if (!res.success) { toast.error(res.error); return; }
    toast.success(action === 'approve' ? 'Approve สำเร็จ' : 'Reject สำเร็จ');
    router.refresh();
  }

  if (items.length === 0) {
    return (
      <div className="rounded-xl border border-border bg-white shadow-sm">
        <EmptyState icon="✅" title="ไม่มี Asset รอ Review" subtitle="ทุก Asset ผ่านการตรวจสอบแล้ว" />
      </div>
    );
  }

  return (
    <div className="rounded-xl border border-border bg-white shadow-sm overflow-hidden">
      <div className="overflow-x-auto">
        <table className="w-full text-sm">
          <thead>
            <tr className="bg-gray-50 border-b border-border text-xs font-semibold text-gray-500">
              <th className="px-4 py-2.5 text-left">Asset</th>
              <th className="px-4 py-2.5 text-left">ประเภท</th>
              <th className="px-4 py-2.5 text-left">Serial</th>
              <th className="px-4 py-2.5 text-left">Location</th>
              <th className="px-4 py-2.5 text-left">Import เมื่อ</th>
              <th className="px-4 py-2.5 text-left">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-border">
            {items.map((a: any) => (
              <tr key={a.id} className="hover:bg-gray-50 transition-colors">
                <td className="px-4 py-3">
                  <Link href={`/assets/${a.id}`} className="font-semibold text-primary hover:underline">
                    {a.assetTag ?? `Asset #${a.id}`}
                  </Link>
                </td>
                <td className="px-4 py-3"><Badge variant="blue">{a.type}</Badge></td>
                <td className="px-4 py-3 font-mono text-xs text-gray-600">{a.serialNumber ?? '—'}</td>
                <td className="px-4 py-3 text-gray-500 text-xs">{a.location?.name ?? '—'}</td>
                <td className="px-4 py-3 text-xs text-gray-500">{formatDateTH(a.createdAt)}</td>
                <td className="px-4 py-3">
                  <div className="flex gap-2">
                    <Button size="sm" variant="success" onClick={() => handle(a.id, 'approve')}>✅ Approve</Button>
                    <Button size="sm" variant="destructive" onClick={() => handle(a.id, 'reject')}>✗ Reject</Button>
                    <Button asChild size="sm" variant="ghost">
                      <Link href={`/assets/${a.id}`}>ดู →</Link>
                    </Button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}

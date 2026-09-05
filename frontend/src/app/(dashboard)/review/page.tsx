import type { Metadata } from 'next';
import Link from 'next/link';
import { listPendingReview } from '@/features/assets/queries';
import { ReviewClient }      from './review-client';

export const metadata: Metadata = { title: 'Review Assets' };

export default async function ReviewPage() {
  const items = await listPendingReview();

  return (
    <div className="space-y-5">
      <div className="flex items-start justify-between flex-wrap gap-3">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Review Assets</h1>
          <p className="text-sm text-gray-500 mt-0.5">Asset ที่ Import มาและรอการอนุมัติ</p>
        </div>
        <span className="rounded-full bg-amber-100 text-amber-800 text-sm font-semibold px-3 py-1">
          ⚠ {items.length} รายการ รอ Review
        </span>
      </div>
      <ReviewClient items={items as any} />
    </div>
  );
}

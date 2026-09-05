import type { Metadata } from 'next';
import { auth }        from '@/lib/auth';
import { listAssets }  from '@/features/assets/queries';
import { assetFiltersSchema } from '@/features/assets/schema';
import { getAssetStats } from '@/features/assets/queries';
import { StatCard }    from '@/components/ui/stat-card';
import { AssetsTable } from './assets-table';

export const metadata: Metadata = { title: 'Assets' };

interface PageProps {
  searchParams: Record<string, string | string[] | undefined>;
}

export default async function AssetsPage({ searchParams }: PageProps) {
  const session = await auth();

  // Parse + validate search params
  const filters = assetFiltersSchema.parse({
    q:           searchParams.q,
    type:        searchParams.type,
    locationId:  searchParams.locationId,
    needsReview: searchParams.needsReview,
    isActive:    searchParams.isActive,
    page:        searchParams.page  ?? 1,
    limit:       searchParams.limit ?? 25,
  });

  const [result, stats] = await Promise.all([
    listAssets(filters),
    getAssetStats(),
  ]);

  return (
    <div className="space-y-6">
      <div className="flex items-start justify-between flex-wrap gap-3">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Assets</h1>
          <p className="text-sm text-gray-500 mt-0.5">ครุภัณฑ์ทั้งหมดในระบบ</p>
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        <StatCard icon="🖥️" value={stats.total}       label="ทั้งหมด"    color="bg-blue-100" />
        <StatCard icon="✅" value={stats.active}      label="ใช้งานอยู่" color="bg-green-100" />
        <StatCard icon="⚠️" value={stats.needsReview} label="รอตรวจสอบ" color="bg-amber-100" />
        <StatCard icon="🗑" value={stats.retired}     label="ปลดระวาง"  color="bg-gray-100" />
      </div>

      <AssetsTable
        items={result.items as any}
        total={result.total}
        page={result.page}
        limit={result.limit}
        isAdmin={session?.user.role === 'ADMIN'}
      />
    </div>
  );
}

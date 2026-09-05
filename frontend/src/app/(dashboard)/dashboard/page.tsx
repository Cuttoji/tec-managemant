import type { Metadata } from 'next';
import Link from 'next/link';
import { auth }            from '@/lib/auth';
import { getAssetStats }   from '@/features/assets/queries';
import { getTicketStats }  from '@/features/tickets/queries';
import { StatCard }        from '@/components/ui/stat-card';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { Badge }           from '@/components/ui/badge';
import { Button }          from '@/components/ui/button';
import { db }              from '@/lib/db';
import { formatDateTH }    from '@/lib/utils';

export const metadata: Metadata = { title: 'Dashboard' };

export default async function DashboardPage() {
  const session = await auth();

  const [assetStats, ticketStats, recentTickets] = await Promise.all([
    getAssetStats(),
    getTicketStats(),
    db.maintenanceLog.findMany({
      where:   { status: { in: ['OPEN', 'IN_PROGRESS'] } },
      orderBy: { createdAt: 'desc' },
      take:    8,
      include: {
        asset:      { select: { assetTag: true, model: true } },
        technician: { select: { name: true } },
      },
    }),
  ]);

  const STATUS_LABEL: Record<string, string> = {
    OPEN: 'รอรับงาน', IN_PROGRESS: 'กำลังซ่อม', COMPLETED: 'รอ Review', REVIEWED: 'เสร็จสิ้น',
  };
  const STATUS_BADGE: Record<string, any> = {
    OPEN: 'warning', IN_PROGRESS: 'blue', COMPLETED: 'purple', REVIEWED: 'success',
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold text-gray-900">Dashboard</h1>
        <p className="text-sm text-gray-500 mt-1">
          สวัสดี, <strong>{session?.user.name}</strong>
          <span className="ml-2 text-xs font-normal">({session?.user.role})</span>
        </p>
      </div>

      {/* Asset stats */}
      <section>
        <h2 className="text-xs font-semibold uppercase tracking-wider text-gray-500 mb-3">Assets</h2>
        <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
          <StatCard icon="🖥️" value={assetStats.total}       label="ทั้งหมด"    color="bg-blue-100" />
          <StatCard icon="✅" value={assetStats.active}      label="ใช้งานอยู่" color="bg-green-100" />
          <StatCard icon="⚠️" value={assetStats.needsReview} label="รอตรวจสอบ" color="bg-amber-100" />
          <StatCard icon="🗑" value={assetStats.retired}     label="ปลดระวาง"  color="bg-gray-100" />
        </div>
      </section>

      {/* Ticket stats */}
      <section>
        <h2 className="text-xs font-semibold uppercase tracking-wider text-gray-500 mb-3">Maintenance</h2>
        <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
          <StatCard icon="📋" value={ticketStats.open}       label="รอรับงาน"   color="bg-amber-100" />
          <StatCard icon="🔧" value={ticketStats.inProgress} label="กำลังซ่อม" color="bg-blue-100" />
          <StatCard icon="🔍" value={ticketStats.completed}  label="รอ Review"  color="bg-purple-100" />
          <StatCard icon="✅" value={ticketStats.reviewed}   label="เสร็จสิ้น" color="bg-green-100" />
        </div>
      </section>

      {/* Recent open tickets */}
      <Card>
        <CardHeader>
          <CardTitle>งานซ่อมที่รอดำเนินการ</CardTitle>
          <Button asChild variant="ghost" size="sm">
            <Link href="/tickets">ดูทั้งหมด →</Link>
          </Button>
        </CardHeader>
        <CardContent className="p-0">
          {recentTickets.length === 0 ? (
            <div className="py-8 text-center text-sm text-gray-400">ไม่มีงานค้างอยู่ 🎉</div>
          ) : (
            <div className="divide-y divide-border">
              {recentTickets.map((t: any) => (
                <Link
                  key={t.id}
                  href={`/tickets?status=${t.status}`}
                  className="flex items-center justify-between gap-3 px-5 py-3 hover:bg-gray-50 transition-colors"
                >
                  <div className="min-w-0 flex items-center gap-2 flex-wrap">
                    <Badge variant={STATUS_BADGE[t.status] ?? 'gray'}>
                      {STATUS_LABEL[t.status] ?? t.status}
                    </Badge>
                    <span className="font-medium text-sm truncate">
                      {t.asset.assetTag ?? t.asset.model ?? `Ticket #${t.id}`}
                    </span>
                  </div>
                  <div className="flex-shrink-0 text-right">
                    <div className="text-xs text-gray-400">{formatDateTH(t.createdAt)}</div>
                    {t.technician && (
                      <div className="text-xs text-gray-500">👤 {t.technician.name}</div>
                    )}
                  </div>
                </Link>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}

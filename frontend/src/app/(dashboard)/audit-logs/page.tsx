import type { Metadata } from 'next';
import { db }         from '@/lib/db';
import { Badge }      from '@/components/ui/badge';
import { formatDateTH } from '@/lib/utils';

export const metadata: Metadata = { title: 'Audit Logs' };

export default async function AuditLogsPage({
  searchParams,
}: {
  searchParams: Record<string, string | undefined>;
}) {
  const page  = Number(searchParams.page ?? 1);
  const limit = 30;

  const [logs, total] = await Promise.all([
    db.auditLog.findMany({
      skip:    (page - 1) * limit,
      take:    limit,
      orderBy: { createdAt: 'desc' },
      include: { user: { select: { name: true, role: true } } },
    }),
    db.auditLog.count(),
  ]);

  const ACTION_BADGE: Record<string, any> = {
    create: 'success', update: 'blue', delete: 'destructive', retire: 'warning',
    deactivate: 'warning', claim: 'blue', complete: 'success', approve: 'success',
    reject: 'destructive', review_approve: 'success', review_reject: 'destructive',
  };

  function getVariant(action: string): any {
    const key = Object.keys(ACTION_BADGE).find((k) => action.includes(k));
    return key ? ACTION_BADGE[key] : 'gray';
  }

  return (
    <div className="space-y-5">
      <div>
        <h1 className="text-2xl font-bold text-gray-900">Audit Logs</h1>
        <p className="text-sm text-gray-500 mt-0.5">บันทึกการดำเนินการทั้งหมดในระบบ ({total.toLocaleString()} รายการ)</p>
      </div>

      <div className="rounded-xl border border-border bg-white shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="bg-gray-50 border-b border-border text-xs font-semibold text-gray-500">
                <th className="px-4 py-2.5 text-left">เวลา</th>
                <th className="px-4 py-2.5 text-left">ผู้ดำเนินการ</th>
                <th className="px-4 py-2.5 text-left">Action</th>
                <th className="px-4 py-2.5 text-left">Target</th>
                <th className="px-4 py-2.5 text-left">IP</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border">
              {logs.map((log: any) => (
                <tr key={log.id} className="hover:bg-gray-50 transition-colors">
                  <td className="px-4 py-2.5 text-xs text-gray-500 whitespace-nowrap">
                    {formatDateTH(log.createdAt, { day: '2-digit', month: 'short', year: '2-digit', hour: '2-digit', minute: '2-digit' })}
                  </td>
                  <td className="px-4 py-2.5 text-xs">
                    {log.user ? (
                      <span>{log.user.name} <Badge variant="gray" className="text-[10px]">{log.user.role}</Badge></span>
                    ) : (
                      <span className="text-gray-400">ระบบ</span>
                    )}
                  </td>
                  <td className="px-4 py-2.5">
                    <Badge variant={getVariant(log.action)} className="font-mono text-[11px]">{log.action}</Badge>
                  </td>
                  <td className="px-4 py-2.5 text-xs text-gray-600">
                    {log.targetType} #{log.targetId}
                  </td>
                  <td className="px-4 py-2.5 text-xs font-mono text-gray-400">{log.ip ?? '—'}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {/* Pagination */}
        {total > limit && (
          <div className="flex items-center justify-between gap-3 px-4 py-3 border-t border-border text-xs text-gray-500">
            <span>{(page - 1) * limit + 1}–{Math.min(page * limit, total)} จาก {total}</span>
            <div className="flex gap-2">
              {page > 1 && (
                <a href={`?page=${page - 1}`} className="rounded-md border border-border px-3 py-1 hover:bg-gray-50">← ก่อนหน้า</a>
              )}
              {page * limit < total && (
                <a href={`?page=${page + 1}`} className="rounded-md border border-border px-3 py-1 hover:bg-gray-50">ถัดไป →</a>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

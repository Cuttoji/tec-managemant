import type { Metadata } from 'next';
export const dynamic = 'force-dynamic';
import { ImportClient }       from './import-client';
import { getImportLogsAction } from '@/features/import/actions';

export const metadata: Metadata = { title: 'Import BRAdmin' };

export default async function ImportPage() {
  const logsResult = await getImportLogsAction(1, 10);
  const logs = logsResult.success ? logsResult.data?.items ?? [] : [];

  return (
    <div className="space-y-5">
      <div>
        <h1 className="text-2xl font-bold text-gray-900">Import BRAdmin</h1>
        <p className="text-sm text-gray-500 mt-0.5">นำเข้าข้อมูลเครื่องจาก BRAdmin CSV</p>
      </div>
      <ImportClient recentLogs={logs} />
    </div>
  );
}

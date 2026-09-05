import type { Metadata } from 'next';
import { getCachedPrinterSummary } from '@/features/printer-summary/queries';
import { PrinterSummaryClient }    from './printer-summary-client';

export const metadata: Metadata = { title: 'สรุปเครื่องพิมพ์' };

interface PageProps { searchParams: Record<string, string | undefined>; }

export default async function PrinterSummaryPage({ searchParams }: PageProps) {
  const from = searchParams.from;
  const to   = searchParams.to;
  const data = await getCachedPrinterSummary(from, to);

  return (
    <div className="space-y-5">
      <div>
        <h1 className="text-2xl font-bold text-gray-900">🖨️ สรุปวัสดุสิ้นเปลือง</h1>
        <p className="text-sm text-gray-500 mt-0.5">Toner และ Drum แยกตามสถานที่</p>
      </div>
      <PrinterSummaryClient data={data as any} initialFrom={from} initialTo={to} />
    </div>
  );
}

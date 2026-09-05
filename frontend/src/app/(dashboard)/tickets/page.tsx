import type { Metadata } from 'next';
import { auth }        from '@/lib/auth';
import { listTickets } from '@/features/tickets/queries';
import { ticketFiltersSchema } from '@/features/tickets/schema';
import { TicketList }  from './ticket-list';

export const metadata: Metadata = { title: 'Maintenance' };

interface PageProps { searchParams: Record<string, string | undefined>; }

export default async function TicketsPage({ searchParams }: PageProps) {
  const session = await auth();
  const filters = ticketFiltersSchema.parse({
    status:  searchParams.status,
    page:    searchParams.page  ?? 1,
    limit:   searchParams.limit ?? 20,
    dateFrom: searchParams.dateFrom,
    dateTo:   searchParams.dateTo,
  });

  const result = await listTickets(filters);

  return (
    <div className="space-y-5">
      <div className="flex items-start justify-between flex-wrap gap-3">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Maintenance</h1>
          <p className="text-sm text-gray-500 mt-0.5">งานซ่อมบำรุงทั้งหมด</p>
        </div>
      </div>
      <TicketList
        items={result.items as any}
        total={result.total}
        page={result.page}
        limit={result.limit}
        user={session!.user}
      />
    </div>
  );
}

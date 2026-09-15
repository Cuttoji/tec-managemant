import { format } from 'date-fns';
import { th } from 'date-fns/locale';

const LOCALE = { locale: th };

/** Format a date as Thai locale, e.g. "8 ก.ย. 2026" */
export function formatDateTH(value?: string | Date | null): string {
  if (!value) return '—';
  const d = typeof value === 'string' ? new Date(value) : value;
  if (Number.isNaN(d.getTime())) return '—';
  return format(d, 'd MMM yyyy', LOCALE);
}

/** Format date + time, e.g. "8 ก.ย. 2026 09:19" */
export function formatDateTimeTH(value?: string | Date | null): string {
  if (!value) return '—';
  const d = typeof value === 'string' ? new Date(value) : value;
  if (Number.isNaN(d.getTime())) return '—';
  return format(d, 'd MMM yyyy HH:mm', LOCALE);
}

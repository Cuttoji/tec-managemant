import { type ClassValue, clsx } from 'clsx';
import { twMerge } from 'tailwind-merge';

/** Merge Tailwind class names */
export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

/** Format Thai date */
export function formatDateTH(
  date: Date | string | null | undefined,
  opts: Intl.DateTimeFormatOptions = { day: '2-digit', month: 'short', year: '2-digit' }
): string {
  if (!date) return '—';
  return new Date(date).toLocaleDateString('th-TH', opts);
}

/** Format number with locale separators */
export function formatNumber(n: number | null | undefined): string {
  if (n == null) return '—';
  return n.toLocaleString('th-TH');
}

/** Truncate string */
export function truncate(str: string, max = 60): string {
  return str.length > max ? str.slice(0, max) + '…' : str;
}

/** Build URL search params, omitting empty values */
export function buildParams(
  params: Record<string, string | number | boolean | null | undefined>
): URLSearchParams {
  const p = new URLSearchParams();
  for (const [k, v] of Object.entries(params)) {
    if (v != null && v !== '') p.set(k, String(v));
  }
  return p;
}

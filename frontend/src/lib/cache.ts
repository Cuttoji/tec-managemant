import { revalidateTag, revalidatePath, unstable_cache } from 'next/cache';
import { db } from '@/lib/db';

// ─── Cache tag constants ──────────────────────────────────────────────────────

export const TAGS = {
  assets:      'assets',
  asset:       (id: number) => `asset:${id}`,
  tickets:     'tickets',
  ticket:      (id: number) => `ticket:${id}`,
  locations:   'locations',
  users:       'users',
  summary:     'printer-summary',
  importLogs:  'import-logs',
  auditLogs:   'audit-logs',
} as const;

// ─── Revalidation helpers ─────────────────────────────────────────────────────

export function revalidateAssets(id?: number) {
  revalidateTag(TAGS.assets);
  if (id) revalidateTag(TAGS.asset(id));
}

export function revalidateTickets(id?: number) {
  revalidateTag(TAGS.tickets);
  if (id) revalidateTag(TAGS.ticket(id));
  revalidatePath('/dashboard');
}

export function revalidateLocations() {
  revalidateTag(TAGS.locations);
}

export function revalidateUsers() {
  revalidateTag(TAGS.users);
}

// ─── Cached master-data queries (long TTL, invalidated on mutation) ──────────

/** Locations list — cached 1 hour, busted on location mutation */
export const getCachedLocations = unstable_cache(
  async () =>
    db.location.findMany({
      orderBy: { name: 'asc' },
      select: { id: true, name: true, building: true, floor: true },
    }),
  ['locations-list'],
  { tags: [TAGS.locations], revalidate: 3600 }
);

/** Active users (for dropdowns) — cached 30 min */
export const getCachedTechnicians = unstable_cache(
  async () =>
    db.user.findMany({
      where:   { isActive: true, role: 'TECHNICIAN' },
      orderBy: { name: 'asc' },
      select:  { id: true, name: true, primarySkill: true },
    }),
  ['technicians-list'],
  { tags: [TAGS.users], revalidate: 1800 }
);

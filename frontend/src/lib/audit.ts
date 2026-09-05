import { db } from '@/lib/db';

interface AuditPayload {
  userId:     number;
  action:     string;      // e.g. "asset.update", "ticket.claim"
  targetType: string;      // "Asset" | "MaintenanceLog" | "User" | "Location"
  targetId:   number;
  before?:    object | null;
  after?:     object | null;
  ip?:        string;
  userAgent?: string;
}

const SKIP_KEYS = new Set(['passwordHash', 'mapImageUrl']);

function sanitise(obj: object): object {
  return Object.fromEntries(
    Object.entries(obj)
      .filter(([k]) => !SKIP_KEYS.has(k))
      .map(([k, v]) => {
        if (typeof v === 'string' && v.length > 500) return [k, v.slice(0, 500) + '…'];
        if (Array.isArray(v)) return [k, `[${v.length} items]`];
        return [k, v];
      })
  );
}

/**
 * Write an audit log entry.
 * Fire-and-forget — errors are logged but do NOT bubble up to callers.
 */
export function writeAuditLog(payload: AuditPayload): void {
  const { userId, action, targetType, targetId, before, after, ip, userAgent } = payload;

  db.auditLog
    .create({
      data: {
        userId,
        action,
        targetType,
        targetId,
        before: before ? sanitise(before) : undefined,
        after:  after  ? sanitise(after)  : undefined,
        ip:        ip?.slice(0, 100),
        userAgent: userAgent?.slice(0, 500),
      },
    })
    .catch((err: unknown) =>
      console.error('[audit] write failed:', (err as Error).message)
    );
}

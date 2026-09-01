'use strict';
const prisma = require('../db');

/**
 * auditLog(action, targetType, getTargetId?, getBefore?)
 *
 * Fire-and-forget middleware that writes an AuditLog row after
 * every successful (2xx) mutating response.
 *
 * @param {string}   action       e.g. "asset.create", "maintenance.complete"
 * @param {string}   targetType   "Asset" | "MaintenanceLog" | "User" | "Location"
 * @param {Function} [getTargetId] (req, responseBody) => number  — defaults to req.params.id || body.id
 * @param {Function} [getBefore]   async (req) => object|null     — called BEFORE the handler runs
 */
exports.auditLog = (action, targetType, getTargetId, getBefore) =>
  async (req, res, next) => {
    // Capture before-state if callback provided
    let beforeSnapshot = null;
    if (getBefore) {
      try { beforeSnapshot = await getBefore(req); } catch { /* non-blocking */ }
    }

    // Intercept res.json to capture response body
    const originalJson = res.json.bind(res);
    res.json = (body) => {
      // Only audit successful responses
      if (res.statusCode >= 200 && res.statusCode < 300 && req.user) {
        const targetId =
          typeof getTargetId === 'function'
            ? getTargetId(req, body)
            : Number(req.params?.id || body?.id || 0);

        if (targetId) {
          prisma.auditLog
            .create({
              data: {
                userId:     Number(req.user.id),
                action,
                targetType,
                targetId,
                before:     beforeSnapshot ?? undefined,
                after:      body && typeof body === 'object' ? sanitise(body) : undefined,
                ip:         req.ip || req.socket?.remoteAddress,
                userAgent:  req.headers['user-agent']?.slice(0, 500),
              },
            })
            .catch((err) => console.error('[audit] write failed:', err.message));
        }
      }
      return originalJson(body);
    };

    next();
  };

/**
 * Strips fields that bloat logs (e.g. binary / large strings).
 */
function sanitise(obj) {
  if (!obj || typeof obj !== 'object') return obj;
  const SKIP = new Set(['passwordHash', 'mapImageUrl']);
  const result = {};
  for (const [k, v] of Object.entries(obj)) {
    if (SKIP.has(k)) continue;
    if (typeof v === 'string' && v.length > 500) {
      result[k] = v.slice(0, 500) + '…';
    } else if (Array.isArray(v)) {
      result[k] = `[${v.length} items]`;
    } else {
      result[k] = v;
    }
  }
  return result;
}

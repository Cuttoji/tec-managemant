'use strict';
const prisma = require('../db');

exports.getHealth = async (req, res) => {
  const start = Date.now();
  let dbStatus = 'ok';
  let dbLatencyMs = null;

  try {
    await prisma.$queryRaw`SELECT 1`;
    dbLatencyMs = Date.now() - start;
  } catch (err) {
    dbStatus = 'unreachable';
    console.error('[health] DB ping failed:', err.message);
  }

  const status = dbStatus === 'ok' ? 'ok' : 'degraded';
  const code   = dbStatus === 'ok' ? 200 : 503;

  return res.status(code).json({
    status,
    uptime:       Math.floor(process.uptime()),
    timestamp:    new Date().toISOString(),
    db:           { status: dbStatus, latencyMs: dbLatencyMs },
    memory: {
      heapUsedMb:  Math.round(process.memoryUsage().heapUsed  / 1024 / 1024),
      heapTotalMb: Math.round(process.memoryUsage().heapTotal / 1024 / 1024),
    },
  });
};

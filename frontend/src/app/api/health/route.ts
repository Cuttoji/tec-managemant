import { NextResponse } from 'next/server';
import { db } from '@/lib/db';

export async function GET() {
  const start = Date.now();
  let dbStatus = 'ok';
  let dbLatencyMs: number | null = null;

  try {
    await db.$queryRaw`SELECT 1`;
    dbLatencyMs = Date.now() - start;
  } catch (err) {
    dbStatus = 'unreachable';
    console.error('[health] DB ping failed:', (err as Error).message);
  }

  const mem = process.memoryUsage();
  const status = dbStatus === 'ok' ? 'ok' : 'degraded';

  return NextResponse.json(
    {
      status,
      uptime:    Math.floor(process.uptime()),
      timestamp: new Date().toISOString(),
      db:        { status: dbStatus, latencyMs: dbLatencyMs },
      memory: {
        heapUsedMb:  Math.round(mem.heapUsed  / 1024 / 1024),
        heapTotalMb: Math.round(mem.heapTotal / 1024 / 1024),
      },
    },
    { status: dbStatus === 'ok' ? 200 : 503 }
  );
}

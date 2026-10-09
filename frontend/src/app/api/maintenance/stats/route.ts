import { NextRequest } from 'next/server';
import { db } from '@/lib/db';
import { handle, ok } from '@/lib/apiResponse';
import { requireApiAuth } from '@/lib/apiAuth';

// GET /api/maintenance/stats
export const GET = handle(async (req: NextRequest) => {
  await requireApiAuth(req);

  const [open, inProgress, completed, reviewed] = await Promise.all([
    db.maintenanceLog.count({ where: { status: 'OPEN' } }),
    db.maintenanceLog.count({ where: { status: 'IN_PROGRESS' } }),
    db.maintenanceLog.count({ where: { status: 'COMPLETED' } }),
    db.maintenanceLog.count({ where: { status: 'REVIEWED' } }),
  ]);

  return ok({ open, inProgress, completed, reviewed });
});

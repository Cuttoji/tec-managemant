import { NextRequest } from 'next/server';
import { db } from '@/lib/db';
import { handle, ok, writeAudit } from '@/lib/apiResponse';
import { requireApiAuth, requireApiPermission } from '@/lib/apiAuth';
import { createLocationSchema } from '@/lib/schemas';

// GET /api/locations
export const GET = handle(async (req: NextRequest) => {
  await requireApiAuth(req);

  const items = await db.location.findMany({
    include: { _count: { select: { assets: true } } },
    orderBy: { name: 'asc' },
  });

  return ok({ items });
});

// POST /api/locations
export const POST = handle(async (req: NextRequest) => {
  const { user } = await requireApiPermission('location:manage', req);
  const body = createLocationSchema.parse(await req.json());

  const loc = await db.location.create({ data: { name: body.name.trim() } });

  await writeAudit({
    userId: Number(user.id), action: 'location.create',
    targetType: 'Location', targetId: loc.id, after: loc,
    ip: req.headers.get('x-forwarded-for'),
    userAgent: req.headers.get('user-agent'),
  });

  return ok(loc, 201);
});

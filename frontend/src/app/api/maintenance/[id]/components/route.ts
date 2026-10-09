import { NextRequest } from 'next/server';
import { db } from '@/lib/db';
import { handle, ok, err } from '@/lib/apiResponse';
import { requireApiAuth } from '@/lib/apiAuth';
import { addComponentSchema } from '@/lib/schemas';

type Ctx = { params: Promise<{ id: string }> };

// GET /api/maintenance/[id]/components
export const GET = handle(async (req: NextRequest, ctx: Ctx) => {
  await requireApiAuth(req);
  const { id } = await ctx.params;

  const exists = await db.maintenanceLog.findUnique({ where: { id: Number(id) } });
  if (!exists) return err('Maintenance log not found', 404);

  const items = await db.componentLog.findMany({ where: { maintenanceId: Number(id) } });
  return ok({ items });
});

// POST /api/maintenance/[id]/components
export const POST = handle(async (req: NextRequest, ctx: Ctx) => {
  await requireApiAuth(req);
  const { id } = await ctx.params;

  const body = addComponentSchema.parse(await req.json());

  const exists = await db.maintenanceLog.findUnique({ where: { id: Number(id) } });
  if (!exists) return err('Maintenance log not found', 404);

  const component = await db.componentLog.create({
    data: { maintenanceId: Number(id), part: body.part.trim(), quantity: body.quantity },
  });

  return ok(component, 201);
});

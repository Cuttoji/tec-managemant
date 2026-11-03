import { db } from '@/lib/db';
import { handle, ok, err } from '@/lib/apiResponse';
import { requireApiAdmin } from '@/lib/apiAuth';

type Ctx = { params?: Promise<Record<string, string>> };

// GET /api/import/logs/[id]
export const GET = handle(async (req: Request, ctx: Ctx | undefined) => {
  await requireApiAdmin(req);
  const { id } = await (ctx?.params ?? Promise.resolve({ id: '' }));

  const log = await db.importLog.findUnique({ where: { id: Number(id) } });
  if (!log) return err('ImportLog not found', 404);

  return ok(log);
});

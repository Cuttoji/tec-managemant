import { NextRequest } from 'next/server';
import { writeFile, unlink, mkdir } from 'fs/promises';
import { existsSync } from 'fs';
import path from 'path';
import { db } from '@/lib/db';
import { handle, ok, err, writeAudit } from '@/lib/apiResponse';
import { requireApiAdmin } from '@/lib/apiAuth';

type Ctx = { params: Promise<{ id: string }> };

const UPLOAD_DIR = path.join(process.cwd(), 'public', 'uploads', 'maps');

async function ensureDir() {
  if (!existsSync(UPLOAD_DIR)) await mkdir(UPLOAD_DIR, { recursive: true });
}

// POST /api/locations/[id]/map-image
export const POST = handle(async (req: NextRequest, ctx: Ctx) => {
  const { user } = await requireApiAdmin(req);
  const { id } = await ctx.params;

  const body = await req.json();
  const { imageData } = body;

  if (!imageData || !imageData.startsWith('data:image/')) {
    return err('imageData must be a base64 data URL (data:image/...)', 400);
  }

  const base64Size = imageData.length * 0.75;
  if (base64Size > 5 * 1024 * 1024) return err('Image too large (max 5 MB)', 413);

  const mimeMatch = imageData.match(/^data:(image\/\w+);base64,/);
  if (!mimeMatch) return err('Invalid image format', 400);

  const mimeType = mimeMatch[1];
  const ext = mimeType === 'image/jpeg' ? 'jpg'
            : mimeType === 'image/png'  ? 'png'
            : mimeType === 'image/webp' ? 'webp'
            : null;
  if (!ext) return err('Unsupported image type (use jpg, png, or webp)', 400);

  await ensureDir();

  const existing = await db.location.findUnique({
    where: { id: Number(id) }, select: { mapImageUrl: true },
  });
  if (!existing) return err('Location not found', 404);

  // Remove old file
  if (existing.mapImageUrl) {
    const oldFile = path.join(process.cwd(), 'public', existing.mapImageUrl);
    if (existsSync(oldFile)) await unlink(oldFile).catch(() => {});
  }

  const filename    = `location_${id}_${Date.now()}.${ext}`;
  const filepath    = path.join(UPLOAD_DIR, filename);
  const base64Data  = imageData.replace(/^data:image\/\w+;base64,/, '');
  await writeFile(filepath, Buffer.from(base64Data, 'base64'));

  const mapImageUrl = `/uploads/maps/${filename}`;
  const loc = await db.location.update({
    where: { id: Number(id) },
    data:  { mapImageUrl },
  });

  await writeAudit({
    userId: Number(user.id), action: 'location.map_upload',
    targetType: 'Location', targetId: Number(id),
    ip: req.headers.get('x-forwarded-for'),
    userAgent: req.headers.get('user-agent'),
  });

  return ok({ ok: true, mapImageUrl, location: loc });
});

// DELETE /api/locations/[id]/map-image
export const DELETE = handle(async (req: NextRequest, ctx: Ctx) => {
  const { user } = await requireApiAdmin(req);
  const { id } = await ctx.params;

  const loc = await db.location.findUnique({
    where: { id: Number(id) }, select: { mapImageUrl: true },
  });
  if (!loc) return err('Location not found', 404);

  if (loc.mapImageUrl) {
    const file = path.join(process.cwd(), 'public', loc.mapImageUrl);
    if (existsSync(file)) await unlink(file).catch(() => {});
  }

  const updated = await db.location.update({
    where: { id: Number(id) },
    data:  { mapImageUrl: null },
  });

  await writeAudit({
    userId: Number(user.id), action: 'location.map_delete',
    targetType: 'Location', targetId: Number(id),
    ip: req.headers.get('x-forwarded-for'),
    userAgent: req.headers.get('user-agent'),
  });

  return ok({ ok: true, location: updated });
});

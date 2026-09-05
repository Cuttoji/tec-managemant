'use server';

import { revalidateTag }    from '@/lib/cache';
import { db }               from '@/lib/db';
import { requireSession }   from '@/lib/auth';
import { writeAuditLog }    from '@/lib/audit';
import { safeAction }       from '@/lib/errors';
import { assertPermission, assertAdmin } from '@/lib/rbac';
import { revalidateAssets } from '@/lib/cache';
import {
  createAssetSchema,
  updateAssetSchema,
  type CreateAssetInput,
  type UpdateAssetInput,
} from './schema';

// ─── Create ───────────────────────────────────────────────────────────────────

export async function createAssetAction(input: CreateAssetInput) {
  return safeAction(async () => {
    const session = await requireSession();
    assertAdmin(session.user.role);

    const data = createAssetSchema.parse(input);

    const asset = await db.asset.create({
      data: {
        ...data,
        purchaseDate: data.purchaseDate ? new Date(data.purchaseDate) : undefined,
        warrantyDate: data.warrantyDate ? new Date(data.warrantyDate) : undefined,
      },
    });

    writeAuditLog({
      userId:     Number(session.user.id),
      action:     'asset.create',
      targetType: 'Asset',
      targetId:   asset.id,
      after:      asset,
    });

    revalidateAssets();
    return asset;
  });
}

// ─── Update ───────────────────────────────────────────────────────────────────

export async function updateAssetAction(id: number, input: UpdateAssetInput) {
  return safeAction(async () => {
    const session = await requireSession();
    assertPermission(session.user.role, session.user.permissions, 'asset:edit');

    const data = updateAssetSchema.parse(input);

    const before = await db.asset.findUnique({ where: { id } });
    if (!before) throw new Error('NOT_FOUND');

    const asset = await db.asset.update({
      where: { id },
      data: {
        ...data,
        purchaseDate: data.purchaseDate !== undefined
          ? data.purchaseDate ? new Date(data.purchaseDate) : null
          : undefined,
        warrantyDate: data.warrantyDate !== undefined
          ? data.warrantyDate ? new Date(data.warrantyDate) : null
          : undefined,
      },
      include: {
        location:    { select: { id: true, name: true, mapImageUrl: true } },
        pageCounters: { orderBy: { recordedAt: 'desc' }, take: 5 },
        images:      true,
      },
    });

    writeAuditLog({
      userId:     Number(session.user.id),
      action:     'asset.update',
      targetType: 'Asset',
      targetId:   id,
      before,
      after:      asset,
    });

    revalidateAssets(id);
    return asset;
  });
}

// ─── Retire ───────────────────────────────────────────────────────────────────

export async function retireAssetAction(id: number) {
  return safeAction(async () => {
    const session = await requireSession();
    assertPermission(session.user.role, session.user.permissions, 'asset:retire');

    const asset = await db.asset.update({
      where: { id },
      data:  { isActive: false, retiredAt: new Date() },
    });

    writeAuditLog({
      userId:     Number(session.user.id),
      action:     'asset.retire',
      targetType: 'Asset',
      targetId:   id,
      after:      { isActive: false },
    });

    revalidateAssets(id);
    return asset;
  });
}

// ─── Approve / Reject ─────────────────────────────────────────────────────────

export async function approveAssetAction(id: number) {
  return safeAction(async () => {
    const session = await requireSession();
    assertPermission(session.user.role, session.user.permissions, 'asset:approve');

    const asset = await db.asset.update({
      where: { id },
      data: {
        needsReview: false,
        isActive:    true,
        approvedBy:  Number(session.user.id),
        approvedAt:  new Date(),
        rejectedBy:  null,
        rejectedAt:  null,
      },
    });

    writeAuditLog({
      userId:     Number(session.user.id),
      action:     'asset.approve',
      targetType: 'Asset',
      targetId:   id,
    });

    revalidateAssets(id);
    revalidateTag('review');
    return asset;
  });
}

export async function rejectAssetAction(id: number) {
  return safeAction(async () => {
    const session = await requireSession();
    assertPermission(session.user.role, session.user.permissions, 'asset:approve');

    const asset = await db.asset.update({
      where: { id },
      data: {
        needsReview: false,
        isActive:    false,
        rejectedBy:  Number(session.user.id),
        rejectedAt:  new Date(),
        approvedBy:  null,
        approvedAt:  null,
      },
    });

    writeAuditLog({
      userId:     Number(session.user.id),
      action:     'asset.reject',
      targetType: 'Asset',
      targetId:   id,
    });

    revalidateAssets(id);
    revalidateTag('review');
    return asset;
  });
}

// ─── Upload map image (location floor plan) ───────────────────────────────────

export async function uploadLocationMapAction(locationId: number, imageData: string) {
  return safeAction(async () => {
    const session = await requireSession();
    assertPermission(session.user.role, session.user.permissions, 'location:manage');

    if (!imageData.startsWith('data:image/')) {
      throw new Error('Invalid image format');
    }
    // Check size (~5 MB base64 threshold)
    if (imageData.length * 0.75 > 5 * 1024 * 1024) {
      throw new Error('ไฟล์รูปใหญ่เกิน 5 MB');
    }

    // TODO: Replace with Cloud Storage (R2/S3) upload when configured.
    // For now, store the base64 data URL directly (dev / demo only).
    const location = await db.location.update({
      where: { id: locationId },
      data:  { mapImageUrl: imageData },
    });

    writeAuditLog({
      userId:     Number(session.user.id),
      action:     'location.map_upload',
      targetType: 'Location',
      targetId:   locationId,
    });

    revalidateTag('locations');
    return { mapImageUrl: location.mapImageUrl };
  });
}

export async function deleteLocationMapAction(locationId: number) {
  return safeAction(async () => {
    const session = await requireSession();
    assertPermission(session.user.role, session.user.permissions, 'location:manage');

    await db.location.update({
      where: { id: locationId },
      data:  { mapImageUrl: null },
    });

    writeAuditLog({
      userId:     Number(session.user.id),
      action:     'location.map_delete',
      targetType: 'Location',
      targetId:   locationId,
    });

    revalidateTag('locations');
    return { ok: true };
  });
}

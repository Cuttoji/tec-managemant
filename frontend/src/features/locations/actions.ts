'use server';

import { db }               from '@/lib/db';
import { requireSession }   from '@/lib/auth';
import { writeAuditLog }    from '@/lib/audit';
import { safeAction }       from '@/lib/errors';
import { assertPermission } from '@/lib/rbac';
import { assertAdmin }      from '@/lib/rbac';
import { revalidateLocations } from '@/lib/cache';
import {
  createLocationSchema, updateLocationSchema,
  type CreateLocationInput, type UpdateLocationInput,
} from './schema';

export async function createLocationAction(input: CreateLocationInput) {
  return safeAction(async () => {
    const session = await requireSession();
    assertPermission(session.user.role, session.user.permissions, 'location:manage');

    const data     = createLocationSchema.parse(input);
    const location = await db.location.create({ data });

    writeAuditLog({
      userId:     Number(session.user.id),
      action:     'location.create',
      targetType: 'Location',
      targetId:   location.id,
      after:      location,
    });

    revalidateLocations();
    return location;
  });
}

export async function updateLocationAction(id: number, input: UpdateLocationInput) {
  return safeAction(async () => {
    const session = await requireSession();
    assertPermission(session.user.role, session.user.permissions, 'location:manage');

    const data     = updateLocationSchema.parse(input);
    const location = await db.location.update({ where: { id }, data });

    writeAuditLog({
      userId:     Number(session.user.id),
      action:     'location.update',
      targetType: 'Location',
      targetId:   id,
      after:      data,
    });

    revalidateLocations();
    return location;
  });
}

export async function deleteLocationAction(id: number) {
  return safeAction(async () => {
    const session = await requireSession();
    assertAdmin(session.user.role);

    // Guard: cannot delete if assets are assigned
    const assetCount = await db.asset.count({ where: { locationId: id } });
    if (assetCount > 0) {
      throw new Error(`ไม่สามารถลบได้ มี ${assetCount} Asset อยู่ใน Location นี้`);
    }

    await db.location.delete({ where: { id } });

    writeAuditLog({
      userId:     Number(session.user.id),
      action:     'location.delete',
      targetType: 'Location',
      targetId:   id,
    });

    revalidateLocations();
    return { ok: true };
  });
}

export async function uploadLocationMapAction(locationId: number, imageData: string) {
  return safeAction(async () => {
    const session = await requireSession();
    assertPermission(session.user.role, session.user.permissions, 'location:manage');

    if (!imageData.startsWith('data:image/')) throw new Error('รูปภาพไม่ถูกต้อง');
    if (imageData.length * 0.75 > 5 * 1024 * 1024) throw new Error('ไฟล์ใหญ่เกิน 5 MB');

    // TODO: Replace with Cloud Storage upload (R2/S3) when env vars are set.
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

    revalidateLocations();
    return { mapImageUrl: location.mapImageUrl };
  });
}

export async function deleteLocationMapAction(locationId: number) {
  return safeAction(async () => {
    const session = await requireSession();
    assertPermission(session.user.role, session.user.permissions, 'location:manage');

    await db.location.update({ where: { id: locationId }, data: { mapImageUrl: null } });

    writeAuditLog({
      userId:     Number(session.user.id),
      action:     'location.map_delete',
      targetType: 'Location',
      targetId:   locationId,
    });

    revalidateLocations();
    return { ok: true };
  });
}

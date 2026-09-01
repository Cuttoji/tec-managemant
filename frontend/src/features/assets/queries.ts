import { db } from '@/lib/db';
import { TAGS } from '@/lib/cache';
import { unstable_cache } from 'next/cache';
import type { AssetFiltersInput } from './schema';

// ─── Includes ─────────────────────────────────────────────────────────────────

const ASSET_ROW_INCLUDE = {
  location: { select: { id: true, name: true } },
} as const;

const ASSET_DETAIL_INCLUDE = {
  location:    { select: { id: true, name: true, building: true, floor: true, mapImageUrl: true } },
  pageCounters: { orderBy: { recordedAt: 'desc' as const }, take: 10 },
  images:      { orderBy: { sortOrder: 'asc' as const } },
} as const;

// ─── List ──────────────────────────────────────────────────────────────────────

export async function listAssets(filters: AssetFiltersInput) {
  const { q, type, locationId, needsReview, isActive, page, limit } = filters;
  const skip = (page - 1) * limit;

  const where: Record<string, unknown> = {};

  if (q) {
    where.OR = [
      { assetTag:     { contains: q, mode: 'insensitive' } },
      { serialNumber: { contains: q, mode: 'insensitive' } },
      { model:        { contains: q, mode: 'insensitive' } },
    ];
  }
  if (type)        where.type        = type;
  if (locationId)  where.locationId  = locationId;
  if (needsReview != null) where.needsReview = needsReview;
  if (isActive    != null) where.isActive    = isActive;

  const [items, total] = await Promise.all([
    db.asset.findMany({
      where,
      skip,
      take:    limit,
      orderBy: { id: 'desc' },
      include: ASSET_ROW_INCLUDE,
    }),
    db.asset.count({ where }),
  ]);

  return { items, total, page, limit };
}

// ─── Get one ──────────────────────────────────────────────────────────────────

export async function getAsset(id: number) {
  return db.asset.findUnique({
    where:   { id },
    include: ASSET_DETAIL_INCLUDE,
  });
}

/** Cached version — for read-heavy detail page */
export const getCachedAsset = (id: number) =>
  unstable_cache(
    () =>
      db.asset.findUnique({
        where:   { id },
        include: ASSET_DETAIL_INCLUDE,
      }),
    [`asset:${id}`],
    { tags: [TAGS.asset(id), TAGS.assets], revalidate: 60 }
  )();

// ─── Maintenance history for an asset ─────────────────────────────────────────

export async function getAssetMaintenanceHistory(assetId: number) {
  return db.maintenanceLog.findMany({
    where:   { assetId },
    orderBy: { createdAt: 'desc' },
    include: {
      technician: { select: { id: true, name: true } },
      dispatcher: { select: { id: true, name: true } },
      components: true,
    },
  });
}

// ─── Assets pending review ────────────────────────────────────────────────────

export async function listPendingReview() {
  return db.asset.findMany({
    where:   { needsReview: true },
    orderBy: { createdAt: 'asc' },
    include: ASSET_ROW_INCLUDE,
  });
}

// ─── Stats for dashboard ──────────────────────────────────────────────────────

export async function getAssetStats() {
  const [total, needsReview, active, retired] = await Promise.all([
    db.asset.count(),
    db.asset.count({ where: { needsReview: true } }),
    db.asset.count({ where: { isActive: true, needsReview: false } }),
    db.asset.count({ where: { isActive: false } }),
  ]);
  return { total, needsReview, active, retired };
}

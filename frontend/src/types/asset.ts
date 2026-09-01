import type { AssetType, Asset, Location, PageCounterLog, AssetImage } from '@prisma/client';

export type { AssetType };

/** Full asset with all relations for detail page */
export type AssetDetail = Asset & {
  location:       (Location & { mapImageUrl: string | null }) | null;
  pageCounters:   PageCounterLog[];
  images:         AssetImage[];
};

/** Lightweight asset row for list pages */
export type AssetRow = Pick<
  Asset,
  'id' | 'assetTag' | 'serialNumber' | 'type' | 'model' | 'isActive' | 'needsReview' | 'createdAt'
> & {
  location: Pick<Location, 'id' | 'name'> | null;
};

export interface AssetListResult {
  items: AssetRow[];
  total: number;
  page:  number;
  limit: number;
}

export interface AssetFilters {
  q?:          string;  // search assetTag, serialNumber, model
  type?:       AssetType;
  locationId?: number;
  needsReview?: boolean;
  isActive?:   boolean;
  page?:       number;
  limit?:      number;
}

// Local frontend types mirroring Prisma schema enums and used shapes
export type AssetType = 'PRINTER' | 'COMPUTER' | 'SCANNER' | 'OTHER';

export interface Location {
  id: number;
  name: string;
  mapImageUrl?: string | null;
}

export interface PageCounterLog {
  id: number;
  assetId: number;
  total: number;
  recordedAt: Date;
}

export interface AssetImage {
  id: number;
  assetId: number;
  url: string;
  caption?: string | null;
}

export interface Asset {
  id: number;
  assetTag?: string | null;
  serialNumber?: string | null;
  type: AssetType;
  model?: string | null;
  isActive: boolean;
  needsReview: boolean;
  createdAt: Date;
  location?: Location | null;
  pageCounters?: PageCounterLog[];
  images?: AssetImage[];
}

export type AssetDetail = Asset & {
  location: (Location & { mapImageUrl: string | null }) | null;
  pageCounters: PageCounterLog[];
  images: AssetImage[];
};

export type AssetRow = Pick<
  Asset,
  'id' | 'assetTag' | 'serialNumber' | 'type' | 'model' | 'isActive' | 'needsReview' | 'createdAt'
> & {
  location: Pick<Location, 'id' | 'name'> | null;
};

export interface AssetListResult {
  items: AssetRow[];
  total: number;
  page: number;
  limit: number;
}

export interface AssetFilters {
  q?: string; // search assetTag, serialNumber, model
  type?: AssetType;
  locationId?: number;
  needsReview?: boolean;
  isActive?: boolean;
  page?: number;
  limit?: number;
}

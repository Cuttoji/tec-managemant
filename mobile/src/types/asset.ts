export type AssetType = 'PRINTER' | 'COMPUTER' | 'SCANNER' | 'OTHER';

export interface Location {
  id: number;
  name: string;
  mapImageUrl?: string | null;
  building?: string | null;
  floor?: string | null;
}

export interface PageCounterLog {
  id: number;
  assetId: number;
  total: number;
  recordedAt: string;
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
  createdAt: string;
  location?: Location | null;
  pageCounters?: PageCounterLog[];
  images?: AssetImage[];
}

export interface AssetRow {
  id: number;
  assetTag?: string | null;
  serialNumber?: string | null;
  type: AssetType;
  model?: string | null;
  isActive: boolean;
  needsReview: boolean;
  createdAt: string;
  location: Pick<Location, 'id' | 'name'> | null;
}

export interface AssetDetail extends Asset {
  location: (Location & { mapImageUrl: string | null }) | null;
  pageCounters: PageCounterLog[];
  images: AssetImage[];
}

export interface AssetListResult {
  items: AssetRow[];
  total: number;
  page: number;
  limit: number;
}

export interface AssetFilters {
  q?: string;
  type?: AssetType;
  locationId?: number;
  needsReview?: boolean;
  isActive?: boolean;
  page?: number;
  limit?: number;
}

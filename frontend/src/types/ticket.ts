import type { MaintenanceStatus, MaintenanceLog, ComponentLog, Asset, User } from '@prisma/client';

export type { MaintenanceStatus };

/** Inline user snapshot used in ticket lists */
export type UserSnap = Pick<User, 'id' | 'name' | 'email' | 'role'>;

/** Asset snapshot used in ticket lists */
export type AssetSnap = Pick<Asset, 'id' | 'assetTag' | 'serialNumber' | 'model' | 'type'> & {
  location: { name: string } | null;
  pageCounters: { total: number; recordedAt: Date }[];
};

/** Full ticket row for list + detail */
export type TicketRow = MaintenanceLog & {
  asset:       AssetSnap;
  dispatcher:  UserSnap;
  technician:  UserSnap | null;
  reviewer:    UserSnap | null;
  components:  ComponentLog[];
  loanerAsset: Pick<Asset, 'id' | 'assetTag' | 'serialNumber' | 'model'> | null;
};

export interface TicketListResult {
  items: TicketRow[];
  total: number;
  page:  number;
  limit: number;
}

export interface TicketFilters {
  status?:       MaintenanceStatus;
  technicianId?: number;
  assetId?:      number;
  dateFrom?:     string;
  dateTo?:       string;
  page?:         number;
  limit?:        number;
}

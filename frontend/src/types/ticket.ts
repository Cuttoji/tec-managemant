// Local frontend types mirroring Prisma enums and shapes used by UI
export type MaintenanceStatus = 'OPEN' | 'IN_PROGRESS' | 'COMPLETED' | 'REVIEWED';

export type UserSnap = { id: number; name: string; email: string; role: string };

export type AssetSnap = { id: number; assetTag?: string | null; serialNumber?: string | null; model?: string | null; type: string; location: { name: string } | null; pageCounters: { total: number; recordedAt: Date }[] };

export type ComponentLog = { id: number; maintenanceId: number; part: string; quantity: number; pageAtReplacement?: number | null };

export type MaintenanceLog = {
  id: number;
  assetId: number;
  dispatcherId: number;
  technicianId?: number | null;
  issueDetails: string;
  symptom?: string | null;
  repairDetails?: string | null;
  brand?: string | null;
  reviewNotes?: string | null;
  status: MaintenanceStatus;
  totalPageAtRepair?: number | null;
  completedAt?: Date | null;
  createdAt: Date;
  updatedAt: Date;
};

export type TicketRow = MaintenanceLog & {
  asset: AssetSnap;
  dispatcher: UserSnap;
  technician: UserSnap | null;
  reviewer: UserSnap | null;
  components: ComponentLog[];
  loanerAsset: { id: number; assetTag?: string | null; serialNumber?: string | null; model?: string | null } | null;
};

export interface TicketListResult {
  items: TicketRow[];
  total: number;
  page: number;
  limit: number;
}

export interface TicketFilters {
  status?: MaintenanceStatus;
  technicianId?: number;
  assetId?: number;
  dateFrom?: string;
  dateTo?: string;
  page?: number;
  limit?: number;
}

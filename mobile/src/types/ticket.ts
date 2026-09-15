export type MaintenanceStatus = 'OPEN' | 'IN_PROGRESS' | 'COMPLETED' | 'REVIEWED';

export interface UserSnap {
  id: number;
  name: string;
  email: string;
  role: string;
}

export interface AssetSnap {
  id: number;
  assetTag?: string | null;
  serialNumber?: string | null;
  model?: string | null;
  type: string;
  location: { name: string } | null;
  pageCounters: { total: number; recordedAt: string }[];
}

export interface ComponentLog {
  id: number;
  maintenanceId: number;
  part: string;
  quantity: number;
  pageAtReplacement?: number | null;
}

export interface MaintenanceLog {
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
  completedAt?: string | null;
  createdAt: string;
  updatedAt: string;
}

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

export const MAINTENANCE_STATUS_LABEL: Record<MaintenanceStatus, string> = {
  OPEN: 'รอรับงาน',
  IN_PROGRESS: 'กำลังซ่อม',
  COMPLETED: 'รอ Review',
  REVIEWED: 'เสร็จสิ้น',
};

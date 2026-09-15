export interface Stats {
  total: number;
  active: number;
  needsReview: number;
  retired: number;
}

export interface TicketStats {
  open: number;
  inProgress: number;
  completed: number;
  reviewed: number;
}

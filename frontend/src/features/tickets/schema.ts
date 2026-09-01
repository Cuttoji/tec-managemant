import { z } from 'zod';

// ─── Create ───────────────────────────────────────────────────────────────────

export const createTicketSchema = z.object({
  assetId:      z.coerce.number({ required_error: 'กรุณาเลือก Asset' }).int().positive(),
  issueDetails: z.string().min(1, 'กรุณากรอกรายละเอียดปัญหา').max(2000),
});

// ─── Complete (ช่างปิดงาน) ────────────────────────────────────────────────────

export const completeTicketSchema = z.object({
  repairDetails:     z.string().min(1, 'กรุณากรอกรายละเอียดการซ่อม').max(5000),
  symptom:           z.string().max(500).optional().nullable(),
  brand:             z.string().max(200).optional().nullable(),
  totalPageAtRepair: z.coerce.number().int().min(0).optional().nullable(),
  partReplacedAt:    z.string().optional().nullable(), // ISO datetime string
  usedLoaner:        z.boolean().default(false),
  loanerAssetId:     z.coerce.number().int().positive().optional().nullable(),
  loanerPageStart:   z.coerce.number().int().min(0).optional().nullable(),
  loanerPageEnd:     z.coerce.number().int().min(0).optional().nullable(),
}).refine(
  (d) => !d.usedLoaner || !!d.loanerAssetId,
  { message: 'กรุณาเลือกเครื่องสำรอง', path: ['loanerAssetId'] }
);

// ─── Edit repair details (after complete) ─────────────────────────────────────

export const editRepairSchema = completeTicketSchema.partial().extend({
  repairDetails: z.string().min(1).max(5000).optional(),
});

// ─── Review ───────────────────────────────────────────────────────────────────

export const reviewTicketSchema = z.object({
  approved:    z.boolean({ required_error: 'กรุณาระบุผลการ Review' }),
  reviewNotes: z.string().max(1000).optional().nullable(),
});

// ─── Add component ────────────────────────────────────────────────────────────

export const addComponentSchema = z.object({
  part:             z.string().min(1, 'กรุณากรอกชื่ออะไหล่').max(200),
  quantity:         z.coerce.number().int().min(1).max(9999),
  pageAtReplacement: z.coerce.number().int().min(0).optional().nullable(),
});

// ─── Filters ──────────────────────────────────────────────────────────────────

export const ticketFiltersSchema = z.object({
  status:       z.enum(['OPEN', 'IN_PROGRESS', 'COMPLETED', 'REVIEWED']).optional(),
  technicianId: z.coerce.number().int().positive().optional(),
  assetId:      z.coerce.number().int().positive().optional(),
  dateFrom:     z.string().optional(),
  dateTo:       z.string().optional(),
  page:         z.coerce.number().int().min(1).default(1),
  limit:        z.coerce.number().int().min(1).max(100).default(20),
});

export type CreateTicketInput   = z.infer<typeof createTicketSchema>;
export type CompleteTicketInput = z.infer<typeof completeTicketSchema>;
export type EditRepairInput     = z.infer<typeof editRepairSchema>;
export type ReviewTicketInput   = z.infer<typeof reviewTicketSchema>;
export type AddComponentInput   = z.infer<typeof addComponentSchema>;
export type TicketFiltersInput  = z.infer<typeof ticketFiltersSchema>;

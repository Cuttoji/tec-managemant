'use server';

import { db }                from '@/lib/db';
import { requireSession }    from '@/lib/auth';
import { writeAuditLog }     from '@/lib/audit';
import { safeAction }        from '@/lib/errors';
import { assertPermission, assertAdmin } from '@/lib/rbac';
import { revalidateTickets } from '@/lib/cache';
import {
  createTicketSchema,
  completeTicketSchema,
  editRepairSchema,
  reviewTicketSchema,
  addComponentSchema,
  type CreateTicketInput,
  type CompleteTicketInput,
  type EditRepairInput,
  type ReviewTicketInput,
  type AddComponentInput,
} from './schema';

// ─── Create ───────────────────────────────────────────────────────────────────

export async function createTicketAction(input: CreateTicketInput) {
  return safeAction(async () => {
    const session = await requireSession();
    assertAdmin(session.user.role);

    const data = createTicketSchema.parse(input);

    const ticket = await db.maintenanceLog.create({
      data: {
        assetId:      data.assetId,
        issueDetails: data.issueDetails,
        dispatcherId: Number(session.user.id),
        status:       'OPEN',
      },
    });

    writeAuditLog({
      userId:     Number(session.user.id),
      action:     'ticket.create',
      targetType: 'MaintenanceLog',
      targetId:   ticket.id,
      after:      { assetId: data.assetId, issueDetails: data.issueDetails },
    });

    revalidateTickets();
    return ticket;
  });
}

// ─── Claim ────────────────────────────────────────────────────────────────────

export async function claimTicketAction(id: number) {
  return safeAction(async () => {
    const session = await requireSession();
    assertPermission(session.user.role, session.user.permissions, 'maintenance:claim');

    // Atomic: only update if still OPEN and unclaimed
    const result = await db.maintenanceLog.updateMany({
      where: { id, status: 'OPEN', technicianId: null },
      data:  {
        technicianId: Number(session.user.id),
        status:       'IN_PROGRESS',
        claimedAt:    new Date(),
      },
    });

    if (result.count === 0) {
      throw new Error('งานนี้ถูกรับไปแล้ว หรือไม่อยู่ในสถานะที่รับได้');
    }

    writeAuditLog({
      userId:     Number(session.user.id),
      action:     'ticket.claim',
      targetType: 'MaintenanceLog',
      targetId:   id,
      after:      { status: 'IN_PROGRESS', technicianId: session.user.id },
    });

    revalidateTickets(id);
    return { ok: true };
  });
}

// ─── Complete ─────────────────────────────────────────────────────────────────

export async function completeTicketAction(id: number, input: CompleteTicketInput) {
  return safeAction(async () => {
    const session = await requireSession();
    assertPermission(session.user.role, session.user.permissions, 'maintenance:complete');

    const data = completeTicketSchema.parse(input);

    // Validate loaner asset exists
    if (data.loanerAssetId) {
      const loaner = await db.asset.findUnique({ where: { id: data.loanerAssetId } });
      if (!loaner) throw new Error('ไม่พบเครื่องสำรอง');
    }

    const before = await db.maintenanceLog.findUnique({
      where:  { id },
      select: { status: true, technicianId: true },
    });

    const result = await db.maintenanceLog.updateMany({
      where: { id, status: 'IN_PROGRESS', technicianId: Number(session.user.id) },
      data: {
        repairDetails:     data.repairDetails,
        symptom:           data.symptom    ?? null,
        brand:             data.brand      ?? null,
        totalPageAtRepair: data.totalPageAtRepair ?? null,
        partReplacedAt:    data.partReplacedAt ? new Date(data.partReplacedAt) : null,
        usedLoaner:        data.usedLoaner,
        loanerAssetId:     data.loanerAssetId     ?? null,
        loanerPageStart:   data.loanerPageStart    ?? null,
        loanerPageEnd:     data.loanerPageEnd       ?? null,
        status:            'COMPLETED',
        completedAt:       new Date(),
      },
    });

    if (result.count === 0) {
      throw new Error('ไม่สามารถปิดงานได้ ตรวจสอบสถานะหรือสิทธิ์ของคุณ');
    }

    writeAuditLog({
      userId:     Number(session.user.id),
      action:     'ticket.complete',
      targetType: 'MaintenanceLog',
      targetId:   id,
      before,
      after:      { status: 'COMPLETED', repairDetails: data.repairDetails },
    });

    revalidateTickets(id);
    return { ok: true };
  });
}

// ─── Edit repair details ──────────────────────────────────────────────────────

export async function editRepairDetailsAction(id: number, input: EditRepairInput) {
  return safeAction(async () => {
    const session = await requireSession();
    assertPermission(session.user.role, session.user.permissions, 'maintenance:edit');

    const data = editRepairSchema.parse(input);

    const existing = await db.maintenanceLog.findUnique({ where: { id } });
    if (!existing) throw new Error('NOT_FOUND');

    // Only assigned technician or admin can edit
    if (
      session.user.role !== 'ADMIN' &&
      existing.technicianId !== Number(session.user.id)
    ) {
      throw new Error('FORBIDDEN');
    }

    const before = { ...existing };
    const update: Record<string, unknown> = {};
    if (data.repairDetails !== undefined)     update.repairDetails   = data.repairDetails;
    if (data.symptom       !== undefined)     update.symptom         = data.symptom;
    if (data.brand         !== undefined)     update.brand           = data.brand;
    if (data.totalPageAtRepair !== undefined) update.totalPageAtRepair = data.totalPageAtRepair;
    if (data.partReplacedAt   !== undefined)  update.partReplacedAt  = data.partReplacedAt ? new Date(data.partReplacedAt) : null;
    if (data.usedLoaner       !== undefined)  update.usedLoaner      = data.usedLoaner;
    if (data.loanerAssetId    !== undefined)  update.loanerAssetId   = data.loanerAssetId;
    if (data.loanerPageStart  !== undefined)  update.loanerPageStart = data.loanerPageStart;
    if (data.loanerPageEnd    !== undefined)  update.loanerPageEnd   = data.loanerPageEnd;

    const ticket = await db.maintenanceLog.update({ where: { id }, data: update });

    writeAuditLog({
      userId:     Number(session.user.id),
      action:     'ticket.edit_details',
      targetType: 'MaintenanceLog',
      targetId:   id,
      before,
      after:      update,
    });

    revalidateTickets(id);
    return ticket;
  });
}

// ─── Review ───────────────────────────────────────────────────────────────────

export async function reviewTicketAction(id: number, input: ReviewTicketInput) {
  return safeAction(async () => {
    const session = await requireSession();
    assertAdmin(session.user.role);

    const { approved, reviewNotes } = reviewTicketSchema.parse(input);

    const existing = await db.maintenanceLog.findUnique({ where: { id } });
    if (!existing) throw new Error('NOT_FOUND');
    if (existing.status !== 'COMPLETED') throw new Error('งานนี้ยังไม่ถูกปิดโดยช่าง');

    const data = approved
      ? {
          status:      'REVIEWED' as const,
          reviewedBy:  Number(session.user.id),
          reviewedAt:  new Date(),
          reviewNotes: reviewNotes ?? null,
        }
      : {
          // Rejected — reset back to OPEN
          status:           'OPEN' as const,
          technicianId:     null as null,
          claimedAt:        null as null,
          completedAt:      null as null,
          repairDetails:    null as null,
          symptom:          null as null,
          partReplacedAt:   null as null,
          brand:            null as null,
          totalPageAtRepair: null as null,
          usedLoaner:       false,
          loanerAssetId:    null as null,
          loanerPageStart:  null as null,
          loanerPageEnd:    null as null,
          reviewedBy:       Number(session.user.id),
          reviewedAt:       new Date(),
          reviewNotes:      reviewNotes ?? 'ซ่อมไม่ผ่าน ให้เปิดงานใหม่',
        };

    const ticket = await db.maintenanceLog.update({ where: { id }, data });

    writeAuditLog({
      userId:     Number(session.user.id),
      action:     approved ? 'ticket.review_approve' : 'ticket.review_reject',
      targetType: 'MaintenanceLog',
      targetId:   id,
      after:      { status: data.status, reviewNotes },
    });

    revalidateTickets(id);
    return ticket;
  });
}

// ─── Add component ────────────────────────────────────────────────────────────

export async function addComponentAction(ticketId: number, input: AddComponentInput) {
  return safeAction(async () => {
    const session = await requireSession();
    const data    = addComponentSchema.parse(input);

    const ticket = await db.maintenanceLog.findUnique({ where: { id: ticketId } });
    if (!ticket) throw new Error('NOT_FOUND');

    const component = await db.componentLog.create({
      data: { maintenanceId: ticketId, ...data },
    });

    revalidateTickets(ticketId);
    return component;
  });
}

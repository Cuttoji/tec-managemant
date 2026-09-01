'use strict';
const { z } = require('zod');

// ─── Auth ─────────────────────────────────────────────────────────────────────
exports.loginSchema = z.object({
  email:    z.string().email('Invalid email'),
  password: z.string().min(6, 'Password must be at least 6 characters'),
});

exports.registerSchema = z.object({
  email:    z.string().email(),
  password: z.string().min(6),
  name:     z.string().min(1).max(100).optional(),
  role:     z.enum(['ADMIN', 'TECHNICIAN']).optional(),
});

// ─── Assets ───────────────────────────────────────────────────────────────────
exports.createAssetSchema = z.object({
  type:         z.enum(['PRINTER', 'COMPUTER', 'SCANNER', 'OTHER']),
  model:        z.string().max(200).optional().nullable(),
  assetTag:     z.string().max(50).optional().nullable(),
  serialNumber: z.string().max(100).optional().nullable(),
  locationId:   z.number().int().positive().optional().nullable(),
  cpu:          z.string().max(200).optional().nullable(),
  ramGb:        z.number().int().min(1).max(1024).optional().nullable(),
  storageType:  z.string().max(50).optional().nullable(),
  storageGb:    z.number().int().min(1).max(100_000).optional().nullable(),
  purchaseDate: z.string().datetime({ offset: true }).optional().nullable()
                .or(z.string().regex(/^\d{4}-\d{2}-\d{2}$/).optional().nullable()),
});

exports.updateAssetSchema = exports.createAssetSchema.partial();

// ─── Maintenance ──────────────────────────────────────────────────────────────
exports.createMaintenanceSchema = z.object({
  assetId:      z.number({ required_error: 'assetId required' }).int().positive(),
  issueDetails: z.string().min(1, 'issueDetails required').max(2000),
});

exports.completeMaintenanceSchema = z.object({
  repairDetails:     z.string().min(1, 'repairDetails required').max(5000),
  symptom:           z.string().max(500).optional().nullable(),
  partReplacedAt:    z.string().optional().nullable(),
  brand:             z.string().max(200).optional().nullable(),
  totalPageAtRepair: z.number().int().min(0).optional().nullable(),
  usedLoaner:        z.boolean().optional().default(false),
  loanerAssetId:     z.number().int().positive().optional().nullable(),
  loanerPageStart:   z.number().int().min(0).optional().nullable(),
  loanerPageEnd:     z.number().int().min(0).optional().nullable(),
});

exports.reviewMaintenanceSchema = z.object({
  approved:    z.boolean({ required_error: 'approved (boolean) required' }),
  reviewNotes: z.string().max(1000).optional().nullable(),
});

exports.addComponentSchema = z.object({
  part:     z.string().min(1).max(200),
  quantity: z.number().int().min(1).max(9999),
});

// ─── Locations ────────────────────────────────────────────────────────────────
exports.createLocationSchema = z.object({
  name: z.string().min(1, 'name required').max(200),
});

exports.updateLocationSchema = exports.createLocationSchema;

// ─── Users ────────────────────────────────────────────────────────────────────
exports.createUserSchema = z.object({
  name:         z.string().min(1).max(100),
  email:        z.string().email(),
  password:     z.string().min(6),
  role:         z.enum(['ADMIN', 'TECHNICIAN']).optional().default('TECHNICIAN'),
  primarySkill: z.string().max(200).optional().nullable(),
});

exports.updateUserSchema = z.object({
  name:         z.string().min(1).max(100).optional(),
  primarySkill: z.string().max(200).optional().nullable(),
});

exports.grantPermissionSchema = z.object({
  permission: z.string().min(1).max(100),
});

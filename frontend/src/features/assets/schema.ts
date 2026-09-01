import { z } from 'zod';

const assetTypeEnum = z.enum(['PRINTER', 'COMPUTER', 'SCANNER', 'OTHER']);

// ─── Create ───────────────────────────────────────────────────────────────────

export const createAssetSchema = z.object({
  type:         assetTypeEnum,
  model:        z.string().max(200).optional().nullable(),
  assetTag:     z.string().max(50).optional().nullable(),
  serialNumber: z.string().max(100).optional().nullable(),
  locationId:   z.coerce.number().int().positive().optional().nullable(),
  purchaseDate: z.string().regex(/^\d{4}-\d{2}-\d{2}$/).optional().nullable(),
  warrantyDate: z.string().regex(/^\d{4}-\d{2}-\d{2}$/).optional().nullable(),
  notes:        z.string().max(1000).optional().nullable(),
  // Computer specs
  cpu:          z.string().max(200).optional().nullable(),
  ramGb:        z.coerce.number().int().min(1).max(1024).optional().nullable(),
  storageType:  z.string().max(50).optional().nullable(),
  storageGb:    z.coerce.number().int().min(1).max(100_000).optional().nullable(),
  os:           z.string().max(100).optional().nullable(),
});

export const updateAssetSchema = createAssetSchema.partial();

export const assetFiltersSchema = z.object({
  q:           z.string().optional(),
  type:        assetTypeEnum.optional(),
  locationId:  z.coerce.number().int().positive().optional(),
  needsReview: z.coerce.boolean().optional(),
  isActive:    z.coerce.boolean().optional(),
  page:        z.coerce.number().int().min(1).default(1),
  limit:       z.coerce.number().int().min(1).max(100).default(25),
});

export type CreateAssetInput  = z.infer<typeof createAssetSchema>;
export type UpdateAssetInput  = z.infer<typeof updateAssetSchema>;
export type AssetFiltersInput = z.infer<typeof assetFiltersSchema>;

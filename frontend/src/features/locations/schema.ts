import { z } from 'zod';

export const createLocationSchema = z.object({
  name:     z.string().min(1, 'กรุณากรอกชื่อ Location').max(200),
  building: z.string().max(100).optional().nullable(),
  floor:    z.string().max(50).optional().nullable(),
});

export const updateLocationSchema = createLocationSchema.partial();

export type CreateLocationInput = z.infer<typeof createLocationSchema>;
export type UpdateLocationInput = z.infer<typeof updateLocationSchema>;

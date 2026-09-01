import { z } from 'zod';

export const importCsvSchema = z.object({
  content:  z.string().min(1, 'ไม่พบข้อมูล CSV'),
  filename: z.string().optional().default('upload.csv'),
});

export type ImportCsvInput = z.infer<typeof importCsvSchema>;

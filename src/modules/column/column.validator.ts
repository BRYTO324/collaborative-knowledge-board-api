import { z } from 'zod';

export const createColumnSchema = z.object({
  title: z.string().min(1, 'Title is required').max(100),
  boardId: z.string().uuid('Invalid board ID'),
  position: z.number().int().min(0).optional(),
});

export const updateColumnSchema = z.object({
  title: z.string().min(1).max(100).optional(),
  position: z.number().int().min(0).optional(),
});

export type CreateColumnInput = z.infer<typeof createColumnSchema>;
export type UpdateColumnInput = z.infer<typeof updateColumnSchema>;

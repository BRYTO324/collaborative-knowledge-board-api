import { z } from 'zod';

export const createCardSchema = z.object({
  title: z.string().min(1, 'Title is required').max(200),
  description: z.string().max(2000).optional(),
  columnId: z.string().uuid('Invalid column ID'),
  position: z.number().int().min(0).optional(),
  dueDate: z.string().datetime().optional().transform(val => val ? new Date(val) : undefined),
});

export const updateCardSchema = z.object({
  title: z.string().min(1).max(200).optional(),
  description: z.string().max(2000).optional(),
  position: z.number().int().min(0).optional(),
  dueDate: z.string().datetime().nullable().optional().transform(val => 
    val === null ? null : val ? new Date(val) : undefined
  ),
  version: z.number().int().optional(),
});

export const assignTagsSchema = z.object({
  tagIds: z.array(z.string().uuid()).min(0),
});

export type CreateCardInput = z.infer<typeof createCardSchema>;
export type UpdateCardInput = z.infer<typeof updateCardSchema>;
export type AssignTagsInput = z.infer<typeof assignTagsSchema>;

export const moveCardSchema = z.object({
  targetColumnId: z.string().uuid('Invalid column ID'),
  targetPosition: z.number().int().min(0),
});

export type MoveCardInput = z.infer<typeof moveCardSchema>;

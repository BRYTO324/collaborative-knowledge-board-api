import { z } from 'zod';

export const createCommentSchema = z.object({
  cardId: z.string().uuid('Invalid card ID'),
  content: z.string().min(1, 'Content is required').max(2000),
  parentId: z.string().uuid('Invalid parent comment ID').optional(),
});

export const updateCommentSchema = z.object({
  content: z.string().min(1, 'Content is required').max(2000),
});

export type CreateCommentInput = z.infer<typeof createCommentSchema>;
export type UpdateCommentInput = z.infer<typeof updateCommentSchema>;

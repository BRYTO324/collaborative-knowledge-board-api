import { z } from 'zod';

export const createCommentSchema = z.object({
  content: z.string().min(1, 'Content is required').max(1000),
  cardId: z.string().uuid('Invalid card ID'),
});

export type CreateCommentInput = z.infer<typeof createCommentSchema>;

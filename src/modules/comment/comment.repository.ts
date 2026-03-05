import prisma from '../../config/database';
import { Comment } from '@prisma/client';

export class CommentRepository {
  async create(cardId: string, userId: string, content: string): Promise<Comment> {
    return prisma.comment.create({
      data: {
        content,
        cardId,
        userId,
      },
      include: {
        user: {
          select: {
            id: true,
            name: true,
            email: true,
          },
        },
      },
    });
  }

  async findByCardId(cardId: string) {
    return prisma.comment.findMany({
      where: { cardId },
      orderBy: { createdAt: 'desc' },
      include: {
        user: {
          select: {
            id: true,
            name: true,
            email: true,
          },
        },
      },
    });
  }
}

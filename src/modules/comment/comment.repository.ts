import prisma from '../../config/database';
import { Comment } from '@prisma/client';

export class CommentRepository {
  async create(
    cardId: string,
    userId: string,
    content: string,
    parentId?: string
  ): Promise<Comment> {
    return prisma.comment.create({
      data: {
        cardId,
        userId,
        content,
        parentId,
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

  async findById(id: string) {
    return prisma.comment.findUnique({
      where: { id },
      include: {
        user: {
          select: {
            id: true,
            name: true,
            email: true,
          },
        },
        replies: {
          include: {
            user: {
              select: {
                id: true,
                name: true,
                email: true,
              },
            },
          },
          orderBy: { createdAt: 'asc' },
        },
      },
    });
  }

  async findByCardId(cardId: string) {
    return prisma.comment.findMany({
      where: {
        cardId,
        parentId: null,
      },
      include: {
        user: {
          select: {
            id: true,
            name: true,
            email: true,
          },
        },
        replies: {
          include: {
            user: {
              select: {
                id: true,
                name: true,
                email: true,
              },
            },
          },
          orderBy: { createdAt: 'asc' },
        },
      },
      orderBy: { createdAt: 'desc' },
    });
  }

  async update(id: string, content: string): Promise<Comment> {
    return prisma.comment.update({
      where: { id },
      data: { content },
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

  async delete(id: string): Promise<void> {
    await prisma.comment.delete({
      where: { id },
    });
  }
}

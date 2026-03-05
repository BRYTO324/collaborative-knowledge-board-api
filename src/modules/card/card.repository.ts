import prisma from '../../config/database';
import { Card } from '@prisma/client';

export class CardRepository {
  async create(
    columnId: string,
    title: string,
    description: string | undefined,
    position: number,
    dueDate?: Date
  ): Promise<Card> {
    return prisma.card.create({
      data: {
        title,
        description,
        position,
        columnId,
        dueDate,
      },
    });
  }

  async findById(id: string) {
    return prisma.card.findUnique({
      where: { id },
      include: {
        tags: {
          include: {
            tag: true,
          },
        },
        comments: {
          include: {
            user: {
              select: {
                id: true,
                name: true,
                email: true,
              },
            },
          },
          orderBy: { createdAt: 'desc' },
        },
      },
    });
  }

  async findByColumnId(columnId: string) {
    return prisma.card.findMany({
      where: { columnId },
      orderBy: { position: 'asc' },
      include: {
        tags: {
          include: {
            tag: true,
          },
        },
      },
    });
  }

  async getMaxPosition(columnId: string): Promise<number> {
    const result = await prisma.card.aggregate({
      where: { columnId },
      _max: { position: true },
    });
    return result._max.position ?? -1;
  }

  async update(
    id: string,
    data: {
      title?: string;
      description?: string;
      position?: number;
      dueDate?: Date | null;
    }
  ): Promise<Card> {
    return prisma.card.update({
      where: { id },
      data,
    });
  }

  async delete(id: string): Promise<void> {
    await prisma.card.delete({
      where: { id },
    });
  }

  async assignTags(cardId: string, tagIds: string[]): Promise<void> {
    await prisma.cardTag.deleteMany({
      where: { cardId },
    });

    if (tagIds.length > 0) {
      await prisma.cardTag.createMany({
        data: tagIds.map((tagId) => ({ cardId, tagId })),
      });
    }
  }
}

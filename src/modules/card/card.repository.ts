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
          where: { parentId: null },
          orderBy: { createdAt: 'desc' },
        },
      },
    });
  }

  async findByColumnId(columnId: string, skip = 0, take = 50) {
    return prisma.card.findMany({
      where: { columnId },
      orderBy: { position: 'asc' },
      skip,
      take,
      include: {
        tags: {
          include: {
            tag: true,
          },
        },
      },
    });
  }

  async countByColumnId(columnId: string): Promise<number> {
    return prisma.card.count({
      where: { columnId },
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
      version?: number;
    }
  ): Promise<Card> {
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    const { version: _version, ...updateData } = data;
    return prisma.card.update({
      where: { id },
      data: {
        ...updateData,
        version: { increment: 1 },
      },
    });
  }

  async reorderWithinColumn(columnId: string, oldPosition: number, newPosition: number, cardId?: string): Promise<void> {
    await prisma.$transaction(async (tx) => {
      // Find the card being moved if cardId not provided
      let targetCardId = cardId;
      if (!targetCardId) {
        const card = await tx.card.findFirst({ where: { columnId, position: oldPosition } });
        if (!card) return;
        targetCardId = card.id;
      }

      if (oldPosition === newPosition) {
        // Same position: shift any other cards at >= newPosition down to eliminate duplicates
        await tx.card.updateMany({
          where: {
            columnId,
            id: { not: targetCardId },
            position: { gte: newPosition },
          },
          data: { position: { increment: 1 } },
        });
      } else if (oldPosition < newPosition) {
        // Moving down: shift cards between old and new position up
        await tx.card.updateMany({
          where: {
            columnId,
            id: { not: targetCardId },
            position: { gt: oldPosition, lte: newPosition },
          },
          data: { position: { decrement: 1 } },
        });
      } else {
        // Moving up: shift cards between new and old position down
        await tx.card.updateMany({
          where: {
            columnId,
            id: { not: targetCardId },
            position: { gte: newPosition, lt: oldPosition },
          },
          data: { position: { increment: 1 } },
        });
      }

      // Update the moved card by id (safe — not affected by the shifts above)
      await tx.card.update({
        where: { id: targetCardId },
        data: { position: newPosition },
      });
    });
  }

  async moveToColumn(
    cardId: string,
    sourceColumnId: string,
    targetColumnId: string,
    targetPosition: number
  ): Promise<void> {
    await prisma.$transaction(async (tx) => {
      const card = await tx.card.findUnique({ where: { id: cardId } });
      if (!card) throw new Error('Card not found');

      // Shift cards in source column up
      await tx.card.updateMany({
        where: {
          columnId: sourceColumnId,
          position: { gt: card.position },
        },
        data: {
          position: { decrement: 1 },
        },
      });

      // Shift cards in target column down
      await tx.card.updateMany({
        where: {
          columnId: targetColumnId,
          position: { gte: targetPosition },
        },
        data: {
          position: { increment: 1 },
        },
      });

      // Move the card
      await tx.card.update({
        where: { id: cardId },
        data: {
          columnId: targetColumnId,
          position: targetPosition,
          version: { increment: 1 },
        },
      });
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

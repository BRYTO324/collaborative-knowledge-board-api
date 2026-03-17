import prisma from '../../config/database';
import { Board } from '@prisma/client';

export class BoardRepository {
  async create(userId: string, title: string, description?: string): Promise<Board> {
    return prisma.board.create({
      data: {
        title,
        description,
        userId,
      },
    });
  }

  async findById(id: string): Promise<Board | null> {
    return prisma.board.findUnique({
      where: { id },
      include: {
        columns: {
          orderBy: { position: 'asc' },
        },
      },
    });
  }

  async findByUserId(userId: string, skip = 0, take = 20): Promise<Board[]> {
    return prisma.board.findMany({
      where: { userId },
      orderBy: { createdAt: 'desc' },
      skip,
      take,
      include: {
        columns: {
          orderBy: { position: 'asc' },
        },
      },
    });
  }

  async countByUserId(userId: string): Promise<number> {
    return prisma.board.count({
      where: { userId },
    });
  }

  async update(id: string, data: { title?: string; description?: string }): Promise<Board> {
    return prisma.board.update({
      where: { id },
      data,
    });
  }

  async delete(id: string): Promise<void> {
    await prisma.board.delete({
      where: { id },
    });
  }
}

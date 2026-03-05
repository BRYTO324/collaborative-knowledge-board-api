import prisma from '../../config/database';
import { Column } from '@prisma/client';

export class ColumnRepository {
  async create(boardId: string, title: string, position: number): Promise<Column> {
    return prisma.column.create({
      data: {
        title,
        position,
        boardId,
      },
    });
  }

  async findById(id: string): Promise<Column | null> {
    return prisma.column.findUnique({
      where: { id },
    });
  }

  async getMaxPosition(boardId: string): Promise<number> {
    const result = await prisma.column.aggregate({
      where: { boardId },
      _max: { position: true },
    });
    return result._max.position ?? -1;
  }

  async update(id: string, data: { title?: string; position?: number }): Promise<Column> {
    return prisma.column.update({
      where: { id },
      data,
    });
  }

  async delete(id: string): Promise<void> {
    await prisma.column.delete({
      where: { id },
    });
  }
}

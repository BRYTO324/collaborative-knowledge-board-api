import prisma from '../../config/database';
import { Tag } from '@prisma/client';

export class TagRepository {
  async create(name: string, color: string): Promise<Tag> {
    return prisma.tag.create({
      data: {
        name,
        color,
      },
    });
  }

  async findByName(name: string): Promise<Tag | null> {
    return prisma.tag.findUnique({
      where: { name },
    });
  }

  async findAll(): Promise<Tag[]> {
    return prisma.tag.findMany({
      orderBy: { name: 'asc' },
    });
  }
}

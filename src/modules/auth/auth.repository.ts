import prisma from '../../config/database';
import { User } from '@prisma/client';

export class AuthRepository {
  async createUser(email: string, hashedPassword: string, name: string): Promise<User> {
    return prisma.user.create({
      data: {
        email,
        password: hashedPassword,
        name,
      },
    });
  }

  async findUserByEmail(email: string): Promise<User | null> {
    return prisma.user.findUnique({
      where: { email },
    });
  }

  async findUserById(id: string): Promise<User | null> {
    return prisma.user.findUnique({
      where: { id },
    });
  }
}

import request from 'supertest';
import app from '../../src/app';
import prisma from '../../src/config/database';
import jwt from 'jsonwebtoken';
import { env } from '../../src/config/env';

describe('Board Integration Tests', () => {
  let authToken: string;

  beforeAll(async () => {
    // Clean up any leftover data from previous runs
    const oldUser = await prisma.user.findUnique({ where: { email: 'test@example.com' } });
    if (oldUser) {
      await prisma.board.deleteMany({ where: { userId: oldUser.id } });
      await prisma.user.delete({ where: { id: oldUser.id } });
    }

    const user = await prisma.user.create({
      data: {
        email: 'test@example.com',
        password: 'hashedpassword',
        name: 'Test User',
      },
    });
    authToken = jwt.sign({ userId: user.id }, env.JWT_SECRET);
  });

  afterAll(async () => {
    const user = await prisma.user.findUnique({ where: { email: 'test@example.com' } });
    if (user) {
      await prisma.board.deleteMany({ where: { userId: user.id } });
      await prisma.user.delete({ where: { id: user.id } });
    }
    await prisma.$disconnect();
  });

  describe('POST /api/boards', () => {
    it('should create a new board', async () => {
      const response = await request(app)
        .post('/api/boards')
        .set('Authorization', `Bearer ${authToken}`)
        .send({
          title: 'Test Board',
          description: 'Test Description',
        });

      expect(response.status).toBe(201);
      expect(response.body.success).toBe(true);
      expect(response.body.data).toHaveProperty('id');
      expect(response.body.data.title).toBe('Test Board');
    });

    it('should return 401 without auth token', async () => {
      const response = await request(app)
        .post('/api/boards')
        .send({
          title: 'Test Board',
        });

      expect(response.status).toBe(401);
    });
  });

  describe('GET /api/boards', () => {
    it('should retrieve user boards with pagination', async () => {
      const response = await request(app)
        .get('/api/boards?page=1&limit=10')
        .set('Authorization', `Bearer ${authToken}`);

      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
      expect(response.body.data).toHaveProperty('boards');
      expect(response.body.data).toHaveProperty('pagination');
    });
  });
});

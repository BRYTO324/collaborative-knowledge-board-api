import request from 'supertest';
import app from '../../src/app';
import prisma from '../../src/config/database';
import jwt from 'jsonwebtoken';
import { env } from '../../src/config/env';

describe('Card Move Integration Tests', () => {
  let authToken: string;
  let userId: string;
  let boardId: string;
  let column1Id: string;
  let column2Id: string;
  let cardId: string;

  beforeAll(async () => {
    // Clean up any leftover data from previous runs
    const oldUser = await prisma.user.findUnique({ where: { email: 'cardmove-test@example.com' } });
    if (oldUser) {
      await prisma.comment.deleteMany({ where: { userId: oldUser.id } });
      await prisma.board.deleteMany({ where: { userId: oldUser.id } });
      await prisma.user.delete({ where: { id: oldUser.id } });
    }

    const user = await prisma.user.create({
      data: {
        email: 'cardmove-test@example.com',
        password: 'hashedpassword',
        name: 'Card Move User',
      },
    });
    userId = user.id;
    authToken = jwt.sign({ userId: user.id }, env.JWT_SECRET);

    const board = await prisma.board.create({
      data: { title: 'Move Test Board', userId },
    });
    boardId = board.id;

    const column1 = await prisma.column.create({
      data: { title: 'Column 1', position: 0, boardId },
    });
    column1Id = column1.id;

    const column2 = await prisma.column.create({
      data: { title: 'Column 2', position: 1, boardId },
    });
    column2Id = column2.id;

    const card = await prisma.card.create({
      data: { title: 'Test Card', position: 0, columnId: column1Id },
    });
    cardId = card.id;
  });

  afterAll(async () => {
    if (userId) {
      await prisma.comment.deleteMany({ where: { userId } });
      await prisma.board.deleteMany({ where: { userId } });
      await prisma.user.delete({ where: { id: userId } });
    }
    await prisma.$disconnect();
  });

  // ─── MOVE ACROSS COLUMNS ───────────────────────────────────────────────────

  describe('POST /api/cards/:id/move - cross-column', () => {
    it('should move card to a different column', async () => {
      const response = await request(app)
        .post(`/api/cards/${cardId}/move`)
        .set('Authorization', `Bearer ${authToken}`)
        .send({ targetColumnId: column2Id, targetPosition: 0 });

      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
      expect(response.body.data.columnId).toBe(column2Id);
      expect(response.body.data.position).toBe(0);
    });

    it('should shift existing cards in target column down', async () => {
      // Ensure card is in column2 at position 0
      await prisma.card.update({
        where: { id: cardId },
        data: { columnId: column2Id, position: 0 },
      });

      // Add another card in column2
      await prisma.card.create({
        data: { title: 'Existing Card', position: 0, columnId: column2Id },
      });

      // Move cardId to position 0 in column2 (should push existingCard to 1)
      await request(app)
        .post(`/api/cards/${cardId}/move`)
        .set('Authorization', `Bearer ${authToken}`)
        .send({ targetColumnId: column2Id, targetPosition: 0 });

      const cards = await prisma.card.findMany({
        where: { columnId: column2Id },
        orderBy: { position: 'asc' },
      });

      const positions = cards.map((c) => c.position);
      const uniquePositions = new Set(positions);

      // No duplicate positions
      expect(uniquePositions.size).toBe(positions.length);
    });
  });

  // ─── MOVE WITHIN COLUMN ────────────────────────────────────────────────────

  describe('POST /api/cards/:id/move - within column', () => {
    let cardA: string;
    // cardB and cardC created for position integrity — verified via DB query
    let _cardB: string;
    let _cardC: string;

    beforeAll(async () => {
      // Clean column1 and set up fresh cards
      await prisma.card.deleteMany({ where: { columnId: column1Id } });

      const a = await prisma.card.create({
        data: { title: 'Card A', position: 0, columnId: column1Id },
      });
      const b = await prisma.card.create({
        data: { title: 'Card B', position: 1, columnId: column1Id },
      });
      const c = await prisma.card.create({
        data: { title: 'Card C', position: 2, columnId: column1Id },
      });

      cardA = a.id;
      _cardB = b.id;
      _cardC = c.id;
    });

    it('should reorder card within same column', async () => {
      // Move Card A from position 0 to position 2
      const response = await request(app)
        .post(`/api/cards/${cardA}/move`)
        .set('Authorization', `Bearer ${authToken}`)
        .send({ targetColumnId: column1Id, targetPosition: 2 });

      expect(response.status).toBe(200);
      expect(response.body.data.position).toBe(2);
    });

    it('should maintain no duplicate positions after reorder', async () => {
      const cards = await prisma.card.findMany({
        where: { columnId: column1Id },
        orderBy: { position: 'asc' },
      });

      const positions = cards.map((c) => c.position);
      const uniquePositions = new Set(positions);

      expect(uniquePositions.size).toBe(positions.length);
    });
  });

  // ─── AUTHORIZATION ─────────────────────────────────────────────────────────

  describe('POST /api/cards/:id/move - authorization', () => {
    it('should return 401 without auth token', async () => {
      const response = await request(app)
        .post(`/api/cards/${cardId}/move`)
        .send({ targetColumnId: column2Id, targetPosition: 0 });

      expect(response.status).toBe(401);
    });

    it('should return 403 when moving card from another user\'s board', async () => {
      await prisma.user.deleteMany({ where: { email: 'other-move@example.com' } });
      const otherUser = await prisma.user.create({
        data: { email: 'other-move@example.com', password: 'pass', name: 'Other' },
      });
      const otherToken = jwt.sign({ userId: otherUser.id }, env.JWT_SECRET);

      const response = await request(app)
        .post(`/api/cards/${cardId}/move`)
        .set('Authorization', `Bearer ${otherToken}`)
        .send({ targetColumnId: column2Id, targetPosition: 0 });

      expect(response.status).toBe(403);

      await prisma.user.delete({ where: { id: otherUser.id } });
    });
  });
});

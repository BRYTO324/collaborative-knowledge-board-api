import request from 'supertest';
import app from '../../src/app';
import prisma from '../../src/config/database';
import jwt from 'jsonwebtoken';
import { env } from '../../src/config/env';

describe('Comment Integration Tests', () => {
  let authToken: string;
  let userId: string;
  let boardId: string;
  let columnId: string;
  let cardId: string;

  beforeAll(async () => {
    // Clean up any leftover data from previous runs
    // Must delete comments before users due to NOT NULL constraint on userId
    const oldUser = await prisma.user.findUnique({ where: { email: 'comment-test@example.com' } });
    if (oldUser) {
      await prisma.comment.deleteMany({ where: { userId: oldUser.id } });
      await prisma.board.deleteMany({ where: { userId: oldUser.id } });
      await prisma.user.delete({ where: { id: oldUser.id } });
    }

    const user = await prisma.user.create({
      data: {
        email: 'comment-test@example.com',
        password: 'hashedpassword',
        name: 'Comment User',
      },
    });
    userId = user.id;
    authToken = jwt.sign({ userId: user.id }, env.JWT_SECRET);

    const board = await prisma.board.create({
      data: { title: 'Comment Test Board', userId },
    });
    boardId = board.id;

    const column = await prisma.column.create({
      data: { title: 'Column 1', position: 0, boardId },
    });
    columnId = column.id;

    const card = await prisma.card.create({
      data: { title: 'Test Card', position: 0, columnId },
    });
    cardId = card.id;
  });

  afterAll(async () => {
    // Delete comments first (NOT NULL constraint), then boards cascade, then user
    if (userId) {
      await prisma.comment.deleteMany({ where: { userId } });
      await prisma.board.deleteMany({ where: { userId } });
      await prisma.user.delete({ where: { id: userId } });
    }
    await prisma.$disconnect();
  });

  // ─── CREATE ────────────────────────────────────────────────────────────────

  describe('POST /api/comments', () => {
    it('should create a top-level comment on a card', async () => {
      const response = await request(app)
        .post('/api/comments')
        .set('Authorization', `Bearer ${authToken}`)
        .send({ cardId, content: 'This is a test comment' });

      expect(response.status).toBe(201);
      expect(response.body.success).toBe(true);
      expect(response.body.data.content).toBe('This is a test comment');
      expect(response.body.data.parentId).toBeNull();
      expect(response.body.data.cardId).toBe(cardId);
    });

    it('should create a threaded reply to a comment', async () => {
      const parent = await prisma.comment.create({
        data: { cardId, userId, content: 'Parent comment' },
      });

      const response = await request(app)
        .post('/api/comments')
        .set('Authorization', `Bearer ${authToken}`)
        .send({ cardId, content: 'This is a reply', parentId: parent.id });

      expect(response.status).toBe(201);
      expect(response.body.data.parentId).toBe(parent.id);
      expect(response.body.data.content).toBe('This is a reply');
    });

    it('should reject reply to a reply (max 2 levels enforced)', async () => {
      const parent = await prisma.comment.create({
        data: { cardId, userId, content: 'Parent comment' },
      });

      const reply = await prisma.comment.create({
        data: { cardId, userId, content: 'Reply', parentId: parent.id } as any,
      });

      const response = await request(app)
        .post('/api/comments')
        .set('Authorization', `Bearer ${authToken}`)
        .send({ cardId, content: 'Reply to reply', parentId: reply.id });

      expect(response.status).toBe(403);
    });

    it('should return 401 without auth token', async () => {
      const response = await request(app)
        .post('/api/comments')
        .send({ cardId, content: 'Unauthorized comment' });

      expect(response.status).toBe(401);
    });

    it('should return 400 with empty content', async () => {
      const response = await request(app)
        .post('/api/comments')
        .set('Authorization', `Bearer ${authToken}`)
        .send({ cardId, content: '' });

      expect(response.status).toBe(422);
    });
  });

  // ─── READ ──────────────────────────────────────────────────────────────────

  describe('GET /api/comments/card/:cardId', () => {
    it('should return comments with nested replies', async () => {
      const parent = await prisma.comment.create({
        data: { cardId, userId, content: 'Parent with replies' },
      });

      await prisma.comment.create({
        data: { cardId, userId, content: 'Reply 1', parentId: parent.id } as any,
      });

      const response = await request(app)
        .get(`/api/comments/card/${cardId}`)
        .set('Authorization', `Bearer ${authToken}`);

      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
      expect(Array.isArray(response.body.data)).toBe(true);

      const parentInResponse = response.body.data.find((c: any) => c.id === parent.id);
      expect(parentInResponse).toBeDefined();
      expect(Array.isArray(parentInResponse.replies)).toBe(true);
      expect(parentInResponse.replies.length).toBeGreaterThan(0);
    });

    it('should only return top-level comments (no parentId)', async () => {
      const response = await request(app)
        .get(`/api/comments/card/${cardId}`)
        .set('Authorization', `Bearer ${authToken}`);

      expect(response.status).toBe(200);
      response.body.data.forEach((comment: any) => {
        expect(comment.parentId).toBeNull();
      });
    });
  });

  // ─── UPDATE ────────────────────────────────────────────────────────────────

  describe('PATCH /api/comments/:id', () => {
    it('should update own comment content', async () => {
      const comment = await prisma.comment.create({
        data: { cardId, userId, content: 'Original content' },
      });

      const response = await request(app)
        .patch(`/api/comments/${comment.id}`)
        .set('Authorization', `Bearer ${authToken}`)
        .send({ content: 'Updated content' });

      expect(response.status).toBe(200);
      expect(response.body.data.content).toBe('Updated content');
    });

    it('should return 403 when editing another user\'s comment', async () => {
      await prisma.user.deleteMany({ where: { email: 'other-comment@example.com' } });
      const otherUser = await prisma.user.create({
        data: { email: 'other-comment@example.com', password: 'pass', name: 'Other' },
      });
      const otherToken = jwt.sign({ userId: otherUser.id }, env.JWT_SECRET);

      const comment = await prisma.comment.create({
        data: { cardId, userId, content: 'Owner comment' },
      });

      const response = await request(app)
        .patch(`/api/comments/${comment.id}`)
        .set('Authorization', `Bearer ${otherToken}`)
        .send({ content: 'Hacked content' });

      expect(response.status).toBe(403);

      await prisma.user.delete({ where: { id: otherUser.id } });
    });

    it('should return 404 for non-existent comment', async () => {
      const response = await request(app)
        .patch('/api/comments/non-existent-id')
        .set('Authorization', `Bearer ${authToken}`)
        .send({ content: 'Updated' });

      expect(response.status).toBe(404);
    });
  });

  // ─── DELETE ────────────────────────────────────────────────────────────────

  describe('DELETE /api/comments/:id', () => {
    it('should delete own comment', async () => {
      const comment = await prisma.comment.create({
        data: { cardId, userId, content: 'To be deleted' },
      });

      const response = await request(app)
        .delete(`/api/comments/${comment.id}`)
        .set('Authorization', `Bearer ${authToken}`);

      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);

      const deleted = await prisma.comment.findUnique({ where: { id: comment.id } });
      expect(deleted).toBeNull();
    });

    it('should return 403 when deleting another user\'s comment', async () => {
      await prisma.user.deleteMany({ where: { email: 'other-delete@example.com' } });
      const otherUser = await prisma.user.create({
        data: { email: 'other-delete@example.com', password: 'pass', name: 'Other' },
      });
      const otherToken = jwt.sign({ userId: otherUser.id }, env.JWT_SECRET);

      const comment = await prisma.comment.create({
        data: { cardId, userId, content: 'Protected comment' },
      });

      const response = await request(app)
        .delete(`/api/comments/${comment.id}`)
        .set('Authorization', `Bearer ${otherToken}`);

      expect(response.status).toBe(403);

      await prisma.user.delete({ where: { id: otherUser.id } });
    });

    it('should cascade delete replies when parent is deleted', async () => {
      const parent = await prisma.comment.create({
        data: { cardId, userId, content: 'Parent to delete' },
      });

      const reply = await prisma.comment.create({
        data: { cardId, userId, content: 'Reply', parentId: parent.id } as any,
      });

      await request(app)
        .delete(`/api/comments/${parent.id}`)
        .set('Authorization', `Bearer ${authToken}`);

      const deletedReply = await prisma.comment.findUnique({ where: { id: reply.id } });
      expect(deletedReply).toBeNull();
    });
  });
});

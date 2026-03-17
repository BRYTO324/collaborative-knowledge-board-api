import { CommentService } from '../../src/modules/comment/comment.service';
import { CommentRepository } from '../../src/modules/comment/comment.repository';
import { CardRepository } from '../../src/modules/card/card.repository';
import { ColumnRepository } from '../../src/modules/column/column.repository';
import { BoardRepository } from '../../src/modules/board/board.repository';
import { NotFoundError, ForbiddenError } from '../../src/utils/errors';

jest.mock('../../src/modules/comment/comment.repository');
jest.mock('../../src/modules/card/card.repository');
jest.mock('../../src/modules/column/column.repository');
jest.mock('../../src/modules/board/board.repository');
jest.mock('../../src/services/websocket.service', () => ({
  websocketService: { emitToBoardMembers: jest.fn() },
  WS_EVENTS: {
    COMMENT_CREATED: 'comment:created',
    COMMENT_UPDATED: 'comment:updated',
    COMMENT_DELETED: 'comment:deleted',
  },
}));

const mockCard = { id: 'card-1', columnId: 'column-1', title: 'Card', position: 0, version: 1 };
const mockColumn = { id: 'column-1', boardId: 'board-1', title: 'Column', position: 0 };
const mockBoard = { id: 'board-1', userId: 'user-1', title: 'Board' };
const mockComment = {
  id: 'comment-1',
  cardId: 'card-1',
  userId: 'user-1',
  content: 'Test comment',
  parentId: null,
};

describe('CommentService', () => {
  let commentService: CommentService;
  let commentRepository: jest.Mocked<CommentRepository>;
  let cardRepository: jest.Mocked<CardRepository>;
  let columnRepository: jest.Mocked<ColumnRepository>;
  let boardRepository: jest.Mocked<BoardRepository>;

  beforeEach(() => {
    jest.clearAllMocks();
    commentService = new CommentService();
    commentRepository = (commentService as any).commentRepository;
    cardRepository = (commentService as any).cardRepository;
    columnRepository = (commentService as any).columnRepository;
    boardRepository = (commentService as any).boardRepository;
  });

  // ─── CREATE COMMENT ────────────────────────────────────────────────────────

  describe('createComment', () => {
    it('should create a top-level comment', async () => {
      cardRepository.findById.mockResolvedValue(mockCard as any);
      columnRepository.findById.mockResolvedValue(mockColumn as any);
      boardRepository.findById.mockResolvedValue(mockBoard as any);
      commentRepository.create.mockResolvedValue(mockComment as any);

      const result = await commentService.createComment('user-1', {
        cardId: 'card-1',
        content: 'Test comment',
      });

      expect(result).toEqual(mockComment);
      expect(commentRepository.create).toHaveBeenCalledWith('card-1', 'user-1', 'Test comment', undefined);
    });

    it('should create a reply to a parent comment', async () => {
      const parentComment = { ...mockComment, id: 'parent-1', parentId: null };
      const replyComment = { ...mockComment, id: 'reply-1', parentId: 'parent-1' };

      cardRepository.findById.mockResolvedValue(mockCard as any);
      columnRepository.findById.mockResolvedValue(mockColumn as any);
      boardRepository.findById.mockResolvedValue(mockBoard as any);
      commentRepository.findById.mockResolvedValue(parentComment as any);
      commentRepository.create.mockResolvedValue(replyComment as any);

      const result = await commentService.createComment('user-1', {
        cardId: 'card-1',
        content: 'Reply',
        parentId: 'parent-1',
      });

      expect(result.parentId).toBe('parent-1');
    });

    it('should throw ForbiddenError when replying to a reply (max 2 levels)', async () => {
      const replyComment = { ...mockComment, id: 'reply-1', parentId: 'parent-1' };

      cardRepository.findById.mockResolvedValue(mockCard as any);
      columnRepository.findById.mockResolvedValue(mockColumn as any);
      boardRepository.findById.mockResolvedValue(mockBoard as any);
      commentRepository.findById.mockResolvedValue(replyComment as any);

      await expect(
        commentService.createComment('user-1', {
          cardId: 'card-1',
          content: 'Deep reply',
          parentId: 'reply-1',
        })
      ).rejects.toThrow(ForbiddenError);
    });

    it('should throw NotFoundError if card does not exist', async () => {
      cardRepository.findById.mockResolvedValue(null);

      await expect(
        commentService.createComment('user-1', { cardId: 'bad-id', content: 'Comment' })
      ).rejects.toThrow(NotFoundError);
    });

    it('should throw ForbiddenError if user does not own the board', async () => {
      cardRepository.findById.mockResolvedValue(mockCard as any);
      columnRepository.findById.mockResolvedValue(mockColumn as any);
      boardRepository.findById.mockResolvedValue({ ...mockBoard, userId: 'other' } as any);

      await expect(
        commentService.createComment('user-1', { cardId: 'card-1', content: 'Comment' })
      ).rejects.toThrow(ForbiddenError);
    });
  });

  // ─── UPDATE COMMENT ────────────────────────────────────────────────────────

  describe('updateComment', () => {
    it('should update own comment', async () => {
      const updated = { ...mockComment, content: 'Updated' };
      commentRepository.findById.mockResolvedValue(mockComment as any);
      cardRepository.findById.mockResolvedValue(mockCard as any);
      columnRepository.findById.mockResolvedValue(mockColumn as any);
      commentRepository.update.mockResolvedValue(updated as any);

      const result = await commentService.updateComment('comment-1', 'user-1', {
        content: 'Updated',
      });

      expect(result.content).toBe('Updated');
    });

    it('should throw ForbiddenError when editing another user\'s comment', async () => {
      commentRepository.findById.mockResolvedValue({ ...mockComment, userId: 'other-user' } as any);

      await expect(
        commentService.updateComment('comment-1', 'user-1', { content: 'Hacked' })
      ).rejects.toThrow(ForbiddenError);
    });

    it('should throw NotFoundError if comment does not exist', async () => {
      commentRepository.findById.mockResolvedValue(null);

      await expect(
        commentService.updateComment('bad-id', 'user-1', { content: 'Updated' })
      ).rejects.toThrow(NotFoundError);
    });
  });

  // ─── DELETE COMMENT ────────────────────────────────────────────────────────

  describe('deleteComment', () => {
    it('should delete own comment', async () => {
      commentRepository.findById.mockResolvedValue(mockComment as any);
      cardRepository.findById.mockResolvedValue(mockCard as any);
      columnRepository.findById.mockResolvedValue(mockColumn as any);
      commentRepository.delete.mockResolvedValue(undefined as any);

      await expect(
        commentService.deleteComment('comment-1', 'user-1')
      ).resolves.not.toThrow();

      expect(commentRepository.delete).toHaveBeenCalledWith('comment-1');
    });

    it('should throw ForbiddenError when deleting another user\'s comment', async () => {
      commentRepository.findById.mockResolvedValue({ ...mockComment, userId: 'other-user' } as any);

      await expect(
        commentService.deleteComment('comment-1', 'user-1')
      ).rejects.toThrow(ForbiddenError);
    });

    it('should throw NotFoundError if comment does not exist', async () => {
      commentRepository.findById.mockResolvedValue(null);

      await expect(
        commentService.deleteComment('bad-id', 'user-1')
      ).rejects.toThrow(NotFoundError);
    });
  });
});

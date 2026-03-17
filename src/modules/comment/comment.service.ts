import { CommentRepository } from './comment.repository';
import { CardRepository } from '../card/card.repository';
import { BoardRepository } from '../board/board.repository';
import { ColumnRepository } from '../column/column.repository';
import { CreateCommentInput, UpdateCommentInput } from './comment.validator';
import { NotFoundError, ForbiddenError } from '../../utils/errors';
import { websocketService, WS_EVENTS } from '../../services/websocket.service';

export class CommentService {
  private commentRepository: CommentRepository;
  private cardRepository: CardRepository;
  private boardRepository: BoardRepository;
  private columnRepository: ColumnRepository;

  constructor() {
    this.commentRepository = new CommentRepository();
    this.cardRepository = new CardRepository();
    this.boardRepository = new BoardRepository();
    this.columnRepository = new ColumnRepository();
  }

  async createComment(userId: string, input: CreateCommentInput) {
    const card = await this.cardRepository.findById(input.cardId);

    if (!card) {
      throw new NotFoundError('Card not found');
    }

    const column = await this.columnRepository.findById(card.columnId);
    if (!column) {
      throw new NotFoundError('Column not found');
    }

    const board = await this.boardRepository.findById(column.boardId);
    if (!board || board.userId !== userId) {
      throw new ForbiddenError('Access denied');
    }

    // If parentId is provided, verify it exists and belongs to the same card
    if (input.parentId) {
      const parentComment = await this.commentRepository.findById(input.parentId);
      if (!parentComment) {
        throw new NotFoundError('Parent comment not found');
      }
      if (parentComment.cardId !== input.cardId) {
        throw new ForbiddenError('Parent comment does not belong to this card');
      }
      // Limit nesting to 2 levels (parent and reply only)
      if (parentComment.parentId) {
        throw new ForbiddenError('Cannot reply to a reply. Maximum nesting level is 2.');
      }
    }

    const comment = await this.commentRepository.create(
      input.cardId,
      userId,
      input.content,
      input.parentId
    );

    // Emit WebSocket event
    websocketService.emitToBoardMembers(column.boardId, WS_EVENTS.COMMENT_CREATED, {
      comment,
      boardId: column.boardId,
      cardId: input.cardId,
    });

    return comment;
  }

  async getCommentsByCard(cardId: string, userId: string) {
    const card = await this.cardRepository.findById(cardId);

    if (!card) {
      throw new NotFoundError('Card not found');
    }

    const column = await this.columnRepository.findById(card.columnId);
    if (!column) {
      throw new NotFoundError('Column not found');
    }

    const board = await this.boardRepository.findById(column.boardId);
    if (!board || board.userId !== userId) {
      throw new ForbiddenError('Access denied');
    }

    return this.commentRepository.findByCardId(cardId);
  }

  async updateComment(commentId: string, userId: string, input: UpdateCommentInput) {
    const comment = await this.commentRepository.findById(commentId);

    if (!comment) {
      throw new NotFoundError('Comment not found');
    }

    if (comment.userId !== userId) {
      throw new ForbiddenError('You can only edit your own comments');
    }

    const card = await this.cardRepository.findById(comment.cardId);
    if (!card) {
      throw new NotFoundError('Card not found');
    }

    const column = await this.columnRepository.findById(card.columnId);
    if (!column) {
      throw new NotFoundError('Column not found');
    }

    const updatedComment = await this.commentRepository.update(commentId, input.content);

    // Emit WebSocket event
    websocketService.emitToBoardMembers(column.boardId, WS_EVENTS.COMMENT_UPDATED, {
      comment: updatedComment,
      boardId: column.boardId,
      cardId: comment.cardId,
    });

    return updatedComment;
  }

  async deleteComment(commentId: string, userId: string) {
    const comment = await this.commentRepository.findById(commentId);

    if (!comment) {
      throw new NotFoundError('Comment not found');
    }

    if (comment.userId !== userId) {
      throw new ForbiddenError('You can only delete your own comments');
    }

    const card = await this.cardRepository.findById(comment.cardId);
    if (!card) {
      throw new NotFoundError('Card not found');
    }

    const column = await this.columnRepository.findById(card.columnId);
    if (!column) {
      throw new NotFoundError('Column not found');
    }

    await this.commentRepository.delete(commentId);

    // Emit WebSocket event
    websocketService.emitToBoardMembers(column.boardId, WS_EVENTS.COMMENT_DELETED, {
      commentId,
      boardId: column.boardId,
      cardId: comment.cardId,
    });
  }
}

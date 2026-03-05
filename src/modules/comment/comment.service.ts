import { CommentRepository } from './comment.repository';
import { CardRepository } from '../card/card.repository';
import { ColumnRepository } from '../column/column.repository';
import { BoardRepository } from '../board/board.repository';
import { CreateCommentInput } from './comment.validator';
import { NotFoundError, ForbiddenError } from '../../utils/errors';

export class CommentService {
  private commentRepository: CommentRepository;
  private cardRepository: CardRepository;
  private columnRepository: ColumnRepository;
  private boardRepository: BoardRepository;

  constructor() {
    this.commentRepository = new CommentRepository();
    this.cardRepository = new CardRepository();
    this.columnRepository = new ColumnRepository();
    this.boardRepository = new BoardRepository();
  }

  async createComment(userId: string, input: CreateCommentInput) {
    const card = await this.cardRepository.findById(input.cardId);

    if (!card) {
      throw new NotFoundError('Card not found');
    }

    await this.verifyCardAccess(card.columnId, userId);

    return this.commentRepository.create(input.cardId, userId, input.content);
  }

  async getCommentsByCard(cardId: string, userId: string) {
    const card = await this.cardRepository.findById(cardId);

    if (!card) {
      throw new NotFoundError('Card not found');
    }

    await this.verifyCardAccess(card.columnId, userId);

    return this.commentRepository.findByCardId(cardId);
  }

  private async verifyCardAccess(columnId: string, userId: string): Promise<void> {
    const column = await this.columnRepository.findById(columnId);

    if (!column) {
      throw new NotFoundError('Column not found');
    }

    const board = await this.boardRepository.findById(column.boardId);

    if (!board || board.userId !== userId) {
      throw new ForbiddenError('Access denied');
    }
  }
}

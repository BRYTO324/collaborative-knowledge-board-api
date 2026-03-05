import { CardRepository } from './card.repository';
import { ColumnRepository } from '../column/column.repository';
import { BoardRepository } from '../board/board.repository';
import { CreateCardInput, UpdateCardInput, AssignTagsInput } from './card.validator';
import { NotFoundError, ForbiddenError } from '../../utils/errors';

export class CardService {
  private cardRepository: CardRepository;
  private columnRepository: ColumnRepository;
  private boardRepository: BoardRepository;

  constructor() {
    this.cardRepository = new CardRepository();
    this.columnRepository = new ColumnRepository();
    this.boardRepository = new BoardRepository();
  }

  async createCard(userId: string, input: CreateCardInput) {
    const column = await this.columnRepository.findById(input.columnId);

    if (!column) {
      throw new NotFoundError('Column not found');
    }

    const board = await this.boardRepository.findById(column.boardId);

    if (!board || board.userId !== userId) {
      throw new ForbiddenError('Access denied');
    }

    const maxPosition = await this.cardRepository.getMaxPosition(input.columnId);
    const position = input.position ?? maxPosition + 1;

    return this.cardRepository.create(
      input.columnId,
      input.title,
      input.description,
      position,
      input.dueDate
    );
  }

  async getCardsByColumn(columnId: string, userId: string) {
    const column = await this.columnRepository.findById(columnId);

    if (!column) {
      throw new NotFoundError('Column not found');
    }

    const board = await this.boardRepository.findById(column.boardId);

    if (!board || board.userId !== userId) {
      throw new ForbiddenError('Access denied');
    }

    return this.cardRepository.findByColumnId(columnId);
  }

  async updateCard(cardId: string, userId: string, input: UpdateCardInput) {
    const card = await this.cardRepository.findById(cardId);

    if (!card) {
      throw new NotFoundError('Card not found');
    }

    await this.verifyCardAccess(card.columnId, userId);

    return this.cardRepository.update(cardId, input);
  }

  async deleteCard(cardId: string, userId: string) {
    const card = await this.cardRepository.findById(cardId);

    if (!card) {
      throw new NotFoundError('Card not found');
    }

    await this.verifyCardAccess(card.columnId, userId);

    await this.cardRepository.delete(cardId);
  }

  async assignTags(cardId: string, userId: string, input: AssignTagsInput) {
    const card = await this.cardRepository.findById(cardId);

    if (!card) {
      throw new NotFoundError('Card not found');
    }

    await this.verifyCardAccess(card.columnId, userId);

    await this.cardRepository.assignTags(cardId, input.tagIds);

    return this.cardRepository.findById(cardId);
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

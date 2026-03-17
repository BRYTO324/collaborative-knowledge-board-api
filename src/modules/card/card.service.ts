import { CardRepository } from './card.repository';
import { ColumnRepository } from '../column/column.repository';
import { BoardRepository } from '../board/board.repository';
import { CreateCardInput, UpdateCardInput, AssignTagsInput, MoveCardInput } from './card.validator';
import { NotFoundError, ForbiddenError, ConflictError } from '../../utils/errors';
import { websocketService, WS_EVENTS } from '../../services/websocket.service';

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

    const card = await this.cardRepository.create(
      input.columnId,
      input.title,
      input.description,
      position,
      input.dueDate
    );

    // Emit WebSocket event
    websocketService.emitToBoardMembers(column.boardId, WS_EVENTS.CARD_CREATED, {
      card,
      boardId: column.boardId,
      columnId: input.columnId,
    });

    return card;
  }

  async getCardsByColumn(columnId: string, userId: string, page = 1, limit = 50) {
    const column = await this.columnRepository.findById(columnId);

    if (!column) {
      throw new NotFoundError('Column not found');
    }

    const board = await this.boardRepository.findById(column.boardId);

    if (!board || board.userId !== userId) {
      throw new ForbiddenError('Access denied');
    }

    const skip = (page - 1) * limit;
    const [cards, total] = await Promise.all([
      this.cardRepository.findByColumnId(columnId, skip, limit),
      this.cardRepository.countByColumnId(columnId),
    ]);

    return {
      cards,
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit),
      },
    };
  }

  async updateCard(cardId: string, userId: string, input: UpdateCardInput) {
    const card = await this.cardRepository.findById(cardId);

    if (!card) {
      throw new NotFoundError('Card not found');
    }

    // Optimistic locking: check version
    if (input.version !== undefined && card.version !== input.version) {
      throw new ConflictError('Card has been modified by another user. Please refresh and try again.');
    }

    const column = await this.verifyCardAccess(card.columnId, userId);

    const updatedCard = await this.cardRepository.update(cardId, input);

    // Emit WebSocket event
    websocketService.emitToBoardMembers(column.boardId, WS_EVENTS.CARD_UPDATED, {
      card: updatedCard,
      boardId: column.boardId,
      columnId: card.columnId,
    });

    return updatedCard;
  }

  async moveCard(cardId: string, userId: string, input: MoveCardInput) {
    const card = await this.cardRepository.findById(cardId);

    if (!card) {
      throw new NotFoundError('Card not found');
    }

    const sourceColumn = await this.verifyCardAccess(card.columnId, userId);
    const targetColumn = await this.columnRepository.findById(input.targetColumnId);

    if (!targetColumn || targetColumn.boardId !== sourceColumn.boardId) {
      throw new ForbiddenError('Invalid target column');
    }

    // Reordering strategy: shift positions to make room
    if (card.columnId === input.targetColumnId) {
      // Moving within same column
      await this.cardRepository.reorderWithinColumn(
        card.columnId,
        card.position,
        input.targetPosition,
        cardId
      );
    } else {
      // Moving to different column
      await this.cardRepository.moveToColumn(
        cardId,
        card.columnId,
        input.targetColumnId,
        input.targetPosition
      );
    }

    const movedCard = await this.cardRepository.findById(cardId);

    // Emit WebSocket event
    websocketService.emitToBoardMembers(sourceColumn.boardId, WS_EVENTS.CARD_MOVED, {
      card: movedCard,
      boardId: sourceColumn.boardId,
      sourceColumnId: card.columnId,
      targetColumnId: input.targetColumnId,
      targetPosition: input.targetPosition,
    });

    return movedCard;
  }

  async deleteCard(cardId: string, userId: string) {
    const card = await this.cardRepository.findById(cardId);

    if (!card) {
      throw new NotFoundError('Card not found');
    }

    const column = await this.verifyCardAccess(card.columnId, userId);

    await this.cardRepository.delete(cardId);

    // Emit WebSocket event
    websocketService.emitToBoardMembers(column.boardId, WS_EVENTS.CARD_DELETED, {
      cardId,
      boardId: column.boardId,
      columnId: card.columnId,
    });
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

  private async verifyCardAccess(columnId: string, userId: string) {
    const column = await this.columnRepository.findById(columnId);

    if (!column) {
      throw new NotFoundError('Column not found');
    }

    const board = await this.boardRepository.findById(column.boardId);

    if (!board || board.userId !== userId) {
      throw new ForbiddenError('Access denied');
    }

    return column;
  }
}

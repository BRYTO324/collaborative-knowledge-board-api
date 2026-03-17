import { CardService } from '../../src/modules/card/card.service';
import { CardRepository } from '../../src/modules/card/card.repository';
import { ColumnRepository } from '../../src/modules/column/column.repository';
import { BoardRepository } from '../../src/modules/board/board.repository';
import { NotFoundError, ForbiddenError, ConflictError } from '../../src/utils/errors';

jest.mock('../../src/modules/card/card.repository');
jest.mock('../../src/modules/column/column.repository');
jest.mock('../../src/modules/board/board.repository');
jest.mock('../../src/services/websocket.service', () => ({
  websocketService: { emitToBoardMembers: jest.fn() },
  WS_EVENTS: {
    CARD_CREATED: 'card:created',
    CARD_UPDATED: 'card:updated',
    CARD_MOVED: 'card:moved',
    CARD_DELETED: 'card:deleted',
  },
}));

const mockColumn = { id: 'column-1', boardId: 'board-1', title: 'Column', position: 0 };
const mockBoard = { id: 'board-1', userId: 'user-1', title: 'Board' };
const mockCard = { id: 'card-1', columnId: 'column-1', title: 'Card', position: 0, version: 1 };

describe('CardService', () => {
  let cardService: CardService;
  let cardRepository: jest.Mocked<CardRepository>;
  let columnRepository: jest.Mocked<ColumnRepository>;
  let boardRepository: jest.Mocked<BoardRepository>;

  beforeEach(() => {
    jest.clearAllMocks();
    cardService = new CardService();
    cardRepository = (cardService as any).cardRepository;
    columnRepository = (cardService as any).columnRepository;
    boardRepository = (cardService as any).boardRepository;
  });

  // ─── CREATE CARD ───────────────────────────────────────────────────────────

  describe('createCard', () => {
    it('should create a card and return it', async () => {
      columnRepository.findById.mockResolvedValue(mockColumn as any);
      boardRepository.findById.mockResolvedValue(mockBoard as any);
      cardRepository.getMaxPosition.mockResolvedValue(-1);
      cardRepository.create.mockResolvedValue(mockCard as any);

      const result = await cardService.createCard('user-1', {
        columnId: 'column-1',
        title: 'Card',
      });

      expect(result).toEqual(mockCard);
      expect(cardRepository.create).toHaveBeenCalledWith('column-1', 'Card', undefined, 0, undefined);
    });

    it('should auto-assign position as maxPosition + 1', async () => {
      columnRepository.findById.mockResolvedValue(mockColumn as any);
      boardRepository.findById.mockResolvedValue(mockBoard as any);
      cardRepository.getMaxPosition.mockResolvedValue(4);
      cardRepository.create.mockResolvedValue({ ...mockCard, position: 5 } as any);

      await cardService.createCard('user-1', { columnId: 'column-1', title: 'Card' });

      expect(cardRepository.create).toHaveBeenCalledWith('column-1', 'Card', undefined, 5, undefined);
    });

    it('should throw NotFoundError if column does not exist', async () => {
      columnRepository.findById.mockResolvedValue(null);

      await expect(
        cardService.createCard('user-1', { columnId: 'bad-id', title: 'Card' })
      ).rejects.toThrow(NotFoundError);
    });

    it('should throw ForbiddenError if user does not own the board', async () => {
      columnRepository.findById.mockResolvedValue(mockColumn as any);
      boardRepository.findById.mockResolvedValue({ ...mockBoard, userId: 'other-user' } as any);

      await expect(
        cardService.createCard('user-1', { columnId: 'column-1', title: 'Card' })
      ).rejects.toThrow(ForbiddenError);
    });
  });

  // ─── UPDATE CARD ───────────────────────────────────────────────────────────

  describe('updateCard', () => {
    it('should update a card successfully', async () => {
      const updated = { ...mockCard, title: 'Updated', version: 2 };
      cardRepository.findById.mockResolvedValue(mockCard as any);
      columnRepository.findById.mockResolvedValue(mockColumn as any);
      boardRepository.findById.mockResolvedValue(mockBoard as any);
      cardRepository.update.mockResolvedValue(updated as any);

      const result = await cardService.updateCard('card-1', 'user-1', { title: 'Updated' });

      expect(result).toEqual(updated);
    });

    it('should throw ConflictError when version does not match', async () => {
      cardRepository.findById.mockResolvedValue({ ...mockCard, version: 3 } as any);

      await expect(
        cardService.updateCard('card-1', 'user-1', { title: 'New', version: 1 })
      ).rejects.toThrow(ConflictError);
    });

    it('should succeed when version matches exactly', async () => {
      const updated = { ...mockCard, title: 'New', version: 2 };
      cardRepository.findById.mockResolvedValue(mockCard as any); // version: 1
      columnRepository.findById.mockResolvedValue(mockColumn as any);
      boardRepository.findById.mockResolvedValue(mockBoard as any);
      cardRepository.update.mockResolvedValue(updated as any);

      const result = await cardService.updateCard('card-1', 'user-1', { title: 'New', version: 1 });

      expect(result).toEqual(updated);
    });

    it('should succeed without version field (no conflict check)', async () => {
      const updated = { ...mockCard, title: 'New', version: 2 };
      cardRepository.findById.mockResolvedValue(mockCard as any);
      columnRepository.findById.mockResolvedValue(mockColumn as any);
      boardRepository.findById.mockResolvedValue(mockBoard as any);
      cardRepository.update.mockResolvedValue(updated as any);

      const result = await cardService.updateCard('card-1', 'user-1', { title: 'New' });

      expect(result).toEqual(updated);
    });

    it('should throw NotFoundError if card does not exist', async () => {
      cardRepository.findById.mockResolvedValue(null);

      await expect(
        cardService.updateCard('bad-id', 'user-1', { title: 'New' })
      ).rejects.toThrow(NotFoundError);
    });

    it('should throw ForbiddenError if user does not own the board', async () => {
      cardRepository.findById.mockResolvedValue(mockCard as any);
      columnRepository.findById.mockResolvedValue(mockColumn as any);
      boardRepository.findById.mockResolvedValue({ ...mockBoard, userId: 'other' } as any);

      await expect(
        cardService.updateCard('card-1', 'user-1', { title: 'New' })
      ).rejects.toThrow(ForbiddenError);
    });
  });

  // ─── DELETE CARD ───────────────────────────────────────────────────────────

  describe('deleteCard', () => {
    it('should delete a card successfully', async () => {
      cardRepository.findById.mockResolvedValue(mockCard as any);
      columnRepository.findById.mockResolvedValue(mockColumn as any);
      boardRepository.findById.mockResolvedValue(mockBoard as any);
      cardRepository.delete.mockResolvedValue(undefined as any);

      await expect(
        cardService.deleteCard('card-1', 'user-1')
      ).resolves.not.toThrow();

      expect(cardRepository.delete).toHaveBeenCalledWith('card-1');
    });

    it('should throw NotFoundError if card does not exist', async () => {
      cardRepository.findById.mockResolvedValue(null);

      await expect(
        cardService.deleteCard('bad-id', 'user-1')
      ).rejects.toThrow(NotFoundError);
    });

    it('should throw ForbiddenError if user does not own the board', async () => {
      cardRepository.findById.mockResolvedValue(mockCard as any);
      columnRepository.findById.mockResolvedValue(mockColumn as any);
      boardRepository.findById.mockResolvedValue({ ...mockBoard, userId: 'other' } as any);

      await expect(
        cardService.deleteCard('card-1', 'user-1')
      ).rejects.toThrow(ForbiddenError);
    });
  });
});

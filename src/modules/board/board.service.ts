import { BoardRepository } from './board.repository';
import { CreateBoardInput, UpdateBoardInput } from './board.validator';
import { NotFoundError, ForbiddenError } from '../../utils/errors';

export class BoardService {
  private boardRepository: BoardRepository;

  constructor() {
    this.boardRepository = new BoardRepository();
  }

  async createBoard(userId: string, input: CreateBoardInput) {
    return this.boardRepository.create(userId, input.title, input.description);
  }

  async getUserBoards(userId: string) {
    return this.boardRepository.findByUserId(userId);
  }

  async getBoardById(boardId: string, userId: string) {
    const board = await this.boardRepository.findById(boardId);

    if (!board) {
      throw new NotFoundError('Board not found');
    }

    if (board.userId !== userId) {
      throw new ForbiddenError('Access denied');
    }

    return board;
  }

  async updateBoard(boardId: string, userId: string, input: UpdateBoardInput) {
    const board = await this.boardRepository.findById(boardId);

    if (!board) {
      throw new NotFoundError('Board not found');
    }

    if (board.userId !== userId) {
      throw new ForbiddenError('Access denied');
    }

    return this.boardRepository.update(boardId, input);
  }

  async deleteBoard(boardId: string, userId: string) {
    const board = await this.boardRepository.findById(boardId);

    if (!board) {
      throw new NotFoundError('Board not found');
    }

    if (board.userId !== userId) {
      throw new ForbiddenError('Access denied');
    }

    await this.boardRepository.delete(boardId);
  }
}

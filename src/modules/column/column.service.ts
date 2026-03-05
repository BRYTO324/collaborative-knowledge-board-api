import { ColumnRepository } from './column.repository';
import { BoardRepository } from '../board/board.repository';
import { CreateColumnInput, UpdateColumnInput } from './column.validator';
import { NotFoundError, ForbiddenError } from '../../utils/errors';

export class ColumnService {
  private columnRepository: ColumnRepository;
  private boardRepository: BoardRepository;

  constructor() {
    this.columnRepository = new ColumnRepository();
    this.boardRepository = new BoardRepository();
  }

  async createColumn(userId: string, input: CreateColumnInput) {
    const board = await this.boardRepository.findById(input.boardId);

    if (!board) {
      throw new NotFoundError('Board not found');
    }

    if (board.userId !== userId) {
      throw new ForbiddenError('Access denied');
    }

    const maxPosition = await this.columnRepository.getMaxPosition(input.boardId);
    const position = input.position ?? maxPosition + 1;

    return this.columnRepository.create(input.boardId, input.title, position);
  }

  async updateColumn(columnId: string, userId: string, input: UpdateColumnInput) {
    const column = await this.columnRepository.findById(columnId);

    if (!column) {
      throw new NotFoundError('Column not found');
    }

    const board = await this.boardRepository.findById(column.boardId);

    if (!board || board.userId !== userId) {
      throw new ForbiddenError('Access denied');
    }

    return this.columnRepository.update(columnId, input);
  }

  async deleteColumn(columnId: string, userId: string) {
    const column = await this.columnRepository.findById(columnId);

    if (!column) {
      throw new NotFoundError('Column not found');
    }

    const board = await this.boardRepository.findById(column.boardId);

    if (!board || board.userId !== userId) {
      throw new ForbiddenError('Access denied');
    }

    await this.columnRepository.delete(columnId);
  }
}

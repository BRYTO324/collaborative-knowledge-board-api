import { Response, NextFunction } from 'express';
import { BoardService } from './board.service';
import { createBoardSchema, updateBoardSchema } from './board.validator';
import { sendSuccess } from '../../utils/response';
import { AuthRequest } from '../../middleware/auth.middleware';

export class BoardController {
  private boardService: BoardService;

  constructor() {
    this.boardService = new BoardService();
  }

  create = async (req: AuthRequest, res: Response, next: NextFunction): Promise<void> => {
    try {
      const input = createBoardSchema.parse(req.body);
      const board = await this.boardService.createBoard(req.userId!, input);
      sendSuccess(res, board, 'Board created successfully', 201);
    } catch (error) {
      next(error);
    }
  };

  getAll = async (req: AuthRequest, res: Response, next: NextFunction): Promise<void> => {
    try {
      const boards = await this.boardService.getUserBoards(req.userId!);
      sendSuccess(res, boards, 'Boards retrieved successfully');
    } catch (error) {
      next(error);
    }
  };

  getById = async (req: AuthRequest, res: Response, next: NextFunction): Promise<void> => {
    try {
      const board = await this.boardService.getBoardById(req.params.id, req.userId!);
      sendSuccess(res, board, 'Board retrieved successfully');
    } catch (error) {
      next(error);
    }
  };

  update = async (req: AuthRequest, res: Response, next: NextFunction): Promise<void> => {
    try {
      const input = updateBoardSchema.parse(req.body);
      const board = await this.boardService.updateBoard(req.params.id, req.userId!, input);
      sendSuccess(res, board, 'Board updated successfully');
    } catch (error) {
      next(error);
    }
  };

  delete = async (req: AuthRequest, res: Response, next: NextFunction): Promise<void> => {
    try {
      await this.boardService.deleteBoard(req.params.id, req.userId!);
      sendSuccess(res, null, 'Board deleted successfully');
    } catch (error) {
      next(error);
    }
  };
}

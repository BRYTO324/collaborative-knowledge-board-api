import { Response, NextFunction } from 'express';
import { ColumnService } from './column.service';
import { createColumnSchema, updateColumnSchema } from './column.validator';
import { sendSuccess } from '../../utils/response';
import { AuthRequest } from '../../middleware/auth.middleware';

export class ColumnController {
  private columnService: ColumnService;

  constructor() {
    this.columnService = new ColumnService();
  }

  create = async (req: AuthRequest, res: Response, next: NextFunction): Promise<void> => {
    try {
      const input = createColumnSchema.parse(req.body);
      const column = await this.columnService.createColumn(req.userId!, input);
      sendSuccess(res, column, 'Column created successfully', 201);
    } catch (error) {
      next(error);
    }
  };

  update = async (req: AuthRequest, res: Response, next: NextFunction): Promise<void> => {
    try {
      const input = updateColumnSchema.parse(req.body);
      const column = await this.columnService.updateColumn(req.params.id, req.userId!, input);
      sendSuccess(res, column, 'Column updated successfully');
    } catch (error) {
      next(error);
    }
  };

  delete = async (req: AuthRequest, res: Response, next: NextFunction): Promise<void> => {
    try {
      await this.columnService.deleteColumn(req.params.id, req.userId!);
      sendSuccess(res, null, 'Column deleted successfully');
    } catch (error) {
      next(error);
    }
  };
}

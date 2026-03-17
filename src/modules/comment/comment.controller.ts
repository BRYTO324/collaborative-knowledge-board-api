import { Response, NextFunction } from 'express';
import { CommentService } from './comment.service';
import { createCommentSchema, updateCommentSchema } from './comment.validator';
import { sendSuccess } from '../../utils/response';
import { AuthRequest } from '../../middleware/auth.middleware';

export class CommentController {
  private commentService: CommentService;

  constructor() {
    this.commentService = new CommentService();
  }

  create = async (req: AuthRequest, res: Response, next: NextFunction): Promise<void> => {
    try {
      const input = createCommentSchema.parse(req.body);
      const comment = await this.commentService.createComment(req.userId!, input);
      sendSuccess(res, comment, 'Comment created successfully', 201);
    } catch (error) {
      next(error);
    }
  };

  getByCard = async (req: AuthRequest, res: Response, next: NextFunction): Promise<void> => {
    try {
      const comments = await this.commentService.getCommentsByCard(req.params.cardId, req.userId!);
      sendSuccess(res, comments, 'Comments retrieved successfully');
    } catch (error) {
      next(error);
    }
  };

  update = async (req: AuthRequest, res: Response, next: NextFunction): Promise<void> => {
    try {
      const input = updateCommentSchema.parse(req.body);
      const comment = await this.commentService.updateComment(req.params.id, req.userId!, input);
      sendSuccess(res, comment, 'Comment updated successfully');
    } catch (error) {
      next(error);
    }
  };

  delete = async (req: AuthRequest, res: Response, next: NextFunction): Promise<void> => {
    try {
      await this.commentService.deleteComment(req.params.id, req.userId!);
      sendSuccess(res, null, 'Comment deleted successfully');
    } catch (error) {
      next(error);
    }
  };
}

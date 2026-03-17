import { Response, NextFunction } from 'express';
import { CardService } from './card.service';
import { createCardSchema, updateCardSchema, assignTagsSchema, moveCardSchema } from './card.validator';
import { sendSuccess } from '../../utils/response';
import { AuthRequest } from '../../middleware/auth.middleware';

export class CardController {
  private cardService: CardService;

  constructor() {
    this.cardService = new CardService();
  }

  create = async (req: AuthRequest, res: Response, next: NextFunction): Promise<void> => {
    try {
      const input = createCardSchema.parse(req.body);
      const card = await this.cardService.createCard(req.userId!, input);
      sendSuccess(res, card, 'Card created successfully', 201);
    } catch (error) {
      next(error);
    }
  };

  getByColumn = async (req: AuthRequest, res: Response, next: NextFunction): Promise<void> => {
    try {
      const page = parseInt(req.query.page as string) || 1;
      const limit = parseInt(req.query.limit as string) || 50;
      const result = await this.cardService.getCardsByColumn(req.params.columnId, req.userId!, page, limit);
      sendSuccess(res, result, 'Cards retrieved successfully');
    } catch (error) {
      next(error);
    }
  };

  update = async (req: AuthRequest, res: Response, next: NextFunction): Promise<void> => {
    try {
      const input = updateCardSchema.parse(req.body);
      const card = await this.cardService.updateCard(req.params.id, req.userId!, input);
      sendSuccess(res, card, 'Card updated successfully');
    } catch (error) {
      next(error);
    }
  };

  delete = async (req: AuthRequest, res: Response, next: NextFunction): Promise<void> => {
    try {
      await this.cardService.deleteCard(req.params.id, req.userId!);
      sendSuccess(res, null, 'Card deleted successfully');
    } catch (error) {
      next(error);
    }
  };

  assignTags = async (req: AuthRequest, res: Response, next: NextFunction): Promise<void> => {
    try {
      const input = assignTagsSchema.parse(req.body);
      const card = await this.cardService.assignTags(req.params.id, req.userId!, input);
      sendSuccess(res, card, 'Tags assigned successfully');
    } catch (error) {
      next(error);
    }
  };

  move = async (req: AuthRequest, res: Response, next: NextFunction): Promise<void> => {
    try {
      const input = moveCardSchema.parse(req.body);
      const card = await this.cardService.moveCard(req.params.id, req.userId!, input);
      sendSuccess(res, card, 'Card moved successfully');
    } catch (error) {
      next(error);
    }
  };
}

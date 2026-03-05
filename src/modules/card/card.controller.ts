import { Response, NextFunction } from 'express';
import { CardService } from './card.service';
import { createCardSchema, updateCardSchema, assignTagsSchema } from './card.validator';
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
      const card = await this.cardService.createCard(req.userId!, {
        ...input,
        dueDate: input.dueDate ? new Date(input.dueDate) : undefined,
      });
      sendSuccess(res, card, 'Card created successfully', 201);
    } catch (error) {
      next(error);
    }
  };

  getByColumn = async (req: AuthRequest, res: Response, next: NextFunction): Promise<void> => {
    try {
      const cards = await this.cardService.getCardsByColumn(req.params.columnId, req.userId!);
      sendSuccess(res, cards, 'Cards retrieved successfully');
    } catch (error) {
      next(error);
    }
  };

  update = async (req: AuthRequest, res: Response, next: NextFunction): Promise<void> => {
    try {
      const input = updateCardSchema.parse(req.body);
      const card = await this.cardService.updateCard(req.params.id, req.userId!, {
        ...input,
        dueDate: input.dueDate !== undefined 
          ? input.dueDate === null 
            ? null 
            : new Date(input.dueDate)
          : undefined,
      });
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
}

import { Response, NextFunction } from 'express';
import { TagService } from './tag.service';
import { createTagSchema } from './tag.validator';
import { sendSuccess } from '../../utils/response';
import { AuthRequest } from '../../middleware/auth.middleware';

export class TagController {
  private tagService: TagService;

  constructor() {
    this.tagService = new TagService();
  }

  create = async (req: AuthRequest, res: Response, next: NextFunction): Promise<void> => {
    try {
      const input = createTagSchema.parse(req.body);
      const tag = await this.tagService.createTag(input);
      sendSuccess(res, tag, 'Tag created successfully', 201);
    } catch (error) {
      next(error);
    }
  };

  getAll = async (req: AuthRequest, res: Response, next: NextFunction): Promise<void> => {
    try {
      const tags = await this.tagService.getAllTags();
      sendSuccess(res, tags, 'Tags retrieved successfully');
    } catch (error) {
      next(error);
    }
  };
}

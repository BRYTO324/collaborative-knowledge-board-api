import { Router } from 'express';
import { CommentController } from './comment.controller';
import { authenticate } from '../../middleware/auth.middleware';

const router = Router();
const commentController = new CommentController();

router.use(authenticate);

router.post('/', commentController.create);
router.get('/card/:cardId', commentController.getByCard);
router.patch('/:id', commentController.update);
router.delete('/:id', commentController.delete);

export default router;

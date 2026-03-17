import { Router } from 'express';
import { CardController } from './card.controller';
import { authenticate } from '../../middleware/auth.middleware';

const router = Router();
const cardController = new CardController();

router.use(authenticate);

router.post('/', cardController.create);
router.get('/column/:columnId', cardController.getByColumn);
router.patch('/:id', cardController.update);
router.post('/:id/move', cardController.move);
router.delete('/:id', cardController.delete);
router.post('/:id/tags', cardController.assignTags);

export default router;

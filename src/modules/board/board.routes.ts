import { Router } from 'express';
import { BoardController } from './board.controller';
import { authenticate } from '../../middleware/auth.middleware';

const router = Router();
const boardController = new BoardController();

router.use(authenticate);

router.post('/', boardController.create);
router.get('/', boardController.getAll);
router.get('/:id', boardController.getById);
router.patch('/:id', boardController.update);
router.delete('/:id', boardController.delete);

export default router;

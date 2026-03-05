import { Router } from 'express';
import { ColumnController } from './column.controller';
import { authenticate } from '../../middleware/auth.middleware';

const router = Router();
const columnController = new ColumnController();

router.use(authenticate);

router.post('/', columnController.create);
router.patch('/:id', columnController.update);
router.delete('/:id', columnController.delete);

export default router;

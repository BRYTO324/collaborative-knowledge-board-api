import { Router } from 'express';
import { TagController } from './tag.controller';
import { authenticate } from '../../middleware/auth.middleware';

const router = Router();
const tagController = new TagController();

router.use(authenticate);

router.post('/', tagController.create);
router.get('/', tagController.getAll);

export default router;

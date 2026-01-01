
import { Router } from 'express';
import * as userController from './user.controller';
import { authenticate } from '../../middleware/auth.middleware';

const router = Router();

router.get('/me', authenticate, userController.getMe);

export default router;

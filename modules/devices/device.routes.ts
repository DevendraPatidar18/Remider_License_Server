
import { Router } from 'express';
import * as deviceController from './device.controller';
import { authenticate } from '../../middleware/auth.middleware';

const router = Router();

router.post('/register', authenticate, deviceController.register);

export default router;

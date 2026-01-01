import { Router } from 'express';
import * as authController from './auth.controller';
import { authenticate } from '../../middleware/auth.middleware';

const router = Router();

router.post('/register', authController.register);
router.post('/login', authController.login);
router.post('/extend-expiry', authenticate, authController.extendExpiry);

// Admin Routes
router.post('/admin/register', authController.adminRegister);
router.post('/admin/login', authController.adminLogin);

export default router;

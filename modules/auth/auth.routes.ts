import { Router } from 'express';
import * as authController from './auth.controller';
import { authenticate } from '../../middleware/auth.middleware';

const router = Router();

// User Auth
router.post('/register', authController.register);
router.post('/request-otp', authController.requestOtp);
router.post('/verify-otp', authController.verifyOtp);
router.post('/extend-expiry', authenticate, authController.extendExpiry);

// Admin Auth
router.post('/admin/register', authController.adminRegister);
router.post('/admin/request-otp', authController.adminRequestOtp);
router.post('/admin/verify-otp', authController.adminVerifyOtp);

export default router;

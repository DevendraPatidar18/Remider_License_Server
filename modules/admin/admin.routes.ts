
import { Router } from 'express';
import * as adminController from './admin.controller';
import { authenticate } from '../../middleware/auth.middleware';
// import { adminMiddleware } from '../../middleware/admin.middleware'; // To be implemented

const router = Router();

// Assuming authenticate suffices for now, or check role inside controller
router.get('/requests/pending', authenticate, adminController.getPendingRequests);
router.get('/licenses', authenticate, adminController.getAllLicenses);
router.get('/transfers', authenticate, adminController.getAllTransfers);

export default router;

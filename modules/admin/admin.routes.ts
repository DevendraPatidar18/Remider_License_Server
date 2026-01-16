
import { Router } from 'express';
import * as adminController from './admin.controller';
import { authenticate } from '../../middleware/auth.middleware';
// import { adminMiddleware } from '../../middleware/admin.middleware'; // To be implemented

const router = Router();

// Assuming authenticate suffices for now, or check role inside controller
router.get('/requests/pending', authenticate, adminController.getPendingRequests);
router.get('/licenses', authenticate, adminController.getAllLicenses);
router.get('/transfers', authenticate, adminController.getAllTransfers);
router.get('/users', authenticate, adminController.getAllUsers);
router.get('/users/:userId', authenticate, adminController.getUserById);
router.delete('/licenses/:licenseId', authenticate, adminController.removeLicense);
router.post('/licenses/:licenseId/renew', authenticate, adminController.renewLicense);

// App Management
router.post('/apps', authenticate, adminController.registerNewApp);
router.put('/apps/:appId', authenticate, adminController.updateApp);

export default router;


import { Router } from 'express';
import * as licenseController from './license.controller';
import { authenticate } from '../../middleware/auth.middleware';

const router = Router();

router.post('/request', authenticate, licenseController.requestLicense);
router.get('/', authenticate, licenseController.getMyLicenses);

// Admin routes (ideally separate or protected by admin middleware)
router.post('/approve', authenticate, licenseController.approveLicense);

export default router;

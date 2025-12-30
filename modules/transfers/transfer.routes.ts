
import { Router } from 'express';
import * as transferController from './transfer.controller';
import { authenticate } from '../../middleware/auth.middleware';

const router = Router();

router.post('/request', authenticate, transferController.requestTransfer);
router.post('/approve', authenticate, transferController.approveTransfer);

export default router;

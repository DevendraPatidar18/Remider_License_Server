
import { Response } from 'express';
import { AuthRequest } from '../../middleware/auth.middleware';
import { TransferService } from './transfer.service';

const transferService = new TransferService();

export const requestTransfer = async (req: AuthRequest, res: Response) => {
    try {
        const { newDeviceId, oldDeviceId } = req.body;
        const userId = req.user.userId;

        if (!newDeviceId || !oldDeviceId) {
            return res.status(400).json({ success: false, message: 'Both New and Old Device IDs required' });
        }

        const transfer = await transferService.initiateTransfer(userId, newDeviceId, oldDeviceId);
        res.status(201).json({ success: true, data: transfer });
    } catch (error: any) {
        console.error('Transfer Request Error:', error);
        res.status(500).json({ success: false, message: error.message || 'Internal Server Error' });
    }
};

export const approveTransfer = async (req: AuthRequest, res: Response) => {
    try {
        const { transferId } = req.body;
        if (!transferId) return res.status(400).json({ success: false, message: 'Transfer ID required' });

        const result = await transferService.approveTransfer(transferId);
        res.json({ success: true, data: result });
    } catch (error: any) {
        console.error('Transfer Approve Error:', error);
        res.status(500).json({ success: false, message: error.message || 'Internal Server Error' });
    }
};

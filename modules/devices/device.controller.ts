
import { Response } from 'express';
import { AuthRequest } from '../../middleware/auth.middleware';
import { DeviceService } from './device.service';

const deviceService = new DeviceService();

export const register = async (req: AuthRequest, res: Response) => {
    try {
        const { fingerprint, model, androidVersion } = req.body;
        const userId = req.user.userId;

        if (!fingerprint || !model || !androidVersion) {
            return res.status(400).json({ success: false, message: 'Missing device info' });
        }

        const device = await deviceService.registerDevice(userId, fingerprint, model, androidVersion);
        res.status(201).json({ success: true, data: device });
    } catch (error) {
        console.error('Device Register Error:', error);
        res.status(500).json({ success: false, message: 'Internal Server Error' });
    }
};

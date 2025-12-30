
import { Response } from 'express';
import { AuthRequest } from '../../middleware/auth.middleware';
import { LicenseService } from './license.service';

const licenseService = new LicenseService();

export const requestLicense = async (req: AuthRequest, res: Response) => {
    try {
        const { deviceId } = req.body;
        const userId = req.user.userId;

        if (!deviceId) return res.status(400).json({ success: false, message: 'Device ID required' });

        const request = await licenseService.createLicenseRequest(userId, deviceId);
        res.status(201).json({ success: true, data: request });
    } catch (error) {
        console.error('License Request Error:', error);
        res.status(500).json({ success: false, message: 'Internal Server Error' });
    }
};

export const approveLicense = async (req: AuthRequest, res: Response) => {
    try {
        // Admin check should be here (skipping for MVP/Demo per instructions or simplicity)
        // if (req.user.role !== 'admin') return res.status(403)...

        const { requestId } = req.body;
        if (!requestId) return res.status(400).json({ success: false, message: 'Request ID required' });

        const license = await licenseService.approveRequest(requestId);
        res.status(201).json({ success: true, data: license });
    } catch (error: any) {
        console.error('License Approve Error:', error);
        res.status(500).json({ success: false, message: error.message || 'Internal Server Error' });
    }
};

export const getMyLicenses = async (req: AuthRequest, res: Response) => {
    try {
        const userId = req.user.userId;
        const licenses = await licenseService.getLicenses(userId);
        res.json({ success: true, data: licenses });
    } catch (error) {
        console.error('Get Licenses Error:', error);
        res.status(500).json({ success: false, message: 'Internal Server Error' });
    }
};

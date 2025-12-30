
import { Response } from 'express';
import { AuthRequest } from '../../middleware/auth.middleware';
import { query } from '../../database/db';

export const getPendingRequests = async (req: AuthRequest, res: Response) => {
    try {
        const result = await query('SELECT * FROM license_requests WHERE status = \'pending\'');
        res.json({ success: true, count: result.rows.length, data: result.rows });
    } catch (error) {
        console.error('Admin Pending Requests Error:', error);
        res.status(500).json({ success: false, message: 'Internal Server Error' });
    }
};

export const getAllLicenses = async (req: AuthRequest, res: Response) => {
    try {
        const result = await query('SELECT * FROM licenses');
        res.json({ success: true, count: result.rows.length, data: result.rows });
    } catch (error) {
        console.error('Admin All Licenses Error:', error);
        res.status(500).json({ success: false, message: 'Internal Server Error' });
    }
};

export const getAllTransfers = async (req: AuthRequest, res: Response) => {
    try {
        const result = await query('SELECT * FROM license_transfers');
        res.json({ success: true, count: result.rows.length, data: result.rows });
    } catch (error) {
        console.error('Admin All Transfers Error:', error);
        res.status(500).json({ success: false, message: 'Internal Server Error' });
    }
};

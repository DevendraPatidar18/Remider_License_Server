
import { Response } from 'express';
import { AuthRequest } from '../../middleware/auth.middleware';
import { query } from '../../database/db';
import { LicenseService } from '../licenses/license.service';

export const getPendingRequests = async (req: AuthRequest, res: Response) => {
    try {
        const queryText = `
            SELECT 
                lr.id, lr.status, lr.requested_at, lr.reviewed_at,
                u.id as user_id, u.user_name, u.email, u.phone,
                d.id as device_id, d.device_fingerprint, d.model as device_model, d.android_version
            FROM license_requests lr
            LEFT JOIN users u ON lr.user_id = u.id
            LEFT JOIN devices d ON lr.device_id = d.id
            WHERE lr.status = 'pending'
        `;
        const result = await query(queryText);
        res.json({ success: true, count: result.rows.length, data: result.rows });
    } catch (error) {
        console.error('Admin Pending Requests Error:', error);
        res.status(500).json({ success: false, message: 'Internal Server Error' });
    }
};

export const getAllLicenses = async (req: AuthRequest, res: Response) => {
    try {
        const queryText = `
            SELECT 
                l.id, l.license_key, l.status, l.issued_at, l.expires_at, l.transfer_count,
                u.id as user_id, u.user_name, u.email, u.phone,
                d.id as device_id, d.device_fingerprint, d.model as device_model, d.android_version
            FROM licenses l
            LEFT JOIN users u ON l.user_id = u.id
            LEFT JOIN devices d ON l.device_id = d.id
        `;
        const result = await query(queryText);
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

export const getAllUsers = async (req: AuthRequest, res: Response) => {
    try {
        const result = await query('SELECT id, phone, email, user_name, role, status, created_at FROM users');
        res.json({ success: true, count: result.rows.length, data: result.rows });
    } catch (error) {
        console.error('Admin All Users Error:', error);
        res.status(500).json({ success: false, message: 'Internal Server Error' });
    }
};

export const getUserById = async (req: AuthRequest, res: Response) => {
    try {
        const { userId } = req.params;
        const result = await query('SELECT id, phone, email, user_name, role, status, created_at FROM users WHERE id = $1', [userId]);

        if (result.rows.length === 0) {
            res.status(404).json({ success: false, message: 'User not found' });
            return
        }

        res.json({ success: true, data: result.rows[0] });
    } catch (error) {
        console.error('Admin Get User Error:', error);
        res.status(500).json({ success: false, message: 'Internal Server Error' });
    }
};

export const removeLicense = async (req: AuthRequest, res: Response) => {
    try {
        const { licenseId } = req.params;
        const result = await query('DELETE FROM licenses WHERE id = $1 RETURNING id', [licenseId]);

        if (result.rowCount === 0) {
            res.status(404).json({ success: false, message: 'License not found' });
            return;
        }

        res.json({ success: true, message: 'License removed successfully' });
    } catch (error) {
        console.error('Admin Remove License Error:', error);
        res.status(500).json({ success: false, message: 'Internal Server Error' });
    }
};

export const renewLicense = async (req: AuthRequest, res: Response) => {
    try {
        const { licenseId } = req.params;
        const { months } = req.body;

        if (!months || typeof months !== 'number') {
            res.status(400).json({ success: false, message: 'Invalid months value' });
            return;
        }

        const licenseService = new LicenseService();
        const updatedLicense = await licenseService.renewLicense(licenseId, months);

        res.json({ success: true, message: 'License renewed successfully', data: updatedLicense });
    } catch (error: any) {
        console.error('Admin Renew License Error:', error);
        if (error.message === 'License not found') {
            res.status(404).json({ success: false, message: 'License not found' });
        } else {
            res.status(500).json({ success: false, message: 'Internal Server Error' });
        }
    }
};

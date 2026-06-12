
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
        const page = parseInt(req.query.page as string) || 1;
        const limit = parseInt(req.query.limit as string) || 10;
        const search = req.query.search as string;
        const offset = (page - 1) * limit;

        let queryText = `
            SELECT id, phone, email, user_name, role, status, created_at 
            FROM users 
            WHERE role = 'user'
        `;
        let countQueryText = `SELECT COUNT(*) FROM users WHERE role = 'user'`;

        const queryParams: any[] = [];
        let paramCounter = 1;

        if (search) {
            const searchClause = ` AND (user_name ILIKE $${paramCounter} OR email ILIKE $${paramCounter})`;
            queryText += searchClause;
            countQueryText += searchClause;
            queryParams.push(`%${search}%`);
            paramCounter++;
        }

        // Add pagination
        queryText += ` ORDER BY created_at DESC LIMIT $${paramCounter} OFFSET $${paramCounter + 1}`;
        const dataParams = [...queryParams, limit, offset];

        const [usersResult, countResult] = await Promise.all([
            query(queryText, dataParams),
            query(countQueryText, queryParams)
        ]);

        const total = parseInt(countResult.rows[0].count);
        const totalPages = Math.ceil(total / limit);

        res.json({
            success: true,
            data: usersResult.rows,
            pagination: {
                total,
                page,
                limit,
                totalPages
            }
        });
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

export const registerNewApp = async (req: AuthRequest, res: Response) => {
    try {
        const { appName, appDescription, version, appId } = req.body;

        if (!appName || !version || !appId) {
            res.status(400).json({ success: false, message: 'Missing required fields: appName, version, appId' });
            return;
        }

        const queryText = `
            INSERT INTO applications (app_id, name, description, version)
            VALUES ($1, $2, $3, $4)
            RETURNING *
        `;
        const result = await query(queryText, [appId, appName, appDescription, version]);

        res.json({ success: true, message: 'App registered successfully', data: result.rows[0] });
    } catch (error: any) {
        console.error('Admin Register App Error:', error);
        if (error.code === '23505') { // Unique violation
            res.status(409).json({ success: false, message: 'App ID already exists' });
        } else {
            res.status(500).json({ success: false, message: 'Internal Server Error' });
        }
    }
};

export const updateApp = async (req: AuthRequest, res: Response) => {
    try {
        const { appId } = req.params; // Currently assumes passing internal UUID or app_id? User said "app id". I will use the unique string app_id for lookup or the UUID if passed. 
        // User request: "For update registere app... 4.version.(required)"
        // Let's assume URL parameter is the unique 'app_id' string or the UUID.
        // Given routes: /apps/:appId.
        // I will assume it's the `app_id` string from the user request since they provided "app id" in registration.
        // However, standard REST usually uses the ID. I'll support looking up by `app_id` string column if possible, or just the UUID. 
        // Let's stick to the unique `app_id` column as the identifier in the URL for better UX, or UUID. 
        // Note: The schema I added uses `id` (UUID) and `app_id` (String).
        // I'll try to update by `app_id` string first as it's more likely what the user means (e.g. com.example.app).

        const { appName, appDescription, version } = req.body;

        if (!version) {
            res.status(400).json({ success: false, message: 'Version is required' });
            return;
        }

        let queryText = 'UPDATE applications SET version = $1, updated_at = NOW()';
        let queryParams: any[] = [version];
        let paramCounter = 2;

        if (appName) {
            queryText += `, name = $${paramCounter}`;
            queryParams.push(appName);
            paramCounter++;
        }

        if (appDescription) {
            queryText += `, description = $${paramCounter}`;
            queryParams.push(appDescription);
            paramCounter++;
        }

        queryText += ` WHERE app_id = $${paramCounter} RETURNING *`;
        queryParams.push(appId);

        const result = await query(queryText, queryParams);

        if (result.rowCount === 0) {
            res.status(404).json({ success: false, message: 'App not found' });
            return;
        }

        res.json({ success: true, message: 'App updated successfully', data: result.rows[0] });
    } catch (error) {
        console.error('Admin Update App Error:', error);
        res.status(500).json({ success: false, message: 'Internal Server Error' });
    }
};

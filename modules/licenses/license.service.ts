
import fs from 'fs';
import path from 'path';
import crypto from 'crypto';
import { query } from '../../database/db';
import { config } from '../../config';

export class LicenseService {
    // Helper: Sign Data (Offline Validation)

    private signData(data: string): string {
        try {
            const sign = crypto.createSign('RSA-SHA256');
            sign.update(data, 'utf8');
            sign.end();

            return sign.sign(
                {
                    key: config.crypto.privateKey,
                    padding: crypto.constants.RSA_PKCS1_PADDING,
                },
                'base64'
            );
        } catch (err) {
            console.error('RAW SIGN ERROR:', err);
            console.error(
                'KEY HEADER:',
                config.crypto.privateKey?.split('\n')[0]
            );
            throw err; // IMPORTANT: rethrow raw error
        }
    }



    async createLicenseRequest(userId: string, deviceId: string) {
        // Check for pending request
        const check = await query(
            'SELECT * FROM license_requests WHERE user_id = $1 AND device_id = $2 AND status = \'pending\'',
            [userId, deviceId]
        );

        if (check.rows.length > 0) {
            return check.rows[0];
        }

        const text = `
            INSERT INTO license_requests (user_id, device_id)
            VALUES ($1, $2)
            RETURNING *
        `;
        const result = await query(text, [userId, deviceId]);
        return result.rows[0];
    }

    async approveRequest(requestId: string) {
        // 1. Get Request Info
        const reqResult = await query('SELECT * FROM license_requests WHERE id = $1', [requestId]);
        if (reqResult.rows.length === 0) throw new Error('Request not found');
        const request = reqResult.rows[0];

        if (request.status !== 'pending') throw new Error('Request is not pending');

        // 2. Fetch Device Info (Fingerprint)
        const deviceResult = await query('SELECT device_fingerprint FROM devices WHERE id = $1', [request.device_id]);
        if (deviceResult.rows.length === 0) throw new Error('Device not found');
        const deviceFingerprint = deviceResult.rows[0].device_fingerprint;

        // 3. Generate License Key
        const licenseKey = crypto.randomBytes(16).toString('hex').toUpperCase();

        // 4. Create Payload for Offline Validation (Device ID + Fingerprint + Expiry + License Key)
        // Set expiry to 1 year from now for example
        const expiresAt = new Date();
        expiresAt.setFullYear(expiresAt.getFullYear() + 1);

        const payloadObj = {
            deviceId: request.device_id,
            deviceFingerprint, // Bind fingerprint to payload
            licenseKey,
            expiresAt: expiresAt.toISOString(),
            type: 'pro', // example
        };
        const payloadStr = JSON.stringify(payloadObj);

        // 5. Sign Payload
        const signature = this.signData(payloadStr);
        const signedPayload = JSON.stringify({ data: payloadObj, signature });

        // 6. Create License Record
        const licText = `
            INSERT INTO licenses (user_id, device_id, license_key, signed_payload, expires_at)
            VALUES ($1, $2, $3, $4, $5)
            RETURNING *
        `;
        const license = await query(licText, [
            request.user_id,
            request.device_id,
            licenseKey,
            signedPayload,
            expiresAt
        ]);

        // 7. Update Request Status
        await query('UPDATE license_requests SET status = \'approved\', reviewed_at = NOW() WHERE id = $1', [requestId]);

        return license.rows[0];
    }

    async getLicenses(userId: string) {
        const text = 'SELECT * FROM licenses WHERE user_id = $1';
        const result = await query(text, [userId]);
        return result.rows;
    }

    async renewLicense(licenseId: string, months: number) {
        // 1. Fetch License & Device Info
        const licenseQuery = `
            SELECT l.*, d.device_fingerprint 
            FROM licenses l
            LEFT JOIN devices d ON l.device_id = d.id
            WHERE l.id = $1
        `;
        const licenseResult = await query(licenseQuery, [licenseId]);

        if (licenseResult.rows.length === 0) {
            throw new Error('License not found');
        }

        const license = licenseResult.rows[0];

        // 2. Calculate New Expiry
        const currentExpiresAt = new Date(license.expires_at);
        const newExpiresAt = new Date(currentExpiresAt);
        newExpiresAt.setMonth(newExpiresAt.getMonth() + months);

        // 3. Create New Payload
        const payloadObj = {
            deviceId: license.device_id,
            deviceFingerprint: license.device_fingerprint,
            licenseKey: license.license_key,
            expiresAt: newExpiresAt.toISOString(),
            type: 'pro', // Maintain type if available in DB, else default
        };
        const payloadStr = JSON.stringify(payloadObj);

        // 4. Sign Payload
        const signature = this.signData(payloadStr);
        const signedPayload = JSON.stringify({ data: payloadObj, signature });

        // 5. Update License
        const updateQuery = `
            UPDATE licenses 
            SET expires_at = $1, signed_payload = $2 
            WHERE id = $3 
            RETURNING *
        `;
        const result = await query(updateQuery, [newExpiresAt, signedPayload, licenseId]);

        return result.rows[0];
    }
}

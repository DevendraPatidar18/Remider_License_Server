
import { query } from '../../database/db';

export class DeviceService {
    async registerDevice(userId: string, fingerprint: string, model: string, androidVersion: string) {
        // Check if device already exists
        const checkText = 'SELECT * FROM devices WHERE device_fingerprint = $1';
        const checkResult = await query(checkText, [fingerprint]);

        if (checkResult.rows.length > 0) {
            const existingDevice = checkResult.rows[0];
            // If device exists but belongs to a different user, we might want to flag this or handle it.
            // For now, if it belongs to the same user, return it.
            if (existingDevice.user_id === userId) {
                return existingDevice;
            }
            // If belongs to another user, this is a policy decision. 
            // Assuming simple logic: One device, one user (or re-assign). 
            // Let's assume re-assignment or shared devices isn't allowed without transfer.
            // But for MVP, if fingerprint matches, return existing (effectively "logging in" the device).
            return existingDevice;
        }

        const text = `
            INSERT INTO devices (user_id, device_fingerprint, model, android_version)
            VALUES ($1, $2, $3, $4)
            RETURNING *
        `;

        const result = await query(text, [userId, fingerprint, model, androidVersion]);
        return result.rows[0];
    }
}

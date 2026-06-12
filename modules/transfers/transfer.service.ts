
import { query } from '../../database/db';

export class TransferService {
    async initiateTransfer(userId: string, newDeviceId: string, oldDeviceId: string) {
        // 1. Validate Ownership of both devices? 
        // Typically, newDeviceId is the current device making request.
        // OldDeviceId must belong to user.

        const deviceCheck = await query(
            'SELECT * FROM devices WHERE id = $1 AND user_id = $2',
            [oldDeviceId, userId]
        );
        if (deviceCheck.rows.length === 0) {
            throw new Error('Old device not found or does not belong to user');
        }

        // 2. Check for active license on old device
        const licenseCheck = await query(
            'SELECT * FROM licenses WHERE device_id = $1 AND user_id = $2 AND status = \'active\'',
            [oldDeviceId, userId]
        );

        if (licenseCheck.rows.length === 0) {
            throw new Error('No active license found on old device');
        }

        // 3. Create Transfer Request
        const text = `
            INSERT INTO license_transfers (user_id, old_device_id, new_device_id)
            VALUES ($1, $2, $3)
            RETURNING *
        `;
        const result = await query(text, [userId, oldDeviceId, newDeviceId]);
        return result.rows[0];
    }

    async approveTransfer(transferId: string) {
        // This logic is complex: Revoke old license, Create new license (or move it).
        // For MVP: Revoke old license, Update system to allow new license request or auto-issue.
        // Let's go with: Mark transfer approved -> Then user requests license for new device -> System sees transfer?
        // OR: Revoke old, Issue new immediately.

        // 1. Get Transfer
        const transResult = await query('SELECT * FROM license_transfers WHERE id = $1', [transferId]);
        if (transResult.rows.length === 0) throw new Error('Transfer not found');
        const transfer = transResult.rows[0];

        if (transfer.status !== 'pending') throw new Error('Transfer not pending');

        // 2. Revoke Old License
        await query(
            'UPDATE licenses SET status = \'revoked\' WHERE device_id = $1 AND user_id = $2 AND status = \'active\'',
            [transfer.old_device_id, transfer.user_id]
        );

        // 3. Deactivate Old Device
        await query('UPDATE devices SET is_active = false WHERE id = $1', [transfer.old_device_id]);

        // 4. Update Transfer Status
        const result = await query(
            'UPDATE license_transfers SET status = \'approved\', approved_at = NOW() WHERE id = $1 RETURNING *',
            [transferId]
        );

        // Note: The user now needs to "Request License" for the new device.
        // Since the old one is revoked, they are free to get a new one (assuming 1 license limit policy, which we haven't strictly enforced in `createLicenseRequest` yet but logic implies it).

        return result.rows[0];
    }
}

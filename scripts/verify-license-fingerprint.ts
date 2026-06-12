
import { LicenseService } from '../modules/licenses/license.service';
import { AuthService } from '../modules/auth/auth.service';
import pool, { query } from '../database/db';
import crypto from 'crypto';

const verify = async () => {
    try {
        console.log('Starting verification...');
        const licenseService = new LicenseService();
        const authService = new AuthService();

        // 1. Create unique user
        const uniqueSuffix = crypto.randomBytes(4).toString('hex');
        const email = `test-${uniqueSuffix}@example.com`;
        const phone = `+1${Math.floor(Math.random() * 10000000000)}`;

        console.log(`Creating user: ${email}`);
        const user = await authService.createUser(phone, email, 'password123');

        // 2. Create device
        const deviceFingerprint = `fingerprint-${uniqueSuffix}`;
        console.log(`Creating device with fingerprint: ${deviceFingerprint}`);

        const devQuery = `
            INSERT INTO devices (user_id, device_fingerprint, model, android_version)
            VALUES ($1, $2, 'TestModel', '12.0')
            RETURNING *
        `;
        const deviceRes = await query(devQuery, [user.id, deviceFingerprint]);
        const device = deviceRes.rows[0];

        // 3. Create License Request
        console.log('Creating license request...');
        const request = await licenseService.createLicenseRequest(user.id, device.id);

        // 4. Approve License
        console.log('Approving license...');
        const license = await licenseService.approveRequest(request.id);

        // 5. Verify Payload
        console.log('Verifying payload...');
        const signedPayload = JSON.parse(license.signed_payload);
        const data = signedPayload.data;

        console.log('Payload Data:', data);

        if (data.deviceFingerprint === deviceFingerprint) {
            console.log('SUCCESS: Device fingerprint matches!');
        } else {
            console.error('FAILURE: Device fingerprint does NOT match!');
            console.error(`Expected: ${deviceFingerprint}`);
            console.error(`Actual: ${data.deviceFingerprint}`);
            process.exit(1);
        }

    } catch (error) {
        console.error('Verification failed:', error);
        process.exit(1);
    } finally {
        await pool.end();
    }
};

verify();

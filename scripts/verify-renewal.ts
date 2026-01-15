
import { LicenseService } from '../modules/licenses/license.service';
import { query } from '../database/db';

async function verifyRenewal() {
    try {
        console.log('Starting renewal verification...');

        // 1. Get a test license
        const result = await query('SELECT id, expires_at FROM licenses LIMIT 1');
        if (result.rows.length === 0) {
            console.log('No licenses found to test renewal.');
            process.exit(0);
        }

        const license = result.rows[0];
        console.log(`Testing with license ID: ${license.id}`);
        console.log(`Original Expiry: ${license.expires_at}`);

        // 2. Renew License via Service
        const licenseService = new LicenseService();
        const monthsToAdd = 1;
        const updatedLicense = await licenseService.renewLicense(license.id, monthsToAdd);

        console.log('Renewal successful.');
        console.log(`New Expiry: ${updatedLicense.expires_at}`);

        // 3. Verify Payload
        const payload = JSON.parse(updatedLicense.signed_payload);
        console.log('Signed Payload Data:', payload.data);

        const payloadExpiry = new Date(payload.data.expiresAt);
        const dbExpiry = new Date(updatedLicense.expires_at);

        // Check if expiry matches (ignoring ms differences)
        if (payloadExpiry.getTime() === dbExpiry.getTime()) {
            console.log('SUCCESS: Payload expiry matches DB expiry.');
        } else {
            console.error('FAILURE: Payload expiry mismatch!', {
                payload: payloadExpiry,
                db: dbExpiry
            });
        }

        // Revert changes (optional, but good for testing)
        // await query('UPDATE licenses SET expires_at = $1 WHERE id = $2', [license.expires_at, license.id]);

    } catch (error) {
        console.error('Verification Failed:', error);
    } finally {
        process.exit();
    }
}

verifyRenewal();

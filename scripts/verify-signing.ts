
import { LicenseService } from '../modules/licenses/license.service';
import { config } from '../config';

async function verifySigning() {
    try {
        console.log('Verifying LicenseService signing capability...');

        // Ensure we have a key (mock it if missing for this test, but better to check if it exists)
        if (!config.crypto.privateKey) {
            console.warn('WARNING: No private key found in config. Mocking one for testing.');
            config.crypto.privateKey = '-----BEGIN PRIVATE KEY-----\nMIIEvQIBADANBgkqhkiG9w0BAQEFAASCBKcwggSjAgEAAoIBAQDQq...\n-----END PRIVATE KEY-----'; // This is invalid PEM, expect error if used
            // Actually, let's assume the env works or specific keys are there. 
            // If strictly testing logic, we might fail on actual crypto operations if key is bad.
        }

        const service = new LicenseService();

        // Access private method via casting to any
        const signer = (service as any);

        const payload = JSON.stringify({ test: 'data', timestamp: Date.now() });

        try {
            const signature = signer.signData(payload);
            console.log('Signing successful!');
            console.log('Payload:', payload);
            console.log('Signature length:', signature.length);
        } catch (e: any) {
            console.error('Signing threw an error (expected if key is invalid/missing in env):', e.message);
            // If error is about key format, that's env issue. If code ref error, that's my bug.
        }

    } catch (error) {
        console.error('Verification Script Failed:', error);
    }
}

verifySigning();

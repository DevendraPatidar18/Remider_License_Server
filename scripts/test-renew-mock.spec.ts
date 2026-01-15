
import { LicenseService } from '../modules/licenses/license.service';

// Mock the database query function
const mockQuery = jest.fn();
jest.mock('../database/db', () => ({
    query: mockQuery
}));

// Mock config
jest.mock('../config', () => ({
    config: {
        crypto: {
            privateKey: '-----BEGIN PRIVATE KEY-----\nMIIEvQIBADANBgkqhkiG9w0BAQEFAASCBKcwggSjAgEAAoIBAQDQq...\n-----END PRIVATE KEY-----' // Fake key for testing
        }
    }
}));


describe('LicenseService.renewLicense', () => {
    let licenseService: LicenseService;

    beforeEach(() => {
        licenseService = new LicenseService();
        mockQuery.mockReset();
    });

    it('should renew license and sign new payload', async () => {
        const mockLicenseId = 'license-123';
        const mockMonths = 1;

        // Mock Step 1: Fetch License
        mockQuery.mockResolvedValueOnce({
            rows: [{
                id: mockLicenseId,
                license_key: 'KEY123',
                device_id: 'dev-123',
                device_fingerprint: 'fingerprint-abc',
                expires_at: new Date('2025-01-01').toISOString(),
                status: 'active'
            }]
        });

        // Mock Step 5: Update License
        const newExpiryExpected = new Date('2025-02-01'); // approx
        mockQuery.mockResolvedValueOnce({
            rows: [{
                id: mockLicenseId,
                expires_at: newExpiryExpected.toISOString(),
                signed_payload: '{"data":{...},"signature":"..."}'
            }]
        });

        await licenseService.renewLicense(mockLicenseId, mockMonths);

        // Verify Query 1 (Fetch)
        expect(mockQuery).toHaveBeenNthCalledWith(1, expect.stringContaining('SELECT l.*'), [mockLicenseId]);

        // Verify Query 2 (Update)
        expect(mockQuery).toHaveBeenNthCalledWith(2, expect.stringContaining('UPDATE licenses'), expect.any(Array));

        const updateArgs = mockQuery.mock.calls[1][1];
        const newExpiresAtarg = updateArgs[0];
        const signedPayloadArg = updateArgs[1];

        // Verify Expiry Calculation (approximate check due to month logic)
        expect(new Date(newExpiresAtarg).getMonth()).toBe(1); // Feb is 1

        // Verify Payload Construction
        const payloadData = JSON.parse(signedPayloadArg);
        expect(payloadData.data.expiresAt).toBe(newExpiresAtarg.toISOString());
        expect(payloadData.data.deviceId).toBe('dev-123');
        expect(payloadData.signature).toBeDefined();

        console.log('Test Passed: Logic Verified');
    });
});

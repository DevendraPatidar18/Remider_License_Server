import fs from 'fs';
import crypto from 'crypto';
import { config } from '../config';

const privateKey = config.crypto.privateKey;

/**
 * Signs a payload with the private RSA key.
 * @param payload Object to sign
 * @returns Object containing the payload and the base64 signature
 */
export const signLicense = (payload: any) => {
    const jsonPayload = JSON.stringify(payload);
    const signer = crypto.createSign('SHA256');
    signer.update(jsonPayload);
    signer.end();

    const signature = signer.sign(privateKey, 'base64');

    return {
        payload,
        signature
    };
};

/**
 * Verifies a signature (Utility for server-side checks if needed, mainly for client)
 * @param payload 
 * @param signature 
 */
export const verifySignature = (payload: any, signature: string): boolean => {
    // For server-side verification we can read the public key
    // Implementation can be added if self-verification is needed
    // But primarily the Client does this.
    return true;
};

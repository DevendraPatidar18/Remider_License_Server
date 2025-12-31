
import dotenv from 'dotenv';
import path from 'path';
import crypto from 'crypto';

dotenv.config({ path: path.join(__dirname, '../.env') });

const privateKeyRaw = process.env.LICENSE_PRIVATE_KEY;

console.log('--- Raw Key Debug ---');
console.log('Is defined:', !!privateKeyRaw);
if (privateKeyRaw) {
    console.log('Length:', privateKeyRaw.length);
    console.log('First 50 chars:', privateKeyRaw.substring(0, 50));
    console.log('Last 50 chars:', privateKeyRaw.substring(privateKeyRaw.length - 50));
}

const formattedKey = privateKeyRaw?.replace(/\\n/g, '\n').replace(/\r/g, '').trim();

console.log('\n--- Formatted Key Debug ---');
console.log('First line:', formattedKey?.split('\n')[0]);
console.log('Second line:', formattedKey?.split('\n')[1]);
console.log('Last line:', formattedKey?.split('\n').pop());

try {
    const sign = crypto.createSign('RSA-SHA256');
    sign.update('test data');
    sign.end();

    const signature = sign.sign({
        key: formattedKey!,
        padding: crypto.constants.RSA_PKCS1_PADDING,
    }, 'base64');

    console.log('\nSUCCESS: Data signed successfully.');
} catch (error: any) {
    console.error('\nERROR: Signing failed.');
    console.error(error);
}

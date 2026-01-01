// import dotenv from 'dotenv';
// import path from 'path';
import fs from 'fs';

// dotenv.config({ path: path.join(__dirname, '../.env') });

// export const config = {
//     port: process.env.PORT || 3000,
//     env: process.env.NODE_ENV || 'development',
//     db: {
//         host: process.env.DB_HOST || 'localhost',
//         port: parseInt(process.env.DB_PORT || '5432'),
//         user: process.env.DB_USER || 'postgres',
//         password: process.env.DB_PASSWORD || 'postgres',
//         database: process.env.DB_NAME || 'license_server',
//     },
//     jwt: {
//         secret: process.env.JWT_SECRET || 'super-secret-key-change-this',
//         expiresIn: '1h', // Short expiry as requested
//     },
//     crypto: {
//         privateKeyPath: path.join(__dirname, '../crypto/private_key.pem'),
//         publicKeyPath: path.join(__dirname, '../crypto/public_key.pem'),
//     }
// };
import path from 'path';

export const config = {
    port: Number(process.env.PORT) || 3000,
    env: process.env.NODE_ENV || 'development',

    // Neon / Postgres
    databaseUrl: process.env.DATABASE_URL,

    jwt: {
        secret: process.env.JWT_SECRET || 'super-secret-key-change-this',
        expiresIn: '180d',
    },

    crypto: {
        privateKey: (() => {
            const key = process.env.LICENSE_PRIVATE_KEY;
            if (key) return key.replace(/\\n/g, '\n').replace(/\r/g, '').trim();
            try { return fs.readFileSync(path.join(__dirname, '../crypto/private_key.pem'), 'utf8'); } catch (e) { return ''; }
        })(),
        publicKey: (() => {
            const key = process.env.LICENSE_PUBLIC_KEY;
            if (key) return key.replace(/\\n/g, '\n').replace(/\r/g, '').trim();
            try { return fs.readFileSync(path.join(__dirname, '../crypto/public_key.pem'), 'utf8'); } catch (e) { return ''; }
        })(),
    },
};

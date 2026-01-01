
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import { query } from '../../database/db';
import { config } from '../../config';

export class AuthService {
    async createUser(phone: string, email: string, password: string, userName?: string, role: string = 'user') {
        const passwordHash = await bcrypt.hash(password, 10);

        const text = `
            INSERT INTO users (phone, email, password_hash, user_name, role)
            VALUES ($1, $2, $3, $4, $5)
            RETURNING id, phone, email, user_name, role, status, created_at
        `;

        const result = await query(text, [phone, email, passwordHash, userName, role]);
        return result.rows[0];
    }

    async validateUser(email: string, password: string) {
        const text = 'SELECT * FROM users WHERE email = $1';
        const result = await query(text, [email]);

        if (result.rows.length === 0) {
            return null;
        }

        const user = result.rows[0];
        const isValid = await bcrypt.compare(password, user.password_hash);

        if (!isValid) {
            return null;
        }

        if (user.status !== 'active') {
            throw new Error('User is blocked');
        }

        const token = jwt.sign(
            { userId: user.id, email: user.email, role: user.role || 'user' },
            config.jwt.secret,
            { expiresIn: config.jwt.expiresIn as any }
        );

        return {
            user: {
                id: user.id,
                email: user.email,
                phone: user.phone,
                userName: user.user_name,
                role: user.role
            },
            token
        };
    }

    async extendExpiry(userId: string) {
        const text = 'SELECT * FROM users WHERE id = $1';
        const result = await query(text, [userId]);

        if (result.rows.length === 0) {
            throw new Error('User not found');
        }

        const user = result.rows[0];
        if (user.status !== 'active') {
            throw new Error('User is blocked');
        }

        const token = jwt.sign(
            { userId: user.id, email: user.email, role: user.role || 'user' },
            config.jwt.secret,
            { expiresIn: config.jwt.expiresIn as any } // Uses new expiry
        );

        return { token };
    }
}

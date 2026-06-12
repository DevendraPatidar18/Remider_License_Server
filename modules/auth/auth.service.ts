
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import { query } from '../../database/db';
import { config } from '../../config';
import { sendOtpEmail } from '../../utils/email.util';

function generateOtp(): string {
    return Math.floor(100000 + Math.random() * 900000).toString();
}

export class AuthService {
    async createUser(phone: string, email: string, userName?: string, role: string = 'user') {
        // Check if email already exists
        const emailCheck = await query('SELECT id FROM users WHERE email = $1', [email]);
        if (emailCheck.rows.length > 0) {
            throw new Error('Email already exists');
        }

        // Check if phone already exists
        const phoneCheck = await query('SELECT id FROM users WHERE phone = $1', [phone]);
        if (phoneCheck.rows.length > 0) {
            throw new Error('Phone already exists');
        }

        const text = `
            INSERT INTO users (phone, email, user_name, role)
            VALUES ($1, $2, $3, $4)
            RETURNING id, phone, email, user_name, role, status, created_at
        `;
        const result = await query(text, [phone, email, userName, role]);
        return result.rows[0];
    }

    /** Send a 6-digit OTP to the given email address. */
    async sendOtp(email: string): Promise<void> {
        // Check user exists
        const userResult = await query('SELECT id, status FROM users WHERE email = $1', [email]);
        if (userResult.rows.length === 0) {
            throw new Error('User not found');
        }
        if (userResult.rows[0].status !== 'active') {
            throw new Error('User is blocked');
        }

        // Invalidate previous OTPs for this email
        await query(
            `UPDATE otp_codes SET used = TRUE WHERE email = $1 AND used = FALSE`,
            [email]
        );

        const otp = generateOtp();
        const otpHash = await bcrypt.hash(otp, 10);
        const expiresAt = new Date(Date.now() + 5 * 60 * 1000); // 5 minutes

        await query(
            `INSERT INTO otp_codes (email, otp_hash, expires_at) VALUES ($1, $2, $3)`,
            [email, otpHash, expiresAt]
        );

        await sendOtpEmail(email, otp);
    }

    /** Verify OTP and return user + JWT on success. */
    async verifyOtp(email: string, otp: string) {
        // Fetch latest valid OTP
        const otpResult = await query(
            `SELECT * FROM otp_codes
             WHERE email = $1 AND used = FALSE AND expires_at > NOW()
             ORDER BY created_at DESC
             LIMIT 1`,
            [email]
        );

        if (otpResult.rows.length === 0) {
            return null;
        }

        const record = otpResult.rows[0];
        const isValid = await bcrypt.compare(otp, record.otp_hash);

        if (!isValid) {
            return null;
        }

        // Mark OTP as used
        await query(`UPDATE otp_codes SET used = TRUE WHERE id = $1`, [record.id]);

        // Fetch user
        const userResult = await query('SELECT * FROM users WHERE email = $1', [email]);
        const user = userResult.rows[0];

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
                role: user.role,
            },
            token,
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
            { expiresIn: config.jwt.expiresIn as any }
        );

        return { token };
    }
}

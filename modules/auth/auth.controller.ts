
import { Request, Response } from 'express';
import { AuthService } from './auth.service';

const authService = new AuthService();

// ─── User Registration ────────────────────────────────────────────────────────

export const register = async (req: Request, res: Response) => {
    try {
        const { phone, email, userName } = req.body;

        if (!phone || !email) {
            return res.status(400).json({ success: false, message: 'Missing required fields' });
        }

        const user = await authService.createUser(phone, email, userName);
        res.status(201).json({ success: true, data: user });
    } catch (error: any) {
        if (error.message === 'Email already exists') {
            return res.status(409).json({ success: false, message: 'Email already exists' });
        }
        if (error.message === 'Phone already exists') {
            return res.status(409).json({ success: false, message: 'user allready registered wih this number' });
        }
        if (error.code === '23505') {
            return res.status(409).json({ success: false, message: 'User already exists' });
        }
        console.error('Register Error:', error);
        res.status(500).json({ success: false, message: 'Internal Server Error' });
    }
};

// ─── User OTP Login ───────────────────────────────────────────────────────────

export const requestOtp = async (req: Request, res: Response) => {
    try {
        const { email } = req.body;

        if (!email) {
            return res.status(400).json({ success: false, message: 'Email is required' });
        }

        await authService.sendOtp(email);
        res.json({ success: true, message: 'OTP sent to your email' });
    } catch (error: any) {
        console.error('Request OTP Error:', error);
        if (error.message === 'User not found') {
            return res.status(404).json({ success: false, message: 'email id is not correct' });
        }
        if (error.message === 'User is blocked') {
            return res.status(403).json({ success: false, message: 'User is blocked' });
        }
        res.status(500).json({ success: false, message: 'email id is not correct' });
    }
};

export const verifyOtp = async (req: Request, res: Response) => {
    try {
        const { email, otp } = req.body;

        if (!email || !otp) {
            return res.status(400).json({ success: false, message: 'Email and OTP are required' });
        }

        const result = await authService.verifyOtp(email, otp);

        if (!result) {
            return res.status(401).json({ success: false, message: 'Invalid or expired OTP' });
        }

        res.json({ success: true, data: result });
    } catch (error: any) {
        console.error('Verify OTP Error:', error);
        if (error.message === 'User is blocked') {
            return res.status(403).json({ success: false, message: 'User is blocked' });
        }
        res.status(500).json({ success: false, message: 'Internal Server Error' });
    }
};

// ─── Extend JWT Expiry ────────────────────────────────────────────────────────

export const extendExpiry = async (req: Request, res: Response) => {
    try {
        const userId = (req as any).user?.userId;
        if (!userId) {
            return res.status(401).json({ success: false, message: 'Unauthorized' });
        }

        const result = await authService.extendExpiry(userId);
        res.json({ success: true, data: result });
    } catch (error: any) {
        console.error('Extend Expiry Error:', error);
        res.status(500).json({ success: false, message: 'Internal Server Error' });
    }
};

// ─── Admin Routes ─────────────────────────────────────────────────────────────

export const adminRegister = async (req: Request, res: Response) => {
    try {
        const { phone, email, userName } = req.body;

        if (!phone || !email) {
            return res.status(400).json({ success: false, message: 'Missing required fields' });
        }

        const user = await authService.createUser(phone, email, userName, 'admin');
        res.status(201).json({ success: true, data: user });
    } catch (error: any) {
        if (error.message === 'Email already exists') {
            return res.status(409).json({ success: false, message: 'Email already exists' });
        }
        if (error.message === 'Phone already exists') {
            return res.status(409).json({ success: false, message: 'user allready registered wih this number' });
        }
        if (error.code === '23505') {
            return res.status(409).json({ success: false, message: 'User already exists' });
        }
        console.error('Admin Register Error:', error);
        res.status(500).json({ success: false, message: 'Internal Server Error' });
    }
};

export const adminRequestOtp = async (req: Request, res: Response) => {
    try {
        const { email } = req.body;

        if (!email) {
            return res.status(400).json({ success: false, message: 'Email is required' });
        }

        await authService.sendOtp(email);
        res.json({ success: true, message: 'OTP sent to your email' });
    } catch (error: any) {
        console.error('Admin Request OTP Error:', error);
        if (error.message === 'User not found') {
            return res.status(404).json({ success: false, message: 'email id is not correct' });
        }
        if (error.message === 'User is blocked') {
            return res.status(403).json({ success: false, message: 'User is blocked' });
        }
        res.status(500).json({ success: false, message: 'email id is not correct' });
    }
};

export const adminVerifyOtp = async (req: Request, res: Response) => {
    try {
        const { email, otp } = req.body;

        if (!email || !otp) {
            return res.status(400).json({ success: false, message: 'Email and OTP are required' });
        }

        const result = await authService.verifyOtp(email, otp);

        if (!result) {
            return res.status(401).json({ success: false, message: 'Invalid or expired OTP' });
        }

        // Ensure the caller is an admin
        if (result.user.role !== 'admin') {
            return res.status(403).json({ success: false, message: 'Access denied: Admins only' });
        }

        res.json({ success: true, data: result });
    } catch (error: any) {
        console.error('Admin Verify OTP Error:', error);
        if (error.message === 'User is blocked') {
            return res.status(403).json({ success: false, message: 'User is blocked' });
        }
        res.status(500).json({ success: false, message: 'Internal Server Error' });
    }
};

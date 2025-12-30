
import { Request, Response } from 'express';
import { AuthService } from './auth.service';

const authService = new AuthService();

export const register = async (req: Request, res: Response) => {
    try {
        const { phone, email, password } = req.body;

        if (!phone || !email || !password) {
            return res.status(400).json({ success: false, message: 'Missing required fields' });
        }

        const user = await authService.createUser(phone, email, password);
        res.status(201).json({ success: true, data: user });
    } catch (error: any) {
        if (error.code === '23505') { // Unique violation
            return res.status(409).json({ success: false, message: 'User already exists' });
        }
        console.error('Register Error:', error);
        res.status(500).json({ success: false, message: 'Internal Server Error' });
    }
};

export const login = async (req: Request, res: Response) => {
    try {
        const { email, password } = req.body;

        if (!email || !password) {
            return res.status(400).json({ success: false, message: 'Missing credentials' });
        }

        const result = await authService.validateUser(email, password);

        if (!result) {
            return res.status(401).json({ success: false, message: 'Invalid credentials' });
        }

        res.json({ success: true, data: result });
    } catch (error: any) {
        console.error('Login Error:', error);
        if (error.message === 'User is blocked') {
            return res.status(403).json({ success: false, message: 'User is blocked' });
        }
        res.status(500).json({ success: false, message: 'Internal Server Error' });
    }
};


import { Request, Response } from 'express';
import { UserService } from './user.service';

const userService = new UserService();

export const getMe = async (req: Request, res: Response) => {
    try {
        // Assuming auth middleware populates req.user
        const userId = (req as any).user?.userId;

        if (!userId) {
            return res.status(401).json({ success: false, message: 'Unauthorized' });
        }

        const user = await userService.getUserById(userId);

        if (!user) {
            return res.status(404).json({ success: false, message: 'User not found' });
        }

        res.json({ success: true, data: user });
    } catch (error: any) {
        console.error('Get Me Error:', error);
        res.status(500).json({ success: false, message: 'Internal Server Error' });
    }
};

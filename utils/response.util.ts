import { Response } from 'express';

export const success = (res: Response, data: any, message = 'Success', statusCode = 200) => {
    res.status(statusCode).json({
        success: true,
        message,
        data,
    });
};

export const error = (res: Response, message: string, statusCode = 500, error: any = null) => {
    console.error(message, error);
    res.status(statusCode).json({
        success: false,
        message,
        error: process.env.NODE_ENV === 'development' ? error : undefined,
    });
};

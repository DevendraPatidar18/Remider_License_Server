import nodemailer from 'nodemailer';
import { config } from '../config';

const transporter = nodemailer.createTransport({
    host: config.email.host,
    port: config.email.port,
    secure: config.email.port === 465,
    auth: {
        user: config.email.user,
        pass: config.email.pass,
    },
});

export async function sendOtpEmail(email: string, otp: string): Promise<void> {
    await transporter.sendMail({
        from: `"License Server" <${config.email.from}>`,
        to: email,
        subject: 'Your Login OTP',
        html: `
            <div style="font-family: Arial, sans-serif; max-width: 480px; margin: auto; padding: 24px; border: 1px solid #e0e0e0; border-radius: 8px;">
                <h2 style="color: #333;">Your One-Time Password</h2>
                <p style="font-size: 16px; color: #555;">Use the following OTP to log in. It expires in <strong>5 minutes</strong>.</p>
                <div style="font-size: 36px; font-weight: bold; letter-spacing: 8px; text-align: center; padding: 16px; background: #f5f5f5; border-radius: 6px; color: #222;">
                    ${otp}
                </div>
                <p style="margin-top: 20px; font-size: 13px; color: #999;">If you didn't request this, please ignore this email.</p>
            </div>
        `,
    });
}

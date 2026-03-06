import { Request, Response } from 'express';
import jwt from 'jsonwebtoken';
import User from '../models/User';
import OtpToken from '../models/OtpToken';
import { sendEmail } from '../services/emailService';
import { generateOtp } from '../utils/generateOtp';
import { AuthRequest } from '../middlewares/authMiddleware';

const generateToken = (id: string, role: string) => {
    return jwt.sign({ id, role }, process.env.JWT_SECRET || 'secret', {
        expiresIn: (process.env.JWT_EXPIRES_IN || '30d') as any,
    });
};

export const registerUser = async (req: Request, res: Response): Promise<void> => {
    const { name, email, password, role, society, flatNumber, phone } = req.body;

    try {
        const userExists = await User.findOne({ email });

        if (userExists) {
            res.status(400).json({ message: 'User already exists' });
            return;
        }

        const user = await User.create({
            name,
            email,
            password,
            role,
            society,
            flatNumber,
            phone,
        });

        if (user) {
            // Send OTP for Verification
            const otp = generateOtp();
            const expiresAt = new Date(Date.now() + 5 * 60 * 1000); // 5 mins expiration
            await OtpToken.create({
                user: user._id,
                otp,
                type: 'VERIFICATION',
                expiresAt,
            });

            await sendEmail(
                user.email,
                'Verify your Society Management Account',
                `Your email verification OTP is: ${otp}. It will expire in 5 minutes.`,
                `<p>Your email verification OTP is: <b>${otp}</b>. It will expire in 5 minutes.</p>`
            );

            res.status(201).json({
                _id: user._id,
                name: user.name,
                email: user.email,
                role: user.role,
                isVerified: user.isVerified,
                message: 'Registration successful. Please verify your email.',
                token: generateToken((user._id as any).toString(), user.role),
            });
            return;
        } else {
            res.status(400).json({ message: 'Invalid user data' });
            return;
        }
    } catch (error: any) {
        res.status(500).json({ message: error.message });
        return;
    }
};

export const loginUser = async (req: Request, res: Response): Promise<void> => {
    const { email, password } = req.body;

    try {
        const user = await User.findOne({ email });

        if (user && (await user.comparePassword(password))) {
            res.json({
                _id: user._id,
                name: user.name,
                email: user.email,
                role: user.role,
                isVerified: user.isVerified,
                society: user.society,
                flatNumber: user.flatNumber,
                phone: user.phone,
                token: generateToken((user._id as any).toString(), user.role),
            });
            return;
        } else {
            res.status(401).json({ message: 'Invalid email or password' });
            return;
        }
    } catch (error: any) {
        res.status(500).json({ message: error.message });
        return;
    }
};

export const verifyEmail = async (req: Request, res: Response): Promise<void> => {
    const { email, otp } = req.body;
    try {
        const user = await User.findOne({ email });
        if (!user) {
            res.status(404).json({ message: 'User not found' });
            return;
        }

        if (user.isVerified) {
            res.status(400).json({ message: 'Email already verified' });
            return;
        }

        const otpRecord = await OtpToken.findOne({
            user: user._id,
            otp,
            type: 'VERIFICATION'
        });

        if (!otpRecord) {
            res.status(400).json({ message: 'Invalid or expired OTP' });
            return;
        }

        user.isVerified = true;
        await user.save();
        await OtpToken.deleteOne({ _id: otpRecord._id });

        res.status(200).json({ message: 'Email verified successfully!' });
    } catch (error: any) {
        res.status(500).json({ message: error.message });
    }
};

export const forgotPassword = async (req: Request, res: Response): Promise<void> => {
    const { email } = req.body;
    try {
        const user = await User.findOne({ email });
        if (!user) {
            res.status(404).json({ message: 'User not found' });
            return;
        }

        const otp = generateOtp();
        const expiresAt = new Date(Date.now() + 5 * 60 * 1000); // 5 mins expiration

        await OtpToken.create({
            user: user._id,
            otp,
            type: 'FORGOT_PASSWORD',
            expiresAt,
        });

        await sendEmail(
            user.email,
            'Password Reset Request - Society Management',
            `Your password reset OTP is: ${otp}. It will expire in 5 minutes.`,
            `<p>Your password reset OTP is: <b>${otp}</b>. It will expire in 5 minutes.</p>`
        );

        res.status(200).json({ message: 'Password reset OTP sent to your email.' });
    } catch (error: any) {
        res.status(500).json({ message: error.message });
    }
};

export const updateProfile = async (req: AuthRequest, res: Response): Promise<void> => {
    const { name, phone, themePreference } = req.body;
    try {
        if (!req.user) {
            res.status(401).json({ message: 'User not found in request' });
            return;
        }
        const user = await User.findById(req.user._id);

        if (!user) {
            res.status(404).json({ message: 'User not found' });
            return;
        }

        if (name) user.name = name;
        if (phone) user.phone = phone;
        if (themePreference) user.themePreference = themePreference as any;

        await user.save();

        res.status(200).json({
            _id: user._id,
            name: user.name,
            email: user.email,
            role: user.role,
            phone: user.phone,
            themePreference: user.themePreference,
            isVerified: user.isVerified,
            society: user.society,
            flatNumber: user.flatNumber,
        });
    } catch (error: any) {
        res.status(500).json({ message: error.message });
    }
};

export const resetPassword = async (req: Request, res: Response): Promise<void> => {
    const { email, otp, newPassword } = req.body;
    try {
        const user = await User.findOne({ email });
        if (!user) {
            res.status(404).json({ message: 'User not found' });
            return;
        }

        const otpRecord = await OtpToken.findOne({
            user: user._id,
            otp,
            type: 'FORGOT_PASSWORD'
        });

        if (!otpRecord) {
            res.status(400).json({ message: 'Invalid or expired OTP' });
            return;
        }

        user.password = newPassword;
        await user.save();
        await OtpToken.deleteOne({ _id: otpRecord._id });

        res.status(200).json({ message: 'Password has been reset successfully. You can now login.' });
    } catch (error: any) {
        res.status(500).json({ message: error.message });
    }
};

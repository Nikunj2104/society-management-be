import { Request, Response } from 'express';
import Society from '../models/Society';
import User from '../models/User';
import { generateOtp } from '../utils/generateOtp';
import { sendEmail } from '../services/emailService';
import bcrypt from 'bcrypt';

// @desc    Create a new society
// @route   POST /api/super-admin/societies
// @access  Private/SuperAdmin
export const createSociety = async (req: Request, res: Response): Promise<void> => {
    try {
        const { name, address, city, state, zipCode, numberOfUnits, contactNumber, contactEmail } = req.body;

        const societyExists = await Society.findOne({ name, city, state });
        if (societyExists) {
            res.status(400).json({ message: 'Society with this name and location already exists' });
            return;
        }

        const society = await Society.create({
            name, address, city, state, zipCode, numberOfUnits, contactNumber, contactEmail
        });

        res.status(201).json(society);
    } catch (error: any) {
        res.status(500).json({ message: error.message });
    }
};

// @desc    Get all societies
// @route   GET /api/super-admin/societies
// @access  Private/SuperAdmin
export const getAllSocieties = async (req: Request, res: Response): Promise<void> => {
    try {
        const societies = await Society.find().sort({ createdAt: -1 });
        res.status(200).json(societies);
    } catch (error: any) {
        res.status(500).json({ message: error.message });
    }
};

// @desc    Add a society admin
// @route   POST /api/super-admin/admins
// @access  Private/SuperAdmin
export const addSocietyAdmin = async (req: Request, res: Response): Promise<void> => {
    try {
        const { name, email, password, phone, societyId } = req.body;

        const society = await Society.findById(societyId);
        if (!society) {
            res.status(404).json({ message: 'Society not found' });
            return;
        }

        const userExists = await User.findOne({ email });
        if (userExists) {
            res.status(400).json({ message: 'User with this email already exists' });
            return;
        }

        const adminUser = await User.create({
            name,
            email,
            password,
            phone,
            role: 'ADMIN',
            society: societyId,
            isVerified: true, // We can auto-verify admins created by Super Admin or send them an intro email
        });

        // Optional: Send welcome email with credentials
        try {
            await sendEmail(
                email,
                'Welcome to Society Management - Admin Account',
                `Hello ${name}, an admin account for ${society.name} has been created for you. Your password is: ${password}. Please login and change it immediately.`,
                `<p>Hello ${name},</p><p>An admin account for <b>${society.name}</b> has been created for you.</p><p>Your temporary password is: <b>${password}</b></p><p>Please login and change it immediately.</p>`
            );
        } catch (emailError) {
            console.error('Welcome email failed to send:', emailError);
            // We don't throw here so the user creation is still considered a success
        }

        res.status(201).json({
            _id: adminUser._id,
            name: adminUser.name,
            email: adminUser.email,
            society: adminUser.society,
            role: adminUser.role,
            message: 'Admin account created successfully. Note: Welcome email could not be sent due to server configuration.'
        });

    } catch (error: any) {
        res.status(500).json({ message: error.message });
    }
};

// @desc    Get all admins
// @route   GET /api/super-admin/admins
// @access  Private/SuperAdmin
export const getAllAdmins = async (req: Request, res: Response): Promise<void> => {
    try {
        const admins = await User.find({ role: 'ADMIN', status: { $ne: 'deleted' } })
            .populate('society', 'name city')
            .select('-password')
            .sort({ createdAt: -1 });

        res.status(200).json(admins);
    } catch (error: any) {
        res.status(500).json({ message: error.message });
    }
};

// @desc    Block or Activate Admin
// @route   PATCH /api/super-admin/admins/:id/status
// @access  Private/SuperAdmin
export const toggleAdminStatus = async (req: Request, res: Response): Promise<void> => {
    try {
        const { id } = req.params;
        const user = await User.findById(id);

        if (!user) {
            res.status(404).json({ message: 'Admin not found' });
            return;
        }

        if (user.role !== 'ADMIN') {
            res.status(400).json({ message: 'User is not an admin' });
            return;
        }

        user.isActive = !user.isActive;
        user.status = user.isActive ? 'active' : 'inactive';
        await user.save();

        res.status(200).json({
            message: `Admin ${user.isActive ? 'activated' : 'blocked'} successfully`,
            user,
        });
    } catch (error: any) {
        res.status(500).json({ message: error.message });
    }
};

// @desc    Soft Delete Admin
// @route   DELETE /api/super-admin/admins/:id
// @access  Private/SuperAdmin
export const deleteAdmin = async (req: Request, res: Response): Promise<void> => {
    try {
        const { id } = req.params;
        const user = await User.findById(id);

        if (!user) {
            res.status(404).json({ message: 'Admin not found' });
            return;
        }

        user.status = 'deleted';
        user.isActive = false; // Also deactivate
        await user.save();

        res.status(200).json({ message: 'Admin deleted successfully (soft delete)' });
    } catch (error: any) {
        res.status(500).json({ message: error.message });
    }
};

// @desc    Block or Activate Society
// @route   PATCH /api/super-admin/societies/:id/status
// @access  Private/SuperAdmin
export const toggleSocietyStatus = async (req: Request, res: Response): Promise<void> => {
    try {
        const { id } = req.params;
        const society = await Society.findById(id);

        if (!society) {
            res.status(404).json({ message: 'Society not found' });
            return;
        }

        society.isActive = !society.isActive;
        await society.save();

        res.status(200).json({
            message: `Society ${society.isActive ? 'activated' : 'blocked'} successfully`,
            society,
        });
    } catch (error: any) {
        res.status(500).json({ message: error.message });
    }
};

// @desc    Get system analytics
// @route   GET /api/super-admin/analytics
// @access  Private/SuperAdmin
export const getAnalytics = async (req: Request, res: Response): Promise<void> => {
    try {
        const totalSocieties = await Society.countDocuments();
        const activeSocieties = await Society.countDocuments({ isActive: true });
        const totalAdmins = await User.countDocuments({ role: 'ADMIN', status: { $ne: 'deleted' } });
        const totalUsers = await User.countDocuments({ role: 'USER', status: { $ne: 'deleted' } });

        // Placeholders for complaints/maintenance summaries
        // In reality, this would query Complaints and Maintenance models
        const analytics = {
            totalSocieties,
            activeSocieties,
            totalAdmins,
            totalUsers,
            maintenanceCollectionSummary: { totalAmount: 0, pending: 0 }, // Stub map this later
            complaintsSummary: { open: 0, inProgress: 0, resolved: 0 }, // Stub map this later
        };

        res.status(200).json(analytics);
    } catch (error: any) {
        res.status(500).json({ message: error.message });
    }
};

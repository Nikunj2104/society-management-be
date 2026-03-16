import { Response } from 'express';
import { AuthRequest } from '../middlewares/authMiddleware';
import User from '../models/User';
import Complaint from '../models/Complaint';
import Maintenance from '../models/Maintenance';
import Announcement from '../models/Announcement';
import Event from '../models/Event';
import UserNotification from '../models/UserNotification';
import { sendEmail } from '../services/emailService';
import { getIO } from '../socket';

// ─── DASHBOARD ───────────────────────────────────────────────────────────────

export const getAdminDashboard = async (req: AuthRequest, res: Response): Promise<void> => {
    try {
        const societyId = req.user.society;

        const totalResidents = await User.countDocuments({ society: societyId, role: 'USER' });
        const pendingComplaints = await Complaint.countDocuments({ society: societyId, status: 'Open' });
        const unpaidMaintenance = await Maintenance.countDocuments({ society: societyId, isPaid: false });
        const paidMaintenance = await Maintenance.countDocuments({ society: societyId, isPaid: true });

        const upcomingEvents = await Event.find({
            society: societyId,
            eventDate: { $gte: new Date() },
        }).sort({ eventDate: 1 }).limit(5);

        res.status(200).json({
            totalResidents,
            pendingComplaints,
            maintenance: { paid: paidMaintenance, unpaid: unpaidMaintenance },
            upcomingEvents,
        });
    } catch (error: any) {
        res.status(500).json({ message: error.message });
    }
};

// ─── USER MANAGEMENT ─────────────────────────────────────────────────────────

export const getResidents = async (req: AuthRequest, res: Response): Promise<void> => {
    try {
        const residents = await User.find({ society: req.user.society, role: 'USER' })
            .select('-password')
            .sort({ createdAt: -1 });
        res.status(200).json(residents);
    } catch (error: any) {
        res.status(500).json({ message: error.message });
    }
};

export const addResident = async (req: AuthRequest, res: Response): Promise<void> => {
    try {
        const { name, email, password, phone, flatNumber } = req.body;
        const userExists = await User.findOne({ email });
        if (userExists) {
            res.status(400).json({ message: 'User already exists' });
            return;
        }
        const resident = await User.create({
            name, email, password, phone, flatNumber,
            role: 'USER',
            society: req.user.society,
            isVerified: true,
        });

        try {
            await sendEmail(
                email,
                'Welcome to the Society - Resident Account Created',
                `Hello ${name}, your resident account has been created. Your password is: ${password}. Please login and change it.`,
                `<p>Hello ${name},</p><p>Your resident account has been created. Your temporary password is: <b>${password}</b></p><p>Please login and change it immediately.</p>`
            );
        } catch (emailError) {
            console.error('Resident welcome email failed to send:', emailError);
        }

        res.status(201).json({
            _id: resident._id,
            name: resident.name,
            email: resident.email,
            flatNumber: resident.flatNumber,
            message: 'Resident added successfully. Note: Welcome email could not be sent.'
        });
    } catch (error: any) {
        res.status(500).json({ message: error.message });
    }
};

export const updateResident = async (req: AuthRequest, res: Response): Promise<void> => {
    try {
        const { id } = req.params;
        const resident = await User.findOneAndUpdate(
            { _id: id, society: req.user.society, role: 'USER' },
            req.body,
            { new: true }
        ).select('-password');
        if (!resident) { res.status(404).json({ message: 'Resident not found' }); return; }
        res.status(200).json(resident);
    } catch (error: any) {
        res.status(500).json({ message: error.message });
    }
};

export const deleteResident = async (req: AuthRequest, res: Response): Promise<void> => {
    try {
        const { id } = req.params;
        console.log(`🗑️ Deleting resident: ${id} for society: ${req.user.society}`);
        const resident = await User.findOneAndDelete({ _id: id, society: req.user.society, role: 'USER' });
        if (!resident) {
            console.log(`⚠️ Resident not found or already deleted: ${id}`);
            res.status(404).json({ message: 'Resident not found' });
            return;
        }
        console.log(`✅ Resident removed successfully: ${id}`);
        res.status(200).json({ message: 'Resident removed successfully' });
    } catch (error: any) {
        console.error(`❌ Error deleting resident ${req.params.id}:`, error.message);
        res.status(500).json({ message: error.message });
    }
};

// ─── ANNOUNCEMENTS ───────────────────────────────────────────────────────────

export const getAnnouncements = async (req: AuthRequest, res: Response): Promise<void> => {
    try {
        const announcements = await Announcement.find({ society: req.user.society })
            .populate('createdBy', 'name')
            .sort({ createdAt: -1 });
        res.status(200).json(announcements);
    } catch (error: any) {
        res.status(500).json({ message: error.message });
    }
};

export const createAnnouncement = async (req: AuthRequest, res: Response): Promise<void> => {
    try {
        const { title, content } = req.body;
        const announcement = await Announcement.create({
            title, content,
            society: req.user.society,
            createdBy: req.user._id,
        });

        // Email all residents (non-blocking)
        User.find({ society: req.user.society, role: 'USER' }).select('email name')
            .then(residents => {
                residents.forEach(resident => {
                    sendEmail(
                        resident.email,
                        `Society Announcement: ${title}`,
                        content,
                        `<h3>${title}</h3><p>${content}</p>`
                    ).catch(err => console.error(`Failed to send email to ${resident.email}:`, err));
                });
            })
            .catch(err => console.error('Error fetching residents for email:', err));

        res.status(201).json(announcement);
    } catch (error: any) {
        res.status(500).json({ message: error.message });
    }
};

export const deleteAnnouncement = async (req: AuthRequest, res: Response): Promise<void> => {
    try {
        const { id } = req.params;
        console.log(`🗑️ Deleting announcement: ${id} for society: ${req.user.society}`);
        const deleted = await Announcement.findOneAndDelete({ _id: id, society: req.user.society });
        if (!deleted) {
            console.log(`⚠️ Announcement not found or already deleted: ${id}`);
        } else {
            console.log(`✅ Announcement deleted successfully: ${id}`);
        }
        res.status(200).json({ message: 'Announcement deleted' });
    } catch (error: any) {
        console.error(`❌ Error deleting announcement ${req.params.id}:`, error.message);
        res.status(500).json({ message: error.message });
    }
};

// ─── EVENTS ──────────────────────────────────────────────────────────────────

export const getEvents = async (req: AuthRequest, res: Response): Promise<void> => {
    try {
        const events = await Event.find({ society: req.user.society }).sort({ eventDate: 1 });
        res.status(200).json(events);
    } catch (error: any) {
        res.status(500).json({ message: error.message });
    }
};

export const createEvent = async (req: AuthRequest, res: Response): Promise<void> => {
    try {
        const { title, description, eventDate, isFestival, festivalName } = req.body;
        const event = await Event.create({
            title, description, eventDate, isFestival, festivalName,
            society: req.user.society,
            createdBy: req.user._id,
        });
        res.status(201).json(event);
    } catch (error: any) {
        res.status(500).json({ message: error.message });
    }
};

export const updateEvent = async (req: AuthRequest, res: Response): Promise<void> => {
    try {
        const { id } = req.params;
        const event = await Event.findOneAndUpdate(
            { _id: id, society: req.user.society },
            req.body,
            { new: true }
        );
        if (!event) { res.status(404).json({ message: 'Event not found' }); return; }
        res.status(200).json(event);
    } catch (error: any) {
        res.status(500).json({ message: error.message });
    }
};

export const deleteEvent = async (req: AuthRequest, res: Response): Promise<void> => {
    try {
        const { id } = req.params;
        console.log(`🗑️ Deleting event: ${id} for society: ${req.user.society}`);
        const deleted = await Event.findOneAndDelete({ _id: id, society: req.user.society });
        if (!deleted) {
            console.log(`⚠️ Event not found or already deleted: ${id}`);
        } else {
            console.log(`✅ Event deleted successfully: ${id}`);
        }
        res.status(200).json({ message: 'Event deleted' });
    } catch (error: any) {
        console.error(`❌ Error deleting event ${req.params.id}:`, error.message);
        res.status(500).json({ message: error.message });
    }
};

// ─── MAINTENANCE ─────────────────────────────────────────────────────────────

export const getMaintenanceRecords = async (req: AuthRequest, res: Response): Promise<void> => {
    try {
        const records = await Maintenance.find({ society: req.user.society })
            .populate('user', 'name flatNumber email')
            .sort({ createdAt: -1 });
        res.status(200).json(records);
    } catch (error: any) {
        res.status(500).json({ message: error.message });
    }
};

export const addMaintenanceRecord = async (req: AuthRequest, res: Response): Promise<void> => {
    try {
        const { userId, amount, month, year, dueDate, description } = req.body;
        const record = await Maintenance.create({
            society: req.user.society,
            user: userId,
            amount, month, year, dueDate, description,
        });

        // Send in-app notification
        const notification = await UserNotification.create({
            user: userId,
            society: req.user.society,
            title: 'Maintenance Bill Generated',
            message: `Your maintenance bill for ${month} ${year} of ₹${amount} has been generated. Due date: ${new Date(dueDate).toDateString()}`,
            type: 'maintenance',
            relatedId: record._id
        });

        getIO().emit(`notification_${userId}`, notification);

        res.status(201).json(record);
    } catch (error: any) {
        res.status(500).json({ message: error.message });
    }
};

export const markMaintenancePaid = async (req: AuthRequest, res: Response): Promise<void> => {
    try {
        const { id } = req.params;
        const { paymentMode } = req.body;
        const record = await Maintenance.findOneAndUpdate(
            { _id: id, society: req.user.society },
            { isPaid: true, paymentMode, paidAt: new Date() },
            { new: true }
        ).populate('user', 'name email flatNumber');

        if (!record) { res.status(404).json({ message: 'Record not found' }); return; }

        // Notify resident
        const userDoc = record.user as any;
        await sendEmail(
            userDoc.email,
            'Maintenance Payment Confirmed',
            `Dear ${userDoc.name}, your maintenance of ₹${record.amount} for ${record.month} ${record.year} has been marked as paid.`,
            `<p>Dear ${userDoc.name},</p><p>Your maintenance of <b>₹${record.amount}</b> for <b>${record.month} ${record.year}</b> has been marked as paid via ${paymentMode}.</p>`
        );

        // Send in-app notification
        const notification = await UserNotification.create({
            user: userDoc._id,
            society: req.user.society,
            title: 'Payment Confirmed',
            message: `Your maintenance payment of ₹${record.amount} for ${record.month} ${record.year} has been confirmed.`,
            type: 'maintenance',
            relatedId: record._id
        });

        getIO().emit(`notification_${userDoc._id}`, notification);

        res.status(200).json({ message: 'Marked as paid', record });
    } catch (error: any) {
        res.status(500).json({ message: error.message });
    }
};

export const sendMaintenanceReminder = async (req: AuthRequest, res: Response): Promise<void> => {
    try {
        const { id } = req.params;
        const record = await Maintenance.findById(id).populate('user', 'name email flatNumber') as any;
        if (!record) { res.status(404).json({ message: 'Record not found' }); return; }
        if (record.isPaid) { res.status(400).json({ message: 'Maintenance already paid' }); return; }

        await sendEmail(
            record.user.email,
            'Maintenance Payment Reminder',
            `Dear ${record.user.name}, your maintenance of ₹${record.amount} for ${record.month} ${record.year} is due on ${new Date(record.dueDate).toDateString()}. Please pay at the earliest.`,
            `<p>Dear ${record.user.name},</p><p>Your maintenance of <b>₹${record.amount}</b> for <b>${record.month} ${record.year}</b> is due on <b>${new Date(record.dueDate).toDateString()}</b>.</p><p>Please pay at the earliest.</p>`
        );

        // Send in-app notification
        const notification = await UserNotification.create({
            user: record.user._id,
            society: req.user.society,
            title: 'Payment Reminder',
            message: `Reminder: Maintenance of ₹${record.amount} for ${record.month} ${record.year} is due on ${new Date(record.dueDate).toDateString()}.`,
            type: 'maintenance',
            relatedId: record._id
        });

        getIO().emit(`notification_${record.user._id}`, notification);

        res.status(200).json({ message: 'Reminder sent successfully' });
    } catch (error: any) {
        res.status(500).json({ message: error.message });
    }
};

export const generateBulkMaintenance = async (req: AuthRequest, res: Response): Promise<void> => {
    try {
        const { amount, month, year, dueDate, description } = req.body;
        const societyId = req.user.society;

        const residents = await User.find({ society: societyId, role: 'USER' });
        
        const records = await Promise.all(residents.map(async (resident) => {
            // Check if record already exists for this resident, month, and year
            const existing = await Maintenance.findOne({
                user: resident._id,
                month,
                year,
                society: societyId
            });

            if (existing) return null;

            const record = await Maintenance.create({
                society: societyId,
                user: resident._id,
                amount, month, year, dueDate, description,
            });

            // Notify via email (non-blocking)
            sendEmail(
                resident.email,
                'Maintenance Bill Generated',
                `Dear ${resident.name}, your maintenance bill for ${month} ${year} of ₹${amount} has been generated. Due date: ${new Date(dueDate).toDateString()}`,
                `<p>Dear ${resident.name},</p><p>Your maintenance bill for <b>${month} ${year}</b> of <b>₹${amount}</b> has been generated.</p><p><b>Due Date:</b> ${new Date(dueDate).toDateString()}</p>`
            ).catch(err => console.error('Bulk email failed:', err));

            // In-app notification
            const notification = await UserNotification.create({
                user: resident._id,
                society: societyId,
                title: 'New Maintenance Bill',
                message: `Maintenance bill for ${month} ${year} (₹${amount}) has been generated.`,
                type: 'maintenance',
                relatedId: record._id
            });

            getIO().emit(`notification_${resident._id}`, notification);

            return record;
        }));

        const createdCount = records.filter(r => r !== null).length;

        res.status(201).json({ 
            message: `Maintenance generated for ${createdCount} residents.`,
            count: createdCount 
        });
    } catch (error: any) {
        res.status(500).json({ message: error.message });
    }
};

export const remindBulkMaintenance = async (req: AuthRequest, res: Response): Promise<void> => {
    try {
        const societyId = req.user.society;
        const unpaidRecords = await Maintenance.find({ 
            society: societyId, 
            isPaid: false 
        }).populate('user', 'name email');

        await Promise.all(unpaidRecords.map(async (record) => {
            const user = record.user as any;
            
            // Email reminder
            sendEmail(
                user.email,
                'Maintenance Payment Reminder',
                `Dear ${user.name}, reminder for your maintenance of ₹${record.amount} for ${record.month} ${record.year}.`,
                `<p>Dear ${user.name},</p><p>Reminder for your maintenance of <b>₹${record.amount}</b> for <b>${record.month} ${record.year}</b>.</p>`
            ).catch(err => console.error('Bulk reminder email failed:', err));

            // In-app notification
            const notification = await UserNotification.create({
                user: user._id,
                society: societyId,
                title: 'Payment Reminder',
                message: `Quick reminder: Your maintenance for ${record.month} ${record.year} is still pending.`,
                type: 'maintenance',
                relatedId: record._id
            });

            getIO().emit(`notification_${user._id}`, notification);
        }));

        res.status(200).json({ message: `Reminders sent to ${unpaidRecords.length} residents.` });
    } catch (error: any) {
        res.status(500).json({ message: error.message });
    }
};

// ─── COMPLAINTS ──────────────────────────────────────────────────────────────

export const getComplaints = async (req: AuthRequest, res: Response): Promise<void> => {
    try {
        const complaints = await Complaint.find({ society: req.user.society })
            .populate('user', 'name flatNumber email')
            .sort({ createdAt: -1 });
        res.status(200).json(complaints);
    } catch (error: any) {
        res.status(500).json({ message: error.message });
    }
};

export const respondToComplaint = async (req: AuthRequest, res: Response): Promise<void> => {
    try {
        const { id } = req.params;
        const { adminResponse, status } = req.body;

        const complaint = await Complaint.findOneAndUpdate(
            { _id: id, society: req.user.society },
            { adminResponse, status },
            { new: true }
        ).populate('user', 'name email') as any;

        if (!complaint) { res.status(404).json({ message: 'Complaint not found' }); return; }

        await sendEmail(
            complaint.user.email,
            `Your Complaint "${complaint.title}" has been Updated`,
            `Dear ${complaint.user.name}, your complaint has been updated to status: ${status}. Admin response: ${adminResponse}`,
            `<p>Dear ${complaint.user.name},</p><p>Your complaint <b>"${complaint.title}"</b> has been updated.</p><p><b>Status:</b> ${status}</p><p><b>Admin Response:</b> ${adminResponse}</p>`
        );

        res.status(200).json(complaint);
    } catch (error: any) {
        res.status(500).json({ message: error.message });
    }
};

// ─── CUSTOM EMAIL ─────────────────────────────────────────────────────────────

export const sendCustomEmail = async (req: AuthRequest, res: Response): Promise<void> => {
    try {
        const { to, subject, message } = req.body;

        if (!to || !subject || !message) {
            res.status(400).json({ message: 'Receiver, subject and message are required' });
            return;
        }

        await sendEmail(
            to,
            subject,
            message,
            `<div style="font-family: sans-serif; padding: 20px; border: 1px solid #eee; border-radius: 10px;">
                <h2 style="color: #333;">${subject}</h2>
                <div style="color: #555; line-height: 1.6; white-space: pre-wrap;">${message}</div>
                <hr style="border: none; border-top: 1px solid #eee; margin: 20px 0;">
                <small style="color: #999;">Sent via Society Management Admin Portal</small>
            </div>`
        );

        res.status(200).json({ message: 'Email sent successfully' });
    } catch (error: any) {
        res.status(500).json({ message: error.message });
    }
};

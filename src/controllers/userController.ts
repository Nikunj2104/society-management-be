import { Response } from 'express';
import { AuthRequest } from '../middlewares/authMiddleware';
import Complaint from '../models/Complaint';
import Maintenance from '../models/Maintenance';
import Announcement from '../models/Announcement';
import Event from '../models/Event';
import UserNotification from '../models/UserNotification';

// ─── DASHBOARD ───────────────────────────────────────────────────────────────

export const getUserDashboard = async (req: AuthRequest, res: Response): Promise<void> => {
    try {
        const userId = req.user._id;
        const societyId = req.user.society;

        const [activeComplaints, unpaidMaintenance, latestAnnouncements, upcomingEvents] = await Promise.all([
            Complaint.countDocuments({ user: userId, status: { $ne: 'Resolved' } }),
            Maintenance.find({ user: userId, isPaid: false }).sort({ dueDate: 1 }).limit(3),
            Announcement.find({ society: societyId }).sort({ createdAt: -1 }).limit(5),
            Event.find({ society: societyId, eventDate: { $gte: new Date() } }).sort({ eventDate: 1 }).limit(5),
        ]);

        res.status(200).json({
            activeComplaints,
            unpaidMaintenance,
            latestAnnouncements,
            upcomingEvents,
        });
    } catch (error: any) {
        res.status(500).json({ message: error.message });
    }
};

// ─── COMPLAINTS ──────────────────────────────────────────────────────────────

export const getMyComplaints = async (req: AuthRequest, res: Response): Promise<void> => {
    try {
        const complaints = await Complaint.find({ user: req.user._id }).sort({ createdAt: -1 });
        res.status(200).json(complaints);
    } catch (error: any) {
        res.status(500).json({ message: error.message });
    }
};

export const raiseComplaint = async (req: AuthRequest, res: Response): Promise<void> => {
    try {
        const { title, description, category } = req.body;

        if (!req.user.society) {
            res.status(400).json({ message: 'Resident is not assigned to any society' });
            return;
        }

        const complaint = await Complaint.create({
            title,
            description,
            category,
            user: req.user._id,
            society: req.user.society,
        });

        res.status(201).json(complaint);
    } catch (error: any) {
        res.status(500).json({ message: error.message });
    }
};

// ─── MAINTENANCE ─────────────────────────────────────────────────────────────

export const getMyMaintenance = async (req: AuthRequest, res: Response): Promise<void> => {
    try {
        const records = await Maintenance.find({ user: req.user._id }).sort({ createdAt: -1 });
        res.status(200).json(records);
    } catch (error: any) {
        res.status(500).json({ message: error.message });
    }
};

// ─── ANNOUNCEMENTS ───────────────────────────────────────────────────────────

export const getMyAnnouncements = async (req: AuthRequest, res: Response): Promise<void> => {
    try {
        const announcements = await Announcement.find({ society: req.user.society })
            .populate('createdBy', 'name')
            .sort({ createdAt: -1 });
        res.status(200).json(announcements);
    } catch (error: any) {
        res.status(500).json({ message: error.message });
    }
};

// ─── EVENTS / CALENDAR ───────────────────────────────────────────────────────

export const getMyEvents = async (req: AuthRequest, res: Response): Promise<void> => {
    try {
        const events = await Event.find({ society: req.user.society }).sort({ eventDate: 1 });
        res.status(200).json(events);
    } catch (error: any) {
        res.status(500).json({ message: error.message });
    }
};

// ─── NOTIFICATIONS ───────────────────────────────────────────────────────────

export const getMyNotifications = async (req: AuthRequest, res: Response): Promise<void> => {
    try {
        const notifications = await UserNotification.find({ user: req.user._id })
            .sort({ createdAt: -1 })
            .limit(50);
        res.status(200).json(notifications);
    } catch (error: any) {
        res.status(500).json({ message: error.message });
    }
};

export const markNotificationRead = async (req: AuthRequest, res: Response): Promise<void> => {
    try {
        const { id } = req.params;
        await UserNotification.findOneAndUpdate(
            { _id: id, user: req.user._id },
            { isRead: true }
        );
        res.status(200).json({ message: 'Notification marked as read' });
    } catch (error: any) {
        res.status(500).json({ message: error.message });
    }
};

export const updatePushToken = async (req: AuthRequest, res: Response): Promise<void> => {
    try {
        const { token } = req.body;
        if (!token) {
            res.status(400).json({ message: 'Push token is required' });
            return;
        }

        await req.user.updateOne({ pushToken: token });
        res.status(200).json({ message: 'Push token updated successfully' });
    } catch (error: any) {
        res.status(500).json({ message: error.message });
    }
};

import { Request, Response } from 'express';
import Notification from '../models/Notification';
import { getIO } from '../socket';

export const getNotifications = async (req: Request, res: Response) => {
    try {
        const notifications = await Notification.find({ isActive: true });
        res.status(200).json(notifications);
    } catch (error) {
        res.status(500).json({ message: 'Error fetching notifications', error });
    }
};

export const createNotification = async (req: Request, res: Response) => {
    try {
        const notification = new Notification(req.body);
        await notification.save();
        getIO().emit('notifications_updated');
        res.status(201).json(notification);
    } catch (error) {
        res.status(500).json({ message: 'Error creating notification', error });
    }
};

export const updateNotification = async (req: Request, res: Response) => {
    try {
        const { id } = req.params;
        const notification = await Notification.findByIdAndUpdate(id, req.body, { new: true });
        if (!notification) {
            return res.status(404).json({ message: 'Notification not found' });
        }
        getIO().emit('notifications_updated');
        res.status(200).json(notification);
    } catch (error) {
        res.status(500).json({ message: 'Error updating notification', error });
    }
};

export const deleteNotification = async (req: Request, res: Response) => {
    try {
        const { id } = req.params;
        const notification = await Notification.findByIdAndDelete(id);
        if (!notification) {
            return res.status(404).json({ message: 'Notification not found' });
        }
        getIO().emit('notifications_updated');
        res.status(200).json({ message: 'Notification deleted successfully' });
    } catch (error) {
        res.status(500).json({ message: 'Error deleting notification', error });
    }
};

import express from 'express';
import { getNotifications, createNotification, updateNotification, deleteNotification } from '../controllers/notificationController';
import { protect, authorize } from '../middlewares/authMiddleware';

const router = express.Router();

// Public route to get active notifications so the app can sync on boot
router.get('/', getNotifications);

// Protected routes for superadmin to manage notifications
router.post('/', protect, authorize('SUPER_ADMIN'), createNotification);
router.put('/:id', protect, authorize('SUPER_ADMIN'), updateNotification);
router.delete('/:id', protect, authorize('SUPER_ADMIN'), deleteNotification);

export default router;

import express from 'express';
import { protect, authorize } from '../middlewares/authMiddleware';
import {
    getUserDashboard,
    getMyComplaints, raiseComplaint,
    getMyMaintenance,
    getMyAnnouncements,
    getMyEvents,
    getMyNotifications, markNotificationRead,
    updatePushToken,
} from '../controllers/userController';

const router = express.Router();

router.use(protect);
router.use(authorize('USER'));

// Dashboard
router.get('/dashboard', getUserDashboard);

// Notifications
router.get('/notifications', getMyNotifications);
router.patch('/notifications/:id/read', markNotificationRead);
router.post('/push-token', updatePushToken);

// Complaints
router.route('/complaints')
    .get(getMyComplaints)
    .post(raiseComplaint);

// Maintenance
router.get('/maintenance', getMyMaintenance);

// Announcements
router.get('/announcements', getMyAnnouncements);

// Events / Calendar
router.get('/events', getMyEvents);

export default router;

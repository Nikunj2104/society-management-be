import express from 'express';
import { protect, authorize } from '../middlewares/authMiddleware';
import {
    getAdminDashboard,
    getResidents, addResident, updateResident, deleteResident,
    getAnnouncements, createAnnouncement, deleteAnnouncement,
    getEvents, createEvent, updateEvent, deleteEvent,
    getMaintenanceRecords, addMaintenanceRecord, markMaintenancePaid, sendMaintenanceReminder,
    generateBulkMaintenance, remindBulkMaintenance,
    getComplaints, respondToComplaint,
    sendCustomEmail,
} from '../controllers/adminController';

const router = express.Router();

router.use(protect);
router.use(authorize('ADMIN'));

// Dashboard
router.get('/dashboard', getAdminDashboard);

// Residents
router.route('/residents')
    .get(getResidents)
    .post(addResident);
router.route('/residents/:id')
    .put(updateResident)
    .delete(deleteResident);

// Announcements
router.route('/announcements')
    .get(getAnnouncements)
    .post(createAnnouncement);
router.delete('/announcements/:id', deleteAnnouncement);

// Events
router.route('/events')
    .get(getEvents)
    .post(createEvent);
router.route('/events/:id')
    .put(updateEvent)
    .delete(deleteEvent);

// Maintenance
router.route('/maintenance')
    .get(getMaintenanceRecords)
    .post(addMaintenanceRecord);
router.post('/maintenance/bulk-generate', generateBulkMaintenance);
router.post('/maintenance/bulk-remind', remindBulkMaintenance);
router.patch('/maintenance/:id/pay', markMaintenancePaid);
router.post('/maintenance/:id/remind', sendMaintenanceReminder);

// Complaints
router.get('/complaints', getComplaints);
router.patch('/complaints/:id/respond', respondToComplaint);
router.post('/send-email', sendCustomEmail);

export default router;

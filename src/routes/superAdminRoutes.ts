import express from 'express';
import {
    createSociety,
    getAllSocieties,
    addSocietyAdmin,
    getAllAdmins,
    toggleSocietyStatus,
    getAnalytics
} from '../controllers/superAdminController';
import { protect, authorize } from '../middlewares/authMiddleware';

const router = express.Router();

// All Super Admin routes should be protected and only accessible by SUPER_ADMIN role
router.use(protect);
router.use(authorize('SUPER_ADMIN'));

// Society routes
router.route('/societies')
    .post(createSociety)
    .get(getAllSocieties);

router.patch('/societies/:id/status', toggleSocietyStatus);

// Admin routes
router.route('/admins')
    .post(addSocietyAdmin)
    .get(getAllAdmins);

// Analytics
router.get('/analytics', getAnalytics);

export default router;

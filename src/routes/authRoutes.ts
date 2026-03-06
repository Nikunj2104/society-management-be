import express from 'express';
import {
    registerUser,
    loginUser,
    verifyEmail,
    forgotPassword,
    resetPassword,
    updateProfile
} from '../controllers/authController';
import { body } from 'express-validator';
import { validate } from '../middlewares/validationMiddleware';
import { protect } from '../middlewares/authMiddleware';


const router = express.Router();

// Auth routes
router.post('/register', [
    body('name').notEmpty().withMessage('Name is required'),
    body('email').isEmail().withMessage('Invalid email format'),
    body('password').isLength({ min: 6 }).withMessage('Password must be at least 6 characters long'),
    validate
], registerUser);

router.post('/login', [
    body('email').isEmail().withMessage('Invalid email format'),
    body('password').notEmpty().withMessage('Password is required'),
    validate
], loginUser);
router.post('/verify-email', verifyEmail);
router.post('/forgot-password', forgotPassword);
router.post('/reset-password', resetPassword);

// Protected profile update
router.patch('/profile', protect, updateProfile);

export default router;

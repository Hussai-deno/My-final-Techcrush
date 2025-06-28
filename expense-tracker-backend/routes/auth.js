import express from 'express';
import {
  register,
  login,
  getProfile,
  updateProfile,
  changePassword
} from '../controllers/authController.js';
import { protect } from '../middleware/auth.js';
import {
  validateRegistration,
  validateLogin,
  handleValidationErrors
} from '../middleware/validation.js';
import { body } from 'express-validator';

const router = express.Router();

// Public routes
router.post('/register', validateRegistration, register);
router.post('/login', validateLogin, login);

// Protected routes
router.use(protect);

router.get('/profile', getProfile);
router.put('/profile', [
  body('name').optional().trim().isLength({ min: 2, max: 50 }),
  body('studentId').optional().trim().isLength({ max: 20 }),
  body('university').optional().trim().isLength({ max: 100 }),
  body('monthlyBudget').optional().isFloat({ min: 0 }),
  handleValidationErrors
], updateProfile);

router.put('/change-password', [
  body('currentPassword').notEmpty().withMessage('Current password is required'),
  body('newPassword')
    .isLength({ min: 6 })
    .withMessage('New password must be at least 6 characters long')
    .matches(/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)/)
    .withMessage('New password must contain at least one uppercase letter, one lowercase letter, and one number'),
  handleValidationErrors
], changePassword);

export default router;
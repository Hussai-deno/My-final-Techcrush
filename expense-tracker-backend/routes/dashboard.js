import express from 'express';
import {
  getDashboardOverview,
  getExpenseBreakdown,
  getMonthlyTrends,
  getFinancialInsights
} from '../controllers/dashboardController.js';
import { protect } from '../middleware/auth.js';
import { query } from 'express-validator';
import { handleValidationErrors } from '../middleware/validation.js';

const router = express.Router();

// All routes are protected
router.use(protect);

// Dashboard routes
router.get('/overview', getDashboardOverview);

router.get('/expense-breakdown', [
  query('period')
    .optional()
    .isIn(['week', 'month', 'year'])
    .withMessage('Period must be one of: week, month, year'),
  handleValidationErrors
], getExpenseBreakdown);

router.get('/monthly-trends', [
  query('months')
    .optional()
    .isInt({ min: 1, max: 24 })
    .withMessage('Months must be between 1 and 24'),
  handleValidationErrors
], getMonthlyTrends);

router.get('/insights', getFinancialInsights);

export default router;
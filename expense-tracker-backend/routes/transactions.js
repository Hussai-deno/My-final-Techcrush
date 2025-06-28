import express from 'express';
import {
  createTransaction,
  getTransactions,
  getTransaction,
  updateTransaction,
  deleteTransaction,
  getCategories,
  bulkDeleteTransactions
} from '../controllers/transactionController.js';
import { protect } from '../middleware/auth.js';
import {
  validateTransaction,
  validateTransactionQuery,
  handleValidationErrors
} from '../middleware/validation.js';
import { param, body } from 'express-validator';

const router = express.Router();

// All routes are protected
router.use(protect);

// Transaction routes
router.route('/')
  .get(validateTransactionQuery, getTransactions)
  .post(validateTransaction, createTransaction);

router.route('/bulk-delete')
  .delete([
    body('transactionIds')
      .isArray({ min: 1 })
      .withMessage('Transaction IDs array is required'),
    body('transactionIds.*')
      .isMongoId()
      .withMessage('Invalid transaction ID format'),
    handleValidationErrors
  ], bulkDeleteTransactions);

router.route('/categories')
  .get(getCategories);

router.route('/:id')
  .get([
    param('id').isMongoId().withMessage('Invalid transaction ID format'),
    handleValidationErrors
  ], getTransaction)
  .put([
    param('id').isMongoId().withMessage('Invalid transaction ID format'),
    validateTransaction
  ], updateTransaction)
  .delete([
    param('id').isMongoId().withMessage('Invalid transaction ID format'),
    handleValidationErrors
  ], deleteTransaction);

export default router;

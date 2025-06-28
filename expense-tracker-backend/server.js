import express from 'express';
import mongoose from 'mongoose';
import cors from 'cors';
import helmet from 'helmet';
import rateLimit from 'express-rate-limit';
import dotenv from 'dotenv';

// Import routes
import authRoutes from './routes/auth.js';
import transactionRoutes from './routes/transactions.js';
import dashboardRoutes from './routes/dashboard.js';

// Import database connection
import connectDB from './config/database.js';

// Import response handler
import { errorHandler } from './utils/responseHandler.js';

// Load environment variables
dotenv.config();

const app = express();
const PORT = process.env.PORT || 5000;

// Connect to database
connectDB();

// Security middleware
app.use(helmet());

// Rate limiting
const limiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 100, // limit each IP to 100 requests per windowMs
  message: 'Too many requests from this IP, please try again later.'
});
app.use(limiter);

// CORS configuration
app.use(cors({
  origin: process.env.CLIENT_URL || 'http://localhost:3000',
  credentials: true
}));

// Body parser middleware
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

// Welcome route
app.get('/', (req, res) => {
  res.json({
    success: true,
    message: 'Welcome to Expense Tracker API 2025',
    version: '1.0.0',
    description: 'A web-based Expense Tracker Application that simplifies financial management for students',
    features: [
      'Secure user registration and authentication',
      'Income and expense recording with detailed categorization', 
      'Advanced data filtering and sorting capabilities',
      'Interactive data visualization and financial insights',
      'Real-time dashboard with financial trends'
    ],
    endpoints: {
      auth: '/api/auth',
      transactions: '/api/transactions', 
      dashboard: '/api/dashboard'
    },
    year: 2025
  });
});

// Routes
app.use('/api/auth', authRoutes);
app.use('/api/transactions', transactionRoutes);
app.use('/api/dashboard', dashboardRoutes);

// Error handling middleware
app.use(errorHandler);

// Handle 404 routes
app.use('*', (req, res) => {
  res.status(404).json({
    success: false,
    message: 'Route not found'
  });
});

// Start server
app.listen(PORT, () => {
  console.log(`Expense Tracker Server running on port ${PORT}`);
  console.log(`Year: 2025`);
  console.log(`Final Year Project: Student Financial Management System`);
  console.log(`Environment: ${process.env.NODE_ENV}`);
});

export default app;
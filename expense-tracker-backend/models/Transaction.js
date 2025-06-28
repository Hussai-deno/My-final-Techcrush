import mongoose from 'mongoose';

const transactionSchema = new mongoose.Schema({
  user: {
    type: mongoose.Schema.ObjectId,
    ref: 'User',
    required: true
  },
  type: {
    type: String,
    enum: ['income', 'expense'],
    required: [true, 'Please specify transaction type']
  },
  amount: {
    type: Number,
    required: [true, 'Please provide transaction amount'],
    min: [0.01, 'Amount must be greater than 0']
  },
  category: {
    type: String,
    required: [true, 'Please provide a category'],
    enum: [
      // Income categories
      'salary', 'freelance', 'allowance', 'scholarship', 'part-time', 'gift', 'other-income',
      // Expense categories  
      'food', 'transportation', 'education', 'entertainment', 'healthcare', 'shopping', 
      'utilities', 'rent', 'books', 'technology', 'clothing', 'other-expense'
    ]
  },
  description: {
    type: String,
    required: [true, 'Please provide a description'],
    trim: true,
    maxlength: [200, 'Description cannot exceed 200 characters']
  },
  date: {
    type: Date,
    required: [true, 'Please provide transaction date'],
    default: Date.now
  },
  paymentMethod: {
    type: String,
    enum: ['cash', 'card', 'bank-transfer', 'mobile-payment', 'other'],
    default: 'cash'
  },
  tags: [{
    type: String,
    trim: true,
    maxlength: [20, 'Tag cannot exceed 20 characters']
  }],
  isRecurring: {
    type: Boolean,
    default: false
  },
  recurringFrequency: {
    type: String,
    enum: ['daily', 'weekly', 'monthly', 'yearly'],
    required: function() {
      return this.isRecurring;
    }
  }
}, {
  timestamps: true
});

// Index for better query performance
transactionSchema.index({ user: 1, date: -1 });
transactionSchema.index({ user: 1, type: 1 });
transactionSchema.index({ user: 1, category: 1 });

export default mongoose.model('Transaction', transactionSchema);
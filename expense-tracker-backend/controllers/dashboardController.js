import Transaction from '../models/Transaction.js';
import User from '../models/User.js';
import { sendSuccessResponse, sendErrorResponse } from '../utils/responseHandler.js';

// Get dashboard overview
export const getDashboardOverview = async (req, res) => {
  try {
    const userId = req.user.id;
    const currentYear = new Date().getFullYear();
    const currentMonth = new Date().getMonth();
    
    // Get current month date range
    const startOfMonth = new Date(currentYear, currentMonth, 1);
    const endOfMonth = new Date(currentYear, currentMonth + 1, 0);

    // Get user's monthly budget
    const user = await User.findById(userId);

    // Dashboard calculations
    const [
      totalIncome,
      totalExpenses,
      monthlyIncome,
      monthlyExpenses,
      transactionCount,
      recentTransactions
    ] = await Promise.all([
      // Total income
      Transaction.aggregate([
        { $match: { user: userId, type: 'income' } },
        { $group: { _id: null, total: { $sum: '$amount' } } }
      ]),
      
      // Total expenses
      Transaction.aggregate([
        { $match: { user: userId, type: 'expense' } },
        { $group: { _id: null, total: { $sum: '$amount' } } }
      ]),
      
      // Monthly income
      Transaction.aggregate([
        { 
          $match: { 
            user: userId, 
            type: 'income',
            date: { $gte: startOfMonth, $lte: endOfMonth }
          } 
        },
        { $group: { _id: null, total: { $sum: '$amount' } } }
      ]),
      
      // Monthly expenses
      Transaction.aggregate([
        { 
          $match: { 
            user: userId, 
            type: 'expense',
            date: { $gte: startOfMonth, $lte: endOfMonth }
          } 
        },
        { $group: { _id: null, total: { $sum: '$amount' } } }
      ]),
      
      // Transaction count
      Transaction.countDocuments({ user: userId }),
      
      // Recent transactions (last 10)
      Transaction.find({ user: userId })
        .sort({ date: -1 })
        .limit(10)
        .populate('user', 'name email')
    ]);

    // Extract totals
    const totalIncomeAmount = totalIncome[0]?.total || 0;
    const totalExpenseAmount = totalExpenses[0]?.total || 0;
    const monthlyIncomeAmount = monthlyIncome[0]?.total || 0;
    const monthlyExpenseAmount = monthlyExpenses[0]?.total || 0;

    // Calculate balances and percentages
    const totalBalance = totalIncomeAmount - totalExpenseAmount;
    const monthlyBalance = monthlyIncomeAmount - monthlyExpenseAmount;
    const budgetUsed = user.monthlyBudget > 0 ? (monthlyExpenseAmount / user.monthlyBudget) * 100 : 0;
    const budgetRemaining = user.monthlyBudget - monthlyExpenseAmount;

    const dashboardData = {
      overview: {
        totalIncome: totalIncomeAmount,
        totalExpenses: totalExpenseAmount,
        totalBalance,
        monthlyIncome: monthlyIncomeAmount,
        monthlyExpenses: monthlyExpenseAmount,
        monthlyBalance,
        transactionCount,
        budgetUsed: Math.round(budgetUsed * 100) / 100,
        budgetRemaining: Math.max(0, budgetRemaining),
        monthlyBudget: user.monthlyBudget
      },
      recentTransactions,
      user: {
        name: user.name,
        email: user.email,
        studentId: user.studentId,
        university: user.university,
        monthlyBudget: user.monthlyBudget
      },
      period: {
        month: currentMonth + 1,
        year: currentYear,
        startDate: startOfMonth,
        endDate: endOfMonth
      }
    };

    return sendSuccessResponse(res, 'Dashboard data retrieved successfully', dashboardData);
  } catch (error) {
    console.error('Dashboard overview error:', error);
    return sendErrorResponse(res, 'Failed to retrieve dashboard data', 500, error.message);
  }
};

// Get expense breakdown by category
export const getExpenseBreakdown = async (req, res) => {
  try {
    const userId = req.user.id;
    const { period = 'month' } = req.query;
    
    let dateFilter = {};
    const currentDate = new Date();
    
    switch (period) {
      case 'week':
        const startOfWeek = new Date(currentDate.setDate(currentDate.getDate() - currentDate.getDay()));
        dateFilter = { date: { $gte: startOfWeek } };
        break;
      case 'month':
        const startOfMonth = new Date(currentDate.getFullYear(), currentDate.getMonth(), 1);
        dateFilter = { date: { $gte: startOfMonth } };
        break;
      case 'year':
        const startOfYear = new Date(currentDate.getFullYear(), 0, 1);
        dateFilter = { date: { $gte: startOfYear } };
        break;
      default:
        dateFilter = {};
    }

    const expenseBreakdown = await Transaction.aggregate([
      {
        $match: {
          user: userId,
          type: 'expense',
          ...dateFilter
        }
      },
      {
        $group: {
          _id: '$category',
          totalAmount: { $sum: '$amount' },
          transactionCount: { $sum: 1 },
          averageAmount: { $avg: '$amount' }
        }
      },
      {
        $sort: { totalAmount: -1 }
      }
    ]);

    // Calculate total for percentage calculation
    const totalExpenses = expenseBreakdown.reduce((sum, item) => sum + item.totalAmount, 0);

    // Add percentage to each category
    const breakdownWithPercentage = expenseBreakdown.map(item => ({
      category: item._id,
      totalAmount: item.totalAmount,
      transactionCount: item.transactionCount,
      averageAmount: Math.round(item.averageAmount * 100) / 100,
      percentage: totalExpenses > 0 ? Math.round((item.totalAmount / totalExpenses) * 100 * 100) / 100 : 0
    }));

    return sendSuccessResponse(res, 'Expense breakdown retrieved successfully', {
      breakdown: breakdownWithPercentage,
      totalExpenses,
      period
    });
  } catch (error) {
    console.error('Expense breakdown error:', error);
    return sendErrorResponse(res, 'Failed to retrieve expense breakdown', 500, error.message);
  }
};

// Get monthly trends
export const getMonthlyTrends = async (req, res) => {
  try {
    const userId = req.user.id;
    const { months = 6 } = req.query;
    
    const currentDate = new Date();
    const startDate = new Date(currentDate.getFullYear(), currentDate.getMonth() - parseInt(months), 1);

    const monthlyTrends = await Transaction.aggregate([
      {
        $match: {
          user: userId,
          date: { $gte: startDate }
        }
      },
      {
        $group: {
          _id: {
            year: { $year: '$date' },
            month: { $month: '$date' },
            type: '$type'
          },
          totalAmount: { $sum: '$amount' },
          transactionCount: { $sum: 1 }
        }
      },
      {
        $sort: { '_id.year': 1, '_id.month': 1 }
      }
    ]);

    // Format data for chart visualization
    const trendsData = [];
    const monthNames = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
    
    // Group by month
    const monthlyData = {};
    monthlyTrends.forEach(item => {
      const monthKey = `${item._id.year}-${item._id.month}`;
      if (!monthlyData[monthKey]) {
        monthlyData[monthKey] = {
          year: item._id.year,
          month: item._id.month,
          monthName: monthNames[item._id.month - 1],
          income: 0,
          expense: 0,
          incomeCount: 0,
          expenseCount: 0
        };
      }
      
      if (item._id.type === 'income') {
        monthlyData[monthKey].income = item.totalAmount;
        monthlyData[monthKey].incomeCount = item.transactionCount;
      } else {
        monthlyData[monthKey].expense = item.totalAmount;
        monthlyData[monthKey].expenseCount = item.transactionCount;
      }
    });

    // Convert to array and calculate net
    const formattedTrends = Object.values(monthlyData).map(month => ({
      ...month,
      net: month.income - month.expense,
      totalTransactions: month.incomeCount + month.expenseCount
    }));

    return sendSuccessResponse(res, 'Monthly trends retrieved successfully', {
      trends: formattedTrends,
      period: `${months} months`
    });
  } catch (error) {
    console.error('Monthly trends error:', error);
    return sendErrorResponse(res, 'Failed to retrieve monthly trends', 500, error.message);
  }
};

// Get financial insights
export const getFinancialInsights = async (req, res) => {
  try {
    const userId = req.user.id;
    const currentDate = new Date();
    const currentMonth = currentDate.getMonth();
    const currentYear = currentDate.getFullYear();

    // Current month data
    const currentMonthStart = new Date(currentYear, currentMonth, 1);
    const currentMonthEnd = new Date(currentYear, currentMonth + 1, 0);

    // Previous month data
    const prevMonthStart = new Date(currentYear, currentMonth - 1, 1);
    const prevMonthEnd = new Date(currentYear, currentMonth, 0);

    const [currentMonthData, prevMonthData, topExpenseCategories, user] = await Promise.all([
      // Current month transactions
      Transaction.aggregate([
        {
          $match: {
            user: userId,
            date: { $gte: currentMonthStart, $lte: currentMonthEnd }
          }
        },
        {
          $group: {
            _id: '$type',
            total: { $sum: '$amount' },
            count: { $sum: 1 }
          }
        }
      ]),

      // Previous month transactions
      Transaction.aggregate([
        {
          $match: {
            user: userId,
            date: { $gte: prevMonthStart, $lte: prevMonthEnd }
          }
        },
        {
          $group: {
            _id: '$type',
            total: { $sum: '$amount' },
            count: { $sum: 1 }
          }
        }
      ]),

      // Top expense categories this month
      Transaction.aggregate([
        {
          $match: {
            user: userId,
            type: 'expense',
            date: { $gte: currentMonthStart, $lte: currentMonthEnd }
          }
        },
        {
          $group: {
            _id: '$category',
            total: { $sum: '$amount' },
            count: { $sum: 1 }
          }
        },
        {
          $sort: { total: -1 }
        },
        {
          $limit: 5
        }
      ]),

      // User data
      User.findById(userId)
    ]);

    // Process current month data
    const currentIncome = currentMonthData.find(item => item._id === 'income')?.total || 0;
    const currentExpenses = currentMonthData.find(item => item._id === 'expense')?.total || 0;

    // Process previous month data
    const prevIncome = prevMonthData.find(item => item._id === 'income')?.total || 0;
    const prevExpenses = prevMonthData.find(item => item._id === 'expense')?.total || 0;

    // Calculate changes
    const incomeChange = prevIncome > 0 ? ((currentIncome - prevIncome) / prevIncome) * 100 : 0;
    const expenseChange = prevExpenses > 0 ? ((currentExpenses - prevExpenses) / prevExpenses) * 100 : 0;

    // Generate insights
    const insights = [];

    // Budget insights
    if (user.monthlyBudget > 0) {
      const budgetUsage = (currentExpenses / user.monthlyBudget) * 100;
      if (budgetUsage > 90) {
        insights.push({
          type: 'warning',
          title: 'Budget Alert',
          message: `You've used ${budgetUsage.toFixed(1)}% of your monthly budget. Consider reducing expenses.`,
          priority: 'high'
        });
      } else if (budgetUsage > 75) {
        insights.push({
          type: 'caution',
          title: 'Budget Watch',
          message: `You've used ${budgetUsage.toFixed(1)}% of your monthly budget. Monitor your spending.`,
          priority: 'medium'
        });
      }
    }

    // Expense change insights
    if (expenseChange > 20) {
      insights.push({
        type: 'warning',
        title: 'Spending Increase',
        message: `Your expenses increased by ${expenseChange.toFixed(1)}% compared to last month.`,
        priority: 'medium'
      });
    } else if (expenseChange < -10) {
      insights.push({
        type: 'success',
        title: 'Great Savings',
        message: `You reduced expenses by ${Math.abs(expenseChange).toFixed(1)}% compared to last month!`,
        priority: 'low'
      });
    }

    // Income insights
    if (incomeChange > 15) {
      insights.push({
        type: 'success',
        title: 'Income Growth',
        message: `Your income increased by ${incomeChange.toFixed(1)}% compared to last month!`,
        priority: 'low'
      });
    }

    // Top category insight
    if (topExpenseCategories.length > 0) {
      const topCategory = topExpenseCategories[0];
      const categoryPercentage = (topCategory.total / currentExpenses) * 100;
      insights.push({
        type: 'info',
        title: 'Top Expense Category',
        message: `${topCategory._id} accounts for ${categoryPercentage.toFixed(1)}% of your expenses this month.`,
        priority: 'low'
      });
    }

    const insightsData = {
      currentMonth: {
        income: currentIncome,
        expenses: currentExpenses,
        balance: currentIncome - currentExpenses
      },
      previousMonth: {
        income: prevIncome,
        expenses: prevExpenses,
        balance: prevIncome - prevExpenses
      },
      changes: {
        income: Math.round(incomeChange * 100) / 100,
        expenses: Math.round(expenseChange * 100) / 100
      },
      topExpenseCategories,
      insights,
      budgetStatus: user.monthlyBudget > 0 ? {
        budget: user.monthlyBudget,
        used: currentExpenses,
        remaining: Math.max(0, user.monthlyBudget - currentExpenses),
        percentage: Math.round((currentExpenses / user.monthlyBudget) * 100 * 100) / 100
      } : null
    };

    return sendSuccessResponse(res, 'Financial insights retrieved successfully', insightsData);
  } catch (error) {
    console.error('Financial insights error:', error);
    return sendErrorResponse(res, 'Failed to retrieve financial insights', 500, error.message);
  }
};
import User from '../models/User.js';
import { generateToken } from '../middleware/auth.js';
import { sendSuccessResponse, sendErrorResponse } from '../utils/responseHandler.js';

// Register user
export const register = async (req, res) => {
  try {
    const { name, email, password, studentId, university, monthlyBudget } = req.body;

    // Check if user already exists
    const existingUser = await User.findOne({ email });
    if (existingUser) {
      return sendErrorResponse(res, 'User already exists with this email', 400);
    }

    // Create user
    const user = await User.create({
      name,
      email,
      password,
      studentId,
      university,
      monthlyBudget: monthlyBudget || 0
    });

    // Generate token
    const token = generateToken(user._id);

    const userData = {
      user,
      token,
      expiresIn: process.env.JWT_EXPIRE
    };

    return sendSuccessResponse(res, 'User registered successfully', userData, 201);
  } catch (error) {
    console.error('Registration error:', error);
    return sendErrorResponse(res, 'Registration failed', 500, error.message);
  }
};

// Login user
export const login = async (req, res) => {
  try {
    const { email, password } = req.body;

    // Find user and include password for comparison
    const user = await User.findOne({ email }).select('+password');

    if (!user) {
      return sendErrorResponse(res, 'Invalid email or password', 401);
    }

    // Check if account is active
    if (!user.isActive) {
      return sendErrorResponse(res, 'Account is deactivated', 401);
    }

    // Verify password
    const isPasswordValid = await user.comparePassword(password);
    if (!isPasswordValid) {
      return sendErrorResponse(res, 'Invalid email or password', 401);
    }

    // Update last login
    user.lastLogin = new Date();
    await user.save();

    // Generate token
    const token = generateToken(user._id);

    // Remove password from response
    user.password = undefined;

    const userData = {
      user,
      token,
      expiresIn: process.env.JWT_EXPIRE
    };

    return sendSuccessResponse(res, 'Login successful', userData);
  } catch (error) {
    console.error('Login error:', error);
    return sendErrorResponse(res, 'Login failed', 500, error.message);
  }
};

// Get user profile
export const getProfile = async (req, res) => {
  try {
    const user = await User.findById(req.user.id);
    return sendSuccessResponse(res, 'Profile retrieved successfully', { user });
  } catch (error) {
    console.error('Get profile error:', error);
    return sendErrorResponse(res, 'Failed to retrieve profile', 500, error.message);
  }
};

// Update user profile
export const updateProfile = async (req, res) => {
  try {
    const { name, studentId, university, monthlyBudget } = req.body;

    const user = await User.findByIdAndUpdate(
      req.user.id,
      {
        ...(name && { name }),
        ...(studentId && { studentId }),
        ...(university && { university }),
        ...(monthlyBudget !== undefined && { monthlyBudget })
      },
      { new: true, runValidators: true }
    );

    return sendSuccessResponse(res, 'Profile updated successfully', { user });
  } catch (error) {
    console.error('Update profile error:', error);
    return sendErrorResponse(res, 'Failed to update profile', 500, error.message);
  }
};

// Change password
export const changePassword = async (req, res) => {
  try {
    const { currentPassword, newPassword } = req.body;

    const user = await User.findById(req.user.id).select('+password');

    // Verify current password
    const isCurrentPasswordValid = await user.comparePassword(currentPassword);
    if (!isCurrentPasswordValid) {
      return sendErrorResponse(res, 'Current password is incorrect', 400);
    }

    // Update password
    user.password = newPassword;
    await user.save();

    return sendSuccessResponse(res, 'Password changed successfully');
  } catch (error) {
    console.error('Change password error:', error);
    return sendErrorResponse(res, 'Failed to change password', 500, error.message);
  }
};
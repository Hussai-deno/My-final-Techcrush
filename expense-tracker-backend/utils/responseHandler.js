// Success response handler
export const sendSuccessResponse = (res, message, data = null, statusCode = 200) => {
  const response = {
    success: true,
    message,
    timestamp: new Date().toISOString(),
    year: 2025
  };

  if (data !== null) {
    response.data = data;
  }

  return res.status(statusCode).json(response);
};

// Error response handler
export const sendErrorResponse = (res, message, statusCode = 500, error = null) => {
  const response = {
    success: false,
    message,
    timestamp: new Date().toISOString(),
    year: 2025
  };

  if (error && process.env.NODE_ENV === 'development') {
    response.error = error;
  }

  return res.status(statusCode).json(response);
};

// Paginated response handler
export const sendPaginatedResponse = (res, message, data, pagination, statusCode = 200) => {
  return res.status(statusCode).json({
    success: true,
    message,
    data,
    pagination,
    timestamp: new Date().toISOString(),
    year: 2025
  });
};

// Global error handler middleware
export const errorHandler = (err, req, res, next) => {
  let error = { ...err };
  error.message = err.message;

  console.error('Error:', err);

  // Mongoose bad ObjectId
  if (err.name === 'CastError') {
    const message = 'Resource not found';
    return sendErrorResponse(res, message, 404);
  }

  // Mongoose duplicate key
  if (err.code === 11000) {
    const message = 'Duplicate field value entered';
    return sendErrorResponse(res, message, 400);
  }

  // Mongoose validation error
  if (err.name === 'ValidationError') {
    const message = Object.values(err.errors).map(val => val.message).join(', ');
    return sendErrorResponse(res, message, 400);
  }

  // JWT errors
  if (err.name === 'JsonWebTokenError') {
    const message = 'Invalid token';
    return sendErrorResponse(res, message, 401);
  }

  if (err.name === 'TokenExpiredError') {
    const message = 'Token expired';
    return sendErrorResponse(res, message, 401);
  }

  return sendErrorResponse(res, error.message || 'Server Error', error.statusCode || 500);
};
/**
 * Custom error classes and error handling utilities
 */

/**
 * Base API Error class
 */
export class APIError extends Error {
  constructor(message, statusCode = 500, code = null) {
    super(message);
    this.name = this.constructor.name;
    this.statusCode = statusCode;
    this.code = code;
    this.isOperational = true;

    Error.captureStackTrace(this, this.constructor);
  }
}

/**
 * Validation Error
 */
export class ValidationError extends APIError {
  constructor(message, details = null) {
    super(message, 400, "VALIDATION_ERROR");
    this.details = details;
  }
}

/**
 * Authentication Error
 */
export class AuthenticationError extends APIError {
  constructor(message = "Authentication required") {
    super(message, 401, "AUTHENTICATION_ERROR");
  }
}

/**
 * Authorization Error
 */
export class AuthorizationError extends APIError {
  constructor(message = "Access denied") {
    super(message, 403, "AUTHORIZATION_ERROR");
  }
}

/**
 * Not Found Error
 */
export class NotFoundError extends APIError {
  constructor(resource = "Resource") {
    super(`${resource} not found`, 404, "NOT_FOUND_ERROR");
  }
}

/**
 * PM2 Connection Error
 */
export class PM2Error extends APIError {
  constructor(message = "PM2 connection failed") {
    super(message, 503, "PM2_ERROR");
  }
}

/**
 * Log File Error
 */
export class LogFileError extends APIError {
  constructor(message = "Log file operation failed") {
    super(message, 500, "LOG_FILE_ERROR");
  }
}

/**
 * Error response formatter
 */
export const formatErrorResponse = (error, includeStack = false) => {
  const response = {
    success: false,
    error: error.message || "Internal server error",
    code: error.code || "UNKNOWN_ERROR",
    timestamp: new Date().toISOString(),
  };

  if (error.details) {
    response.details = error.details;
  }

  if (includeStack && error.stack) {
    response.stack = error.stack;
  }

  return response;
};

/**
 * Error handling middleware
 */
export const globalErrorHandler = (err, req, res, next) => {
  // Log error
  console.error("Global error handler:", err);

  // Default to 500 if no status code
  const statusCode = err.statusCode || 500;

  // Check if headers already sent
  if (res.headersSent) {
    return next(err);
  }

  // Format error response
  const includeStack = process.env.NODE_ENV !== "production";
  const errorResponse = formatErrorResponse(err, includeStack);

  res.status(statusCode).json(errorResponse);
};

/**
 * Async error wrapper
 */
export const catchAsync = (fn) => {
  return (req, res, next) => {
    Promise.resolve(fn(req, res, next)).catch(next);
  };
};

/**
 * Handle specific PM2 errors
 */
export const handlePM2Error = (error) => {
  if (error.message.includes("connect ENOENT")) {
    throw new PM2Error("PM2 daemon is not running. Please start PM2 first.");
  }

  if (error.message.includes("EACCES")) {
    throw new PM2Error(
      "Permission denied accessing PM2. Check user permissions."
    );
  }

  if (error.message.includes("No process found")) {
    throw new NotFoundError("PM2 process");
  }

  throw new PM2Error(`PM2 operation failed: ${error.message}`);
};

/**
 * Handle file system errors
 */
export const handleFileError = (error, filePath) => {
  if (error.code === "ENOENT") {
    throw new NotFoundError(`File: ${filePath}`);
  }

  if (error.code === "EACCES") {
    throw new LogFileError(`Permission denied accessing file: ${filePath}`);
  }

  if (error.code === "EISDIR") {
    throw new LogFileError(`Expected file but found directory: ${filePath}`);
  }

  throw new LogFileError(`File operation failed: ${error.message}`);
};

export default {
  APIError,
  ValidationError,
  AuthenticationError,
  AuthorizationError,
  NotFoundError,
  PM2Error,
  LogFileError,
  formatErrorResponse,
  globalErrorHandler,
  catchAsync,
  handlePM2Error,
  handleFileError,
};

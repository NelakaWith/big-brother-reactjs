/**
 * Helper utilities
 */

/**
 * Async wrapper for better error handling
 */
export const asyncHandler = (fn) => (req, res, next) => {
  Promise.resolve(fn(req, res, next)).catch(next);
};

/**
 * Delay/sleep utility
 */
export const delay = (ms) => new Promise((resolve) => setTimeout(resolve, ms));

/**
 * Format bytes to human readable string
 */
export const formatBytes = (bytes, decimals = 2) => {
  if (bytes === 0) return "0 Bytes";

  const k = 1024;
  const dm = decimals < 0 ? 0 : decimals;
  const sizes = ["Bytes", "KB", "MB", "GB", "TB", "PB", "EB", "ZB", "YB"];

  const i = Math.floor(Math.log(bytes) / Math.log(k));

  return parseFloat((bytes / Math.pow(k, i)).toFixed(dm)) + " " + sizes[i];
};

/**
 * Format uptime to human readable string
 */
export const formatUptime = (milliseconds) => {
  const seconds = Math.floor(milliseconds / 1000);
  const minutes = Math.floor(seconds / 60);
  const hours = Math.floor(minutes / 60);
  const days = Math.floor(hours / 24);

  if (days > 0) {
    return `${days}d ${hours % 24}h ${minutes % 60}m`;
  } else if (hours > 0) {
    return `${hours}h ${minutes % 60}m ${seconds % 60}s`;
  } else if (minutes > 0) {
    return `${minutes}m ${seconds % 60}s`;
  } else {
    return `${seconds}s`;
  }
};

/**
 * Validate environment configuration
 */
export const validateEnv = (requiredVars) => {
  const missing = requiredVars.filter((varName) => !process.env[varName]);

  if (missing.length > 0) {
    throw new Error(
      `Missing required environment variables: ${missing.join(", ")}`
    );
  }
};

/**
 * Safe JSON parse with fallback
 */
export const safeJSONParse = (str, fallback = null) => {
  try {
    return JSON.parse(str);
  } catch (error) {
    return fallback;
  }
};

/**
 * Retry function with exponential backoff
 */
export const retry = async (fn, options = {}) => {
  const { maxRetries = 3, delay: baseDelay = 1000, backoff = 2 } = options;

  let lastError;

  for (let attempt = 1; attempt <= maxRetries; attempt++) {
    try {
      return await fn();
    } catch (error) {
      lastError = error;

      if (attempt === maxRetries) {
        throw lastError;
      }

      const delayMs = baseDelay * Math.pow(backoff, attempt - 1);
      await delay(delayMs);
    }
  }
};

/**
 * Create pagination info
 */
export const createPagination = (totalItems, page, limit) => {
  const totalPages = Math.ceil(totalItems / limit);
  const hasNextPage = page < totalPages;
  const hasPrevPage = page > 1;

  return {
    page,
    limit,
    totalItems,
    totalPages,
    hasNextPage,
    hasPrevPage,
    nextPage: hasNextPage ? page + 1 : null,
    prevPage: hasPrevPage ? page - 1 : null,
  };
};

/**
 * Sanitize string for safe logging
 */
export const sanitizeForLog = (str) => {
  if (typeof str !== "string") return str;

  // Remove potential sensitive information
  return str
    .replace(/password[=:]\s*[^\s&]+/gi, "password=***")
    .replace(/token[=:]\s*[^\s&]+/gi, "token=***")
    .replace(/key[=:]\s*[^\s&]+/gi, "key=***");
};

export default {
  asyncHandler,
  delay,
  formatBytes,
  formatUptime,
  validateEnv,
  safeJSONParse,
  retry,
  createPagination,
  sanitizeForLog,
};

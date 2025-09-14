/**
 * Logging middleware
 */
import { CONFIG } from "../config/index.js";

export const requestLogger = (req, res, next) => {
  const timestamp = new Date().toISOString();
  const ip = req.ip || req.connection.remoteAddress || "unknown";
  console.log(`${timestamp}: ${req.method} ${req.url} - ${ip}`);
  next();
};

export const errorHandler = (err, req, res, next) => {
  console.error("Unhandled error:", err);

  // Don't expose error details in production
  const isProduction = CONFIG.server.env === "production";

  res.status(err.status || 500).json({
    success: false,
    error: isProduction ? "Internal server error" : err.message,
    ...(isProduction ? {} : { stack: err.stack }),
  });
};

export const notFoundHandler = (req, res) => {
  res.status(404).json({
    success: false,
    error: "Endpoint not found",
    path: req.originalUrl,
  });
};

export default {
  requestLogger,
  errorHandler,
  notFoundHandler,
};

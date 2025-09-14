/**
 * Security middleware configuration
 */
import helmet from "helmet";
import rateLimit from "express-rate-limit";
import { CONFIG } from "../config/index.js";

// Helmet security middleware
export const securityMiddleware = helmet();

// Rate limiting middleware
export const rateLimitMiddleware = rateLimit({
  windowMs: CONFIG.rateLimit.windowMs,
  max: CONFIG.rateLimit.max,
  message: {
    success: false,
    error: CONFIG.rateLimit.message,
  },
  standardHeaders: true,
  legacyHeaders: false,
});

export default {
  security: securityMiddleware,
  rateLimit: rateLimitMiddleware,
};

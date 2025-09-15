/**
 * CORS middleware configuration
 */
import cors from "cors";
import { CONFIG } from "../config/index.js";

// Define allowed origins for different environments
const getAllowedOrigins = () => {
  const baseOrigins = [
    "http://localhost:3000", // Local development frontend
    "http://localhost:3006", // Local production frontend
    "https://bigbro.nelakawithanage.com", // Production domain
  ];

  // Add any additional origin from environment variable without mutating the original array
  if (CONFIG.cors.origin && !baseOrigins.includes(CONFIG.cors.origin)) {
    return [...baseOrigins, CONFIG.cors.origin];
  }

  return baseOrigins;
};

export const corsMiddleware = cors({
  origin: (origin, callback) => {
    const allowedOrigins = getAllowedOrigins();

    // Allow requests with no origin (like mobile apps or curl requests)
    if (!origin) return callback(null, true);

    if (allowedOrigins.includes(origin)) {
      callback(null, true);
    } else {
      // Only log detailed CORS information in development
      if (process.env.NODE_ENV === "development") {
        console.log(`🚫 CORS blocked origin: ${origin}`);
        console.log(`✅ Allowed origins: ${allowedOrigins.join(", ")}`);
      } else {
        // Generic production logging without exposing sensitive information
        console.warn("CORS: Request blocked from unauthorized origin");
      }

      callback(new Error("Not allowed by CORS"));
    }
  },
  credentials: CONFIG.cors.credentials,
});

export default corsMiddleware;

// Middleware that explicitly echoes back the validated origin and handles
// preflight (OPTIONS) requests. This helps ensure any manual header writes
// or proxies don't cause Access-Control-Allow-Origin to be a stale value.
export const corsEchoMiddleware = (req, res, next) => {
  const origin = req.headers.origin;
  const allowedOrigins = getAllowedOrigins();

  // Allow non-browser requests without Origin header
  if (!origin) return next();

  if (allowedOrigins.includes(origin)) {
    res.setHeader("Access-Control-Allow-Origin", origin);
    res.setHeader(
      "Access-Control-Allow-Credentials",
      String(CONFIG.cors.credentials)
    );
    res.setHeader(
      "Access-Control-Allow-Headers",
      "Origin, X-Requested-With, Content-Type, Accept, Authorization"
    );
    res.setHeader(
      "Access-Control-Allow-Methods",
      "GET,POST,PUT,DELETE,OPTIONS"
    );

    if (req.method === "OPTIONS") {
      // Short-circuit preflight
      return res.sendStatus(204);
    }
  }

  return next();
};

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

  // Add any additional origin from environment variable
  if (CONFIG.cors.origin && !baseOrigins.includes(CONFIG.cors.origin)) {
    baseOrigins.push(CONFIG.cors.origin);
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
      console.log(`🚫 CORS blocked origin: ${origin}`);
      console.log(`✅ Allowed origins: ${allowedOrigins.join(", ")}`);
      callback(new Error("Not allowed by CORS"));
    }
  },
  credentials: CONFIG.cors.credentials,
});

export default corsMiddleware;

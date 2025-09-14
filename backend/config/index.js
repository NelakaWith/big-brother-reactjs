/**
 * Centralized configuration management
 */
import { config } from "dotenv";

// Load environment variables
config();

export const CONFIG = {
  // Server configuration
  server: {
    port: parseInt(process.env.PORT) || 3001,
    host: process.env.HOST || "localhost",
    env: process.env.NODE_ENV || "development",
  },

  // Authentication configuration
  auth: {
    username: process.env.AUTH_USERNAME || "admin",
    password: process.env.AUTH_PASSWORD || "admin123",
    realm: "Big Brother Dashboard",
  },

  // CORS configuration
  cors: {
    origin: process.env.FRONTEND_URL || "http://localhost:3000",
    credentials: true,
  },

  // Rate limiting configuration
  rateLimit: {
    windowMs: 15 * 60 * 1000, // 15 minutes
    max: 100, // limit each IP to 100 requests per windowMs
    message: "Too many requests from this IP",
  },

  // Logging configuration
  logging: {
    level: process.env.LOG_LEVEL || "info",
    maxLogLines: parseInt(process.env.MAX_LOG_LINES) || 2000,
    defaultLogLines: parseInt(process.env.DEFAULT_LOG_LINES) || 500,
  },

  // PM2 configuration
  pm2: {
    maxRetries: parseInt(process.env.PM2_MAX_RETRIES) || 3,
    retryDelay: parseInt(process.env.PM2_RETRY_DELAY) || 1000,
  },

  // Log file paths
  logPaths: {
    development: ["frontend/logs", "logs", "backend/logs"],
    production: [
      "/opt/big-brother/logs",
      "/opt/big-brother/frontend/logs",
      "/opt/big-brother/backend/logs",
      "/var/log/myapps",
    ],
    pm2: [`${process.env.HOME || process.env.USERPROFILE}/.pm2/logs`],
  },

  // Application metadata
  app: {
    name: "Big Brother Backend",
    version: process.env.npm_package_version || "1.0.0",
    description: "VPS Monitoring Dashboard Backend API",
  },
};

// Validation function
export const validateConfig = () => {
  const errors = [];

  if (!CONFIG.server.port || isNaN(CONFIG.server.port)) {
    errors.push("Invalid or missing PORT configuration");
  }

  if (!CONFIG.auth.username || !CONFIG.auth.password) {
    errors.push("Missing authentication credentials");
  }

  if (!CONFIG.cors.origin) {
    errors.push("Missing FRONTEND_URL configuration");
  }

  if (errors.length > 0) {
    throw new Error(`Configuration validation failed:\n${errors.join("\n")}`);
  }

  return true;
};

export default CONFIG;

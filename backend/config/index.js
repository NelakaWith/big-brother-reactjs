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
    jwtSecret: process.env.JWT_SECRET,
    jwtAccessExpiry: process.env.JWT_ACCESS_EXPIRY || "30m",
    jwtRefreshExpiry: process.env.JWT_REFRESH_EXPIRY || "7d",
    adminUsername: process.env.ADMIN_USERNAME,
    adminPasswordHash: process.env.ADMIN_PASSWORD_HASH,
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

  // Database configuration
  database: {
    path: process.env.DATABASE_PATH || "./data/bigbrother.db",
    backupPath: process.env.DATABASE_BACKUP_PATH || "./data/backups",
    enableMetricsCollection: process.env.DB_ENABLE_METRICS !== "false",
    metricsInterval: parseInt(process.env.DB_METRICS_INTERVAL) || 60000, // 1 minute
    logRetentionDays: parseInt(process.env.DB_LOG_RETENTION_DAYS) || 30,
    metricsRetentionDays: parseInt(process.env.DB_METRICS_RETENTION_DAYS) || 90,
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

  if (!CONFIG.auth.jwtSecret) {
    errors.push("Missing JWT_SECRET configuration");
  }

  if (!CONFIG.auth.adminUsername) {
    errors.push("Missing ADMIN_USERNAME configuration");
  }

  if (!CONFIG.auth.adminPasswordHash) {
    errors.push("Missing ADMIN_PASSWORD_HASH configuration");
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

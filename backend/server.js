/**
 * Big Brother Backend Server
 * VPS Monitoring Dashboard API
 */
import express from "express";
import { CONFIG, validateConfig } from "./config/index.js";
import {
  corsMiddleware,
  securityMiddleware,
  rateLimitMiddleware,
  authenticate,
  requestLogger,
  errorHandler,
  notFoundHandler,
} from "./middleware/index.js";
import {
  appsRoutes,
  logsRoutes,
  frontendLogsRoutes,
  healthRoutes,
} from "./routes/index.js";
import { logService, pm2Service } from "./services/index.js";

// Validate configuration
try {
  validateConfig();
  console.log("✅ Configuration validated successfully");
} catch (error) {
  console.error("❌ Configuration validation failed:", error.message);
  process.exit(1);
}

// Create Express app
const app = express();

// Security middleware
app.use(securityMiddleware);
app.use(corsMiddleware);
app.use(rateLimitMiddleware);

// Body parsing middleware
app.use(express.json({ limit: "10mb" }));
app.use(express.urlencoded({ extended: true, limit: "10mb" }));

// Request logging middleware
app.use(requestLogger);

// Public health check (no authentication required)
app.use("/api/health", healthRoutes);

// Authentication middleware for all other API routes
app.use("/api", authenticate);

// API Routes
app.use("/api/apps", appsRoutes);
app.use("/api/logs", logsRoutes);
app.use("/api/frontend-logs", frontendLogsRoutes);

// Root endpoint
app.get("/", (req, res) => {
  res.json({
    success: true,
    message: "Big Brother Backend API",
    version: CONFIG.app.version,
    description: CONFIG.app.description,
    timestamp: new Date().toISOString(),
    endpoints: {
      health: "/api/health",
      apps: "/api/apps",
      logs: "/api/logs/:appName",
      historicalLogs: "/api/logs/:appName/historical",
      frontendLogs: "/api/frontend-logs/:appName",
    },
  });
});

// 404 handler
app.use(notFoundHandler);

// Global error handler
app.use(errorHandler);

// Graceful shutdown handlers
const gracefulShutdown = (signal) => {
  console.log(`\nReceived ${signal}, shutting down gracefully...`);

  // Cleanup log service
  logService.cleanup();

  // Disconnect from PM2
  pm2Service.disconnect();

  // Close server
  server.close(() => {
    console.log("✅ Server closed successfully");
    process.exit(0);
  });

  // Force exit after 10 seconds
  setTimeout(() => {
    console.error("❌ Forcing server shutdown...");
    process.exit(1);
  }, 10000);
};

// Handle shutdown signals
process.on("SIGINT", () => gracefulShutdown("SIGINT"));
process.on("SIGTERM", () => gracefulShutdown("SIGTERM"));

// Handle uncaught exceptions
process.on("uncaughtException", (err) => {
  console.error("Uncaught Exception:", err);
  gracefulShutdown("uncaughtException");
});

// Handle unhandled promise rejections
process.on("unhandledRejection", (reason, promise) => {
  console.error("Unhandled Rejection at:", promise, "reason:", reason);
  gracefulShutdown("unhandledRejection");
});

// Start server
const server = app.listen(CONFIG.server.port, CONFIG.server.host, () => {
  console.log("\n🚀 Big Brother Backend API Started");
  console.log("=====================================");
  console.log(`📡 Server: http://${CONFIG.server.host}:${CONFIG.server.port}`);
  console.log(`🌍 Environment: ${CONFIG.server.env}`);
  console.log(
    `🔐 Auth: ${CONFIG.auth.username}/${CONFIG.auth.password.replace(
      /./g,
      "*"
    )}`
  );
  console.log(`🎯 Frontend: ${CONFIG.cors.origin}`);
  console.log(`📦 Version: ${CONFIG.app.version}`);
  console.log(`🕐 Started: ${new Date().toISOString()}`);
  console.log("=====================================\n");
});

export default app;

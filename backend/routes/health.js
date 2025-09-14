/**
 * Health routes - System health monitoring
 */
import { Router } from "express";
import { CONFIG } from "../config/index.js";

const router = Router();

/**
 * GET /api/health
 * System health check endpoint
 */
router.get("/", (req, res) => {
  const healthData = {
    success: true,
    status: "healthy",
    uptime: process.uptime(),
    memory: process.memoryUsage(),
    timestamp: new Date().toISOString(),
    version: CONFIG.app.version,
    environment: CONFIG.server.env,
    node_version: process.version,
    platform: process.platform,
    pid: process.pid,
  };

  res.json(healthData);
});

/**
 * GET /api/health/detailed
 * Detailed system health information
 */
router.get("/detailed", (req, res) => {
  const memoryUsage = process.memoryUsage();
  const cpuUsage = process.cpuUsage();

  const healthData = {
    success: true,
    status: "healthy",
    timestamp: new Date().toISOString(),
    system: {
      uptime: process.uptime(),
      node_version: process.version,
      platform: process.platform,
      arch: process.arch,
      pid: process.pid,
      ppid: process.ppid,
    },
    memory: {
      rss: memoryUsage.rss,
      heapTotal: memoryUsage.heapTotal,
      heapUsed: memoryUsage.heapUsed,
      external: memoryUsage.external,
      arrayBuffers: memoryUsage.arrayBuffers,
      // Human readable format
      rss_mb: Math.round((memoryUsage.rss / 1024 / 1024) * 100) / 100,
      heapTotal_mb:
        Math.round((memoryUsage.heapTotal / 1024 / 1024) * 100) / 100,
      heapUsed_mb: Math.round((memoryUsage.heapUsed / 1024 / 1024) * 100) / 100,
    },
    cpu: {
      user: cpuUsage.user,
      system: cpuUsage.system,
    },
    config: {
      environment: CONFIG.server.env,
      port: CONFIG.server.port,
      version: CONFIG.app.version,
      name: CONFIG.app.name,
    },
  };

  res.json(healthData);
});

export default router;

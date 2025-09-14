/**
 * Dashboard routes - Consolidated dashboard data
 */
import { Router } from "express";
import { pm2Service } from "../services/index.js";
import ApplicationModel from "../models/Application.js";
import MetricsModel from "../models/Metrics.js";
import LogModel from "../models/Log.js";

const router = Router();

/**
 * GET /api/dashboard
 * Get consolidated dashboard data
 */
router.get("/", async (req, res) => {
  try {
    // Get PM2 apps
    const pm2Apps = await pm2Service.getFormattedProcessList();

    // Get database applications
    const dbApplications = await ApplicationModel.getAll();

    // Get recent metrics (latest for all apps)
    const recentMetrics = await MetricsModel.getLatestForAllApps();

    // Get recent logs
    const recentLogs = await LogModel.getRecent(100); // Last 100 logs

    // Calculate system stats
    const systemStats = {
      totalApps: pm2Apps.length,
      onlineApps: pm2Apps.filter((app) => app.status === "online").length,
      totalMemory: pm2Apps.reduce((sum, app) => sum + (app.memory || 0), 0),
      avgCpu:
        pm2Apps.length > 0
          ? pm2Apps.reduce((sum, app) => sum + (app.cpu || 0), 0) /
            pm2Apps.length
          : 0,
      totalRestarts: pm2Apps.reduce(
        (sum, app) => sum + (app.restart_time || 0),
        0
      ),
      dbApplicationsCount: dbApplications.length,
      recentMetricsCount: recentMetrics.length,
      recentLogsCount: recentLogs.length,
    };

    res.json({
      success: true,
      data: {
        apps: pm2Apps,
        applications: dbApplications,
        metrics: recentMetrics,
        logs: recentLogs,
        systemStats,
      },
      timestamp: new Date().toISOString(),
    });
  } catch (error) {
    console.error("Error fetching dashboard data:", error);
    res.status(500).json({
      success: false,
      error: "Failed to fetch dashboard data",
      message: error.message,
    });
  }
});

/**
 * GET /api/dashboard/system-stats
 * Get system statistics only
 */
router.get("/system-stats", async (req, res) => {
  try {
    const apps = await pm2Service.getFormattedProcessList();

    const systemStats = {
      totalApps: apps.length,
      onlineApps: apps.filter((app) => app.status === "online").length,
      totalMemory: apps.reduce((sum, app) => sum + (app.memory || 0), 0),
      avgCpu:
        apps.length > 0
          ? apps.reduce((sum, app) => sum + (app.cpu || 0), 0) / apps.length
          : 0,
      totalRestarts: apps.reduce(
        (sum, app) => sum + (app.restart_time || 0),
        0
      ),
      uptime: process.uptime(),
    };

    res.json({
      success: true,
      data: systemStats,
      timestamp: new Date().toISOString(),
    });
  } catch (error) {
    console.error("Error fetching system stats:", error);
    res.status(500).json({
      success: false,
      error: "Failed to fetch system statistics",
      message: error.message,
    });
  }
});

export default router;

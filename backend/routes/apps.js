/**
 * Apps routes - PM2 application management
 */
import { Router } from "express";
import { pm2Service } from "../services/index.js";

const router = Router();

/**
 * GET /api/apps
 * Get all PM2 applications
 */
router.get("/", async (req, res) => {
  try {
    const apps = await pm2Service.getFormattedProcessList();

    res.json({
      success: true,
      apps,
      count: apps.length,
      timestamp: new Date().toISOString(),
    });
  } catch (error) {
    console.error("Error fetching PM2 apps:", error);
    res.status(500).json({
      success: false,
      error: "Failed to fetch PM2 applications",
      message: error.message,
    });
  }
});

/**
 * GET /api/apps/:name
 * Get specific application details
 */
router.get("/:name", async (req, res) => {
  try {
    const { name } = req.params;
    const process = await pm2Service.findProcess(name);

    if (!process) {
      return res.status(404).json({
        success: false,
        error: "Application not found",
      });
    }

    res.json({
      success: true,
      app: pm2Service.formatProcessInfo(process),
      timestamp: new Date().toISOString(),
    });
  } catch (error) {
    console.error("Error fetching app details:", error);
    res.status(500).json({
      success: false,
      error: "Failed to fetch application details",
      message: error.message,
    });
  }
});

/**
 * POST /api/apps/:name/restart
 * Restart specific application
 */
router.post("/:name/restart", async (req, res) => {
  try {
    const { name } = req.params;
    const result = await pm2Service.restartProcess(name);

    res.json({
      success: true,
      ...result,
      timestamp: new Date().toISOString(),
    });
  } catch (error) {
    console.error("Error restarting application:", error);
    res.status(500).json({
      success: false,
      error: "Failed to restart application",
      message: error.message,
    });
  }
});

/**
 * POST /api/apps/:name/stop
 * Stop specific application
 */
router.post("/:name/stop", async (req, res) => {
  try {
    const { name } = req.params;
    const result = await pm2Service.stopProcess(name);

    res.json({
      success: true,
      ...result,
      timestamp: new Date().toISOString(),
    });
  } catch (error) {
    console.error("Error stopping application:", error);
    res.status(500).json({
      success: false,
      error: "Failed to stop application",
      message: error.message,
    });
  }
});

export default router;

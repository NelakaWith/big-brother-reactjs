/**
 * Frontend logs routes - Frontend log viewing
 */
import { Router } from "express";
import { logService } from "../services/index.js";

const router = Router();

/**
 * GET /api/frontend-logs/:appName
 * Get frontend logs from file system
 */
router.get("/:appName", async (req, res) => {
  try {
    const { appName } = req.params;
    const options = {
      lines: parseInt(req.query.lines) || undefined,
      offset: parseInt(req.query.offset) || undefined,
    };

    const result = await logService.getFrontendLogs(appName, options);

    res.json({
      success: true,
      ...result,
      timestamp: new Date().toISOString(),
    });
  } catch (error) {
    console.error("Error reading frontend logs:", error);
    res.status(500).json({
      success: false,
      error: "Failed to read log file",
      message: error.message,
    });
  }
});

export default router;

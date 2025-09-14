/**
 * Logs routes - Log viewing and streaming
 */
import { Router } from "express";
import { logService, pm2Service } from "../services/index.js";

const router = Router();

/**
 * GET /api/logs/:appName
 * Server-Sent Events for live PM2 logs
 */
router.get("/:appName", async (req, res) => {
  const { appName } = req.params;

  // Create SSE response
  logService.createSSEResponse(res, appName);

  let logStream;
  let logOutListener;
  let logErrListener;

  try {
    // Launch PM2 bus for real-time logs
    logStream = await pm2Service.launchBus();

    // Create listener functions that we can properly remove later
    logOutListener = (packet) => {
      if (packet.process.name === appName) {
        logService.sendSSELog(res, {
          type: "log",
          level: "info",
          message: packet.data,
          timestamp: new Date().toISOString(),
          process: packet.process.name,
        });
      }
    };

    logErrListener = (packet) => {
      if (packet.process.name === appName) {
        logService.sendSSELog(res, {
          type: "log",
          level: "error",
          message: packet.data,
          timestamp: new Date().toISOString(),
          process: packet.process.name,
        });
      }
    };

    logStream.on("log:out", logOutListener);
    logStream.on("log:err", logErrListener);
  } catch (error) {
    logService.sendSSEError(res, `Failed to connect to PM2: ${error.message}`);
    pm2Service.disconnect();
    return;
  }

  // Handle client disconnect
  req.on("close", () => {
    if (logStream && logOutListener && logErrListener) {
      try {
        // Remove specific listeners
        logStream.removeListener("log:out", logOutListener);
        logStream.removeListener("log:err", logErrListener);
        console.log(`Cleaned up log listeners for ${appName}`);
      } catch (error) {
        console.error("Error cleaning up log stream:", error.message);
      }
    }
    pm2Service.disconnect();
  });
});

/**
 * GET /api/logs/:appName/historical
 * Get historical PM2 logs from file system
 */
router.get("/:appName/historical", async (req, res) => {
  try {
    const { appName } = req.params;
    const options = {
      lines: parseInt(req.query.lines) || undefined,
      offset: parseInt(req.query.offset) || undefined,
    };

    const result = await logService.getHistoricalLogs(appName, options);

    res.json({
      success: true,
      ...result,
      timestamp: new Date().toISOString(),
    });
  } catch (error) {
    console.error("Error reading historical PM2 logs:", error);

    if (error.message.includes("not found")) {
      res.status(404).json({
        success: false,
        error: "PM2 log file not found",
        message: error.message,
      });
    } else {
      res.status(500).json({
        success: false,
        error: "Failed to read PM2 log file",
        message: error.message,
      });
    }
  }
});

export default router;

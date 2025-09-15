/**
 * Log Service - Handles log file operations
 */
import fs from "fs-extra";
import path from "path";
import os from "os";
import { CONFIG } from "../config/index.js";
import pm2Service from "./pm2Service.js";

class LogService {
  constructor() {
    this.activeTails = new Map();
    this.maxLogLines = CONFIG.logging.maxLogLines;
    this.defaultLogLines = CONFIG.logging.defaultLogLines;
  }

  /**
   * Get possible log file paths based on environment
   */
  getLogPaths(appName, logType = "backend") {
    const { env } = CONFIG.server;
    const basePaths = CONFIG.logPaths[env] || CONFIG.logPaths.development;
    const pm2Paths = CONFIG.logPaths.pm2;

    const possiblePaths = [];

    // Add base paths with different log file naming conventions
    basePaths.forEach((basePath) => {
      possiblePaths.push(
        path.join(basePath, `${appName}.log`),
        path.join(basePath, `${appName}-${logType}.log`),
        path.join(basePath, `${appName}-out-0.log`),
        path.join(basePath, `${appName}-${logType}-out-0.log`)
      );
    });

    // Add PM2 specific paths
    pm2Paths.forEach((pm2Path) => {
      possiblePaths.push(
        path.join(pm2Path, `${appName}-out-0.log`),
        path.join(pm2Path, `${appName}-${logType}-out-0.log`),
        path.join(pm2Path, `${appName}-error-0.log`)
      );
    });

    return possiblePaths;
  }

  /**
   * Find existing log file
   */
  async findLogFile(appName, logType = "backend") {
    const possiblePaths = this.getLogPaths(appName, logType);

    for (const possiblePath of possiblePaths) {
      try {
        if (await fs.pathExists(possiblePath)) {
          return possiblePath;
        }
      } catch (error) {
        // Continue to next path
        continue;
      }
    }

    return null;
  }

  /**
   * Read log file content with pagination
   */
  async readLogFile(filePath, options = {}) {
    const { lines = this.defaultLogLines, offset = 0 } = options;

    try {
      const logContent = await fs.readFile(filePath, "utf8");
      const allLines = logContent.split("\n").filter((line) => line.trim());

      // Calculate pagination
      const requestedLines = Math.min(lines, this.maxLogLines);
      const startIndex = Math.max(0, allLines.length - requestedLines - offset);
      const endIndex = allLines.length - offset;
      const selectedLines = allLines.slice(startIndex, endIndex);

      return {
        logs: selectedLines,
        totalLines: allLines.length,
        requestedLines,
        returnedLines: selectedLines.length,
        hasMore: startIndex > 0,
        file: filePath,
      };
    } catch (error) {
      throw new Error(`Failed to read log file: ${error.message}`);
    }
  }

  /**
   * Parse PM2 log format
   */
  parsePM2LogFormat(lines, startIndex = 0) {
    return lines.map((line, index) => {
      // PM2 log format: 0|app_name | timestamp: message
      const pm2Match = line.match(/^\d+\|[^|]+\|\s*(.+):\s*(.+)$/);

      if (pm2Match) {
        const [, timestamp, message] = pm2Match;
        return {
          id: startIndex + index,
          type: "log",
          level: this.determineLogLevel(message),
          message: message.trim(),
          timestamp: timestamp.trim(),
          raw: line,
        };
      }

      // Fallback for non-PM2 format lines
      return {
        id: startIndex + index,
        type: "log",
        level: "info",
        message: line,
        timestamp: new Date().toISOString(),
        raw: line,
      };
    });
  }

  /**
   * Determine log level from message content
   */
  determineLogLevel(message) {
    const lowerMessage = message.toLowerCase();

    if (lowerMessage.includes("error")) return "error";
    if (lowerMessage.includes("warn")) return "warn";
    if (lowerMessage.includes("debug")) return "debug";

    return "info";
  }

  /**
   * Get frontend logs with fallback messages
   */
  async getFrontendLogs(appName, options = {}) {
    const logPath = await this.findLogFile(appName, "frontend");

    if (!logPath) {
      // Try to get frontend process info from PM2
      try {
        const processList = await pm2Service.getProcessList();
        const frontendProcess = processList.find(
          (proc) =>
            proc.name === "big-brother-frontend" ||
            proc.name.includes("frontend") ||
            proc.name === appName
        );

        if (frontendProcess) {
          const formattedProcess =
            pm2Service.formatProcessInfo(frontendProcess);
          return {
            logs: [
              `Frontend process found in PM2: ${frontendProcess.name}`,
              `Status: ${formattedProcess.status}`,
              `PID: ${formattedProcess.pid}`,
              `Uptime: ${Math.floor(formattedProcess.uptime / 1000)}s`,
              `Memory: ${Math.floor(formattedProcess.memory / 1024 / 1024)}MB`,
              `CPU: ${formattedProcess.cpu}%`,
              "",
              "To view live frontend logs, use the 'Historical' tab for the frontend process,",
              `or check the PM2 logs directly with: pm2 logs ${frontendProcess.name}`,
              "",
              "For detailed frontend logs in development:",
              "- Check the browser developer console (F12)",
              "- Check the terminal where you started the frontend",
              "- Use 'Historical' logs tab if frontend is running via PM2",
            ],
            totalLines: 13,
            requestedLines: 13,
            returnedLines: 13,
            hasMore: false,
            file: "PM2 process information",
          };
        } else {
          const searchedPaths = this.getLogPaths(appName, "frontend").slice(
            0,
            5
          );
          return {
            logs: [
              "No frontend log file found.",
              "Frontend process not found in PM2.",
              "",
              "Frontend logs in development are typically found in:",
              "- Browser developer console (F12 → Console tab)",
              "- Terminal window where you started 'npm run dev'",
              "- PM2 logs if frontend is running via PM2",
              "",
              "For production environments, frontend logs will be available here.",
              `Searched paths: ${searchedPaths.join(", ")}`,
            ],
            totalLines: 10,
            requestedLines: 10,
            returnedLines: 10,
            hasMore: false,
            file: "No log file found",
          };
        }
      } catch (error) {
        const searchedPaths = this.getLogPaths(appName, "frontend").slice(0, 5);
        return {
          logs: [
            "No frontend log file found.",
            "Frontend logs are typically available only in production environments.",
            "For development, check the console output in your terminal or browser developer tools.",
            `Searched paths: ${searchedPaths.join(", ")}`,
          ],
          totalLines: 4,
          requestedLines: 4,
          returnedLines: 4,
          hasMore: false,
          file: "No log file found",
        };
      }
    }

    return await this.readLogFile(logPath, options);
  }

  /**
   * Get historical PM2 logs
   */
  async getHistoricalLogs(appName, options = {}) {
    const logPath = await this.findLogFile(appName, "backend");

    if (!logPath) {
      const searchedPaths = this.getLogPaths(appName, "backend");
      throw new Error(
        `PM2 log file not found. Searched paths: ${searchedPaths.join(", ")}`
      );
    }

    const result = await this.readLogFile(logPath, options);

    // Parse PM2 format if it's a PM2 log file
    if (logPath.includes(".pm2") || logPath.includes("-out-")) {
      const startIndex = result.totalLines - result.returnedLines;
      result.logs = this.parsePM2LogFormat(result.logs, startIndex);
    }

    return result;
  }

  /**
   * Create SSE log stream response
   */
  createSSEResponse(res, appName) {
    // Set SSE headers; CORS origin and credentials are handled by the corsEchoMiddleware
    res.writeHead(200, {
      "Content-Type": "text/event-stream",
      "Cache-Control": "no-cache",
      Connection: "keep-alive",
    });

    // Send initial connection message
    res.write(
      `data: ${JSON.stringify({
        type: "connected",
        message: `Connected to logs for ${appName}`,
      })}\n\n`
    );

    return res;
  }

  /**
   * Send SSE log message
   */
  sendSSELog(res, logData) {
    res.write(`data: ${JSON.stringify(logData)}\n\n`);
  }

  /**
   * Send SSE error message
   */
  sendSSEError(res, message) {
    res.write(
      `data: ${JSON.stringify({
        type: "error",
        message,
      })}\n\n`
    );
  }

  /**
   * Cleanup method for active tails
   */
  cleanup() {
    this.activeTails.forEach((tail) => {
      try {
        tail.unwatch();
      } catch (err) {
        console.error("Error closing tail:", err);
      }
    });
    this.activeTails.clear();
  }
}

// Create singleton instance
const logService = new LogService();

export default logService;
export { LogService };

const express = require("express");
const cors = require("cors");
const basicAuth = require("basic-auth");
const helmet = require("helmet");
const rateLimit = require("express-rate-limit");
const pm2 = require("pm2");
const fs = require("fs-extra");
const path = require("path");
const os = require("os");
const { Tail } = require("tail");

const app = express();
const PORT = process.env.PORT || 3001;

// Security middleware
app.use(helmet());
app.use(
  cors({
    origin: process.env.FRONTEND_URL || "http://localhost:3000",
    credentials: true,
  })
);

// Rate limiting
const limiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 100, // limit each IP to 100 requests per windowMs
});
app.use(limiter);

app.use(express.json());

// Request logging middleware
app.use((req, res, next) => {
  const timestamp = new Date().toISOString();
  console.log(`${timestamp}: ${req.method} ${req.url} - ${req.ip}`);
  next();
});

// Authentication middleware
const authenticate = (req, res, next) => {
  const credentials = basicAuth(req);
  const validUsername = process.env.AUTH_USERNAME || "admin";
  const validPassword = process.env.AUTH_PASSWORD || "admin123";

  if (
    !credentials ||
    credentials.name !== validUsername ||
    credentials.pass !== validPassword
  ) {
    res.set("WWW-Authenticate", 'Basic realm="Big Brother Dashboard"');
    return res.status(401).json({ error: "Authentication required" });
  }

  next();
};

// Apply authentication to all API routes
app.use("/api", authenticate);

// Store active log tails
const activeTails = new Map();

// Helper function to get PM2 process list
const getPM2ProcessList = () => {
  return new Promise((resolve, reject) => {
    pm2.connect((err) => {
      if (err) {
        console.error("PM2 connection error:", err);
        return reject(err);
      }

      pm2.list((err, list) => {
        pm2.disconnect();
        if (err) {
          console.error("PM2 list error:", err);
          return reject(err);
        }
        resolve(list);
      });
    });
  });
};

// Helper function to format process info
const formatProcessInfo = (proc) => {
  const monit = proc.monit || {};
  const pm2_env = proc.pm2_env || {};

  return {
    name: proc.name,
    pid: proc.pid,
    pm_id: proc.pm_id,
    status: proc.pm2_env?.status || "unknown",
    memory: monit.memory || 0,
    cpu: monit.cpu || 0,
    uptime: pm2_env.pm_uptime ? Date.now() - pm2_env.pm_uptime : 0,
    restart_time: pm2_env.restart_time || 0,
    port: pm2_env.PORT || pm2_env.port || null,
    script: pm2_env.pm_exec_path || pm2_env.script || null,
    instances: pm2_env.instances || 1,
    exec_mode: pm2_env.exec_mode || "fork",
    node_version: pm2_env.node_version || null,
    created_at: pm2_env.created_at || null,
    unstable_restarts: pm2_env.unstable_restarts || 0,
  };
};

// API Routes

// Get all PM2 apps
app.get("/api/apps", async (req, res) => {
  try {
    const processList = await getPM2ProcessList();
    const formattedList = processList.map(formatProcessInfo);

    res.json({
      success: true,
      apps: formattedList,
      count: formattedList.length,
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

// Get specific app details
app.get("/api/apps/:name", async (req, res) => {
  try {
    const { name } = req.params;
    const processList = await getPM2ProcessList();
    const app = processList.find((proc) => proc.name === name);

    if (!app) {
      return res.status(404).json({
        success: false,
        error: "Application not found",
      });
    }

    res.json({
      success: true,
      app: formatProcessInfo(app),
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

// Server-Sent Events for live PM2 logs
app.get("/api/logs/:appName", (req, res) => {
  const { appName } = req.params;

  // Set SSE headers
  res.writeHead(200, {
    "Content-Type": "text/event-stream",
    "Cache-Control": "no-cache",
    Connection: "keep-alive",
    "Access-Control-Allow-Origin":
      process.env.FRONTEND_URL || "http://localhost:3000",
    "Access-Control-Allow-Credentials": "true",
  });

  // Send initial connection message
  res.write(
    `data: ${JSON.stringify({
      type: "connected",
      message: `Connected to logs for ${appName}`,
    })}\n\n`
  );

  let logStream;
  let logOutListener;
  let logErrListener;

  pm2.connect((err) => {
    if (err) {
      res.write(
        `data: ${JSON.stringify({
          type: "error",
          message: "Failed to connect to PM2",
        })}\n\n`
      );
      return;
    }

    // Get real-time logs from PM2
    pm2.launchBus((err, bus) => {
      if (err) {
        res.write(
          `data: ${JSON.stringify({
            type: "error",
            message: "Failed to launch PM2 bus",
          })}\n\n`
        );
        pm2.disconnect();
        return;
      }

      // Create listener functions that we can properly remove later
      logOutListener = (packet) => {
        if (packet.process.name === appName) {
          res.write(
            `data: ${JSON.stringify({
              type: "log",
              level: "info",
              message: packet.data,
              timestamp: new Date().toISOString(),
              process: packet.process.name,
            })}\n\n`
          );
        }
      };

      logErrListener = (packet) => {
        if (packet.process.name === appName) {
          res.write(
            `data: ${JSON.stringify({
              type: "log",
              level: "error",
              message: packet.data,
              timestamp: new Date().toISOString(),
              process: packet.process.name,
            })}\n\n`
          );
        }
      };

      bus.on("log:out", logOutListener);
      bus.on("log:err", logErrListener);

      logStream = bus;
    });
  });

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
    try {
      pm2.disconnect();
    } catch (error) {
      console.error("Error disconnecting PM2:", error.message);
    }
  });
});

// Get frontend logs from file system
app.get("/api/frontend-logs/:appName", async (req, res) => {
  try {
    const { appName } = req.params;
    const logPath = path.join("/var/log/myapps", `${appName}.log`);

    // Check if log file exists
    if (!(await fs.pathExists(logPath))) {
      return res.status(404).json({
        success: false,
        error: "Log file not found",
        path: logPath,
      });
    }

    // Read log file content
    const logContent = await fs.readFile(logPath, "utf8");
    const lines = logContent.split("\n").filter((line) => line.trim());

    // Get number of lines from query parameter (default 500, max 2000)
    const requestedLines = Math.min(parseInt(req.query.lines) || 500, 2000);

    // Get offset for pagination (default 0)
    const offset = parseInt(req.query.offset) || 0;

    // Get the requested lines with pagination
    const startIndex = Math.max(0, lines.length - requestedLines - offset);
    const endIndex = lines.length - offset;
    const recentLines = lines.slice(startIndex, endIndex);

    res.json({
      success: true,
      logs: recentLines,
      totalLines: lines.length,
      requestedLines,
      returnedLines: recentLines.length,
      hasMore: startIndex > 0,
      file: logPath,
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

// Get historical PM2 logs from file system
app.get("/api/logs/:appName/historical", async (req, res) => {
  try {
    const { appName } = req.params;

    // Look for PM2 log files in multiple possible locations
    const possiblePaths = [
      // Development paths (Windows/local)
      path.join("backend", "logs", `${appName}-out-0.log`),
      path.join("logs", `${appName}-out-0.log`),

      // Production paths (Linux/VPS)
      path.join(process.cwd(), "backend", "logs", `${appName}-out-0.log`),
      path.join(process.cwd(), "logs", `${appName}-out-0.log`),
      path.join("/opt/big-brother", "logs", `${appName}-out-0.log`),
      path.join("/opt/big-brother", "backend", "logs", `${appName}-out-0.log`),

      // PM2 default log locations
      path.join(
        require("os").homedir(),
        ".pm2",
        "logs",
        `${appName}-out-0.log`
      ),
    ];

    let logPath = null;
    for (const possiblePath of possiblePaths) {
      if (await fs.pathExists(possiblePath)) {
        logPath = possiblePath;
        break;
      }
    }

    if (!logPath) {
      return res.status(404).json({
        success: false,
        error: "PM2 log file not found",
        searchedPaths: possiblePaths,
      });
    }

    // Read log file content
    const logContent = await fs.readFile(logPath, "utf8");
    const lines = logContent.split("\n").filter((line) => line.trim());

    // Get number of lines from query parameter (default 500, max 2000)
    const requestedLines = Math.min(parseInt(req.query.lines) || 500, 2000);

    // Get offset for pagination (default 0)
    const offset = parseInt(req.query.offset) || 0;

    // Get the requested lines with pagination
    const startIndex = Math.max(0, lines.length - requestedLines - offset);
    const endIndex = lines.length - offset;
    const recentLines = lines.slice(startIndex, endIndex);

    // Parse PM2 log format and extract useful information
    const parsedLogs = recentLines.map((line, index) => {
      // PM2 log format: 0|app_name | timestamp: message
      const pm2Match = line.match(/^\d+\|[^|]+\|\s*(.+):\s*(.+)$/);
      if (pm2Match) {
        const [, timestamp, message] = pm2Match;
        return {
          id: startIndex + index,
          type: "log",
          level: message.toLowerCase().includes("error")
            ? "error"
            : message.toLowerCase().includes("warn")
            ? "warn"
            : "info",
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

    res.json({
      success: true,
      logs: parsedLogs,
      totalLines: lines.length,
      requestedLines,
      returnedLines: recentLines.length,
      hasMore: startIndex > 0,
      file: logPath,
      timestamp: new Date().toISOString(),
    });
  } catch (error) {
    console.error("Error reading historical PM2 logs:", error);
    res.status(500).json({
      success: false,
      error: "Failed to read PM2 log file",
      message: error.message,
    });
  }
});

// Health check endpoint
app.get("/api/health", (req, res) => {
  res.json({
    success: true,
    status: "healthy",
    uptime: process.uptime(),
    memory: process.memoryUsage(),
    timestamp: new Date().toISOString(),
    version: process.env.npm_package_version || "1.0.0",
  });
});

// PM2 control endpoints
app.post("/api/apps/:name/restart", async (req, res) => {
  try {
    const { name } = req.params;

    pm2.connect((err) => {
      if (err) {
        return res.status(500).json({
          success: false,
          error: "Failed to connect to PM2",
        });
      }

      pm2.restart(name, (err) => {
        pm2.disconnect();
        if (err) {
          return res.status(500).json({
            success: false,
            error: "Failed to restart application",
            message: err.message,
          });
        }

        res.json({
          success: true,
          message: `Application ${name} restarted successfully`,
        });
      });
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: "Failed to restart application",
      message: error.message,
    });
  }
});

app.post("/api/apps/:name/stop", async (req, res) => {
  try {
    const { name } = req.params;

    pm2.connect((err) => {
      if (err) {
        return res.status(500).json({
          success: false,
          error: "Failed to connect to PM2",
        });
      }

      pm2.stop(name, (err) => {
        pm2.disconnect();
        if (err) {
          return res.status(500).json({
            success: false,
            error: "Failed to stop application",
            message: err.message,
          });
        }

        res.json({
          success: true,
          message: `Application ${name} stopped successfully`,
        });
      });
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: "Failed to stop application",
      message: error.message,
    });
  }
});

// Error handling middleware
app.use((err, req, res, next) => {
  console.error("Unhandled error:", err);
  res.status(500).json({
    success: false,
    error: "Internal server error",
    message: err.message,
  });
});

// 404 handler
app.use((req, res) => {
  res.status(404).json({
    success: false,
    error: "Endpoint not found",
  });
});

// Graceful shutdown
process.on("SIGINT", () => {
  console.log("Received SIGINT, shutting down gracefully...");

  // Close all active log tails
  activeTails.forEach((tail) => {
    try {
      tail.unwatch();
    } catch (err) {
      console.error("Error closing tail:", err);
    }
  });

  // Disconnect from PM2
  pm2.disconnect();

  process.exit(0);
});

process.on("SIGTERM", () => {
  console.log("Received SIGTERM, shutting down gracefully...");

  // Close all active log tails
  activeTails.forEach((tail) => {
    try {
      tail.unwatch();
    } catch (err) {
      console.error("Error closing tail:", err);
    }
  });

  // Disconnect from PM2
  pm2.disconnect();

  process.exit(0);
});

// Start server
app.listen(PORT, () => {
  console.log(`Big Brother Backend API running on port ${PORT}`);
  console.log(`Environment: ${process.env.NODE_ENV || "development"}`);
  console.log(
    `Frontend URL: ${process.env.FRONTEND_URL || "http://localhost:3000"}`
  );
});

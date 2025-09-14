/**
 * Database management routes
 * Provides database status, statistics, and management endpoints
 */
import { Router } from "express";
import databaseService from "../services/databaseService.js";
import { authorize } from "../middleware/auth.js";

const router = Router();

/**
 * GET /api/database/status
 * Get database connection status and statistics
 */
router.get("/status", (req, res) => {
  try {
    const stats = databaseService.getStats();

    res.json({
      success: true,
      database: {
        connected: stats.connected,
        path: stats.path,
        size: stats.sizeFormatted,
        tables: stats.tables,
        timestamp: new Date().toISOString(),
      },
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: "Failed to get database status",
      message: error.message,
    });
  }
});

/**
 * GET /api/database/tables
 * Get detailed table information
 */
router.get("/tables", (req, res) => {
  try {
    const tables = [
      "users",
      "applications",
      "metrics",
      "logs",
      "alerts",
      "sessions",
    ];
    const tableInfo = {};

    for (const table of tables) {
      try {
        // Get table info
        const count = databaseService.queryOne(
          `SELECT COUNT(*) as count FROM ${table}`
        );
        const schema = databaseService.query(`PRAGMA table_info(${table})`);

        tableInfo[table] = {
          count: count?.count || 0,
          columns: schema.map((col) => ({
            name: col.name,
            type: col.type,
            nullable: !col.notnull,
            primaryKey: col.pk === 1,
            defaultValue: col.dflt_value,
          })),
        };
      } catch (error) {
        tableInfo[table] = { error: error.message };
      }
    }

    res.json({
      success: true,
      tables: tableInfo,
      timestamp: new Date().toISOString(),
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: "Failed to get table information",
      message: error.message,
    });
  }
});

/**
 * POST /api/database/backup
 * Create database backup
 * Requires admin authorization
 */
router.post("/backup", authorize(["admin"]), async (req, res) => {
  try {
    const backupPath = await databaseService.backup();

    res.json({
      success: true,
      message: "Database backup created successfully",
      backupPath,
      timestamp: new Date().toISOString(),
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: "Failed to create database backup",
      message: error.message,
    });
  }
});

/**
 * POST /api/database/cleanup
 * Clean up old data based on retention policies
 * Requires admin authorization
 */
router.post("/cleanup", authorize(["admin"]), (req, res) => {
  try {
    const { dryRun = true } = req.body;

    // Get retention policies from config
    const logRetentionDays = process.env.DB_LOG_RETENTION_DAYS || 30;
    const metricsRetentionDays = process.env.DB_METRICS_RETENTION_DAYS || 90;

    const cleanupDate = new Date();
    cleanupDate.setDate(cleanupDate.getDate() - logRetentionDays);
    const logCleanupDate = cleanupDate.toISOString();

    cleanupDate.setDate(
      cleanupDate.getDate() - (metricsRetentionDays - logRetentionDays)
    );
    const metricsCleanupDate = cleanupDate.toISOString();

    let result = {
      dryRun,
      operations: [],
    };

    if (dryRun) {
      // Count records that would be deleted
      const oldLogs = databaseService.queryOne(
        "SELECT COUNT(*) as count FROM logs WHERE timestamp < ?",
        [logCleanupDate]
      );

      const oldMetrics = databaseService.queryOne(
        "SELECT COUNT(*) as count FROM metrics WHERE timestamp < ?",
        [metricsCleanupDate]
      );

      result.operations.push({
        table: "logs",
        action: "delete",
        count: oldLogs?.count || 0,
        beforeDate: logCleanupDate,
      });

      result.operations.push({
        table: "metrics",
        action: "delete",
        count: oldMetrics?.count || 0,
        beforeDate: metricsCleanupDate,
      });
    } else {
      // Actually delete old records
      const logResult = databaseService.run(
        "DELETE FROM logs WHERE timestamp < ?",
        [logCleanupDate]
      );

      const metricsResult = databaseService.run(
        "DELETE FROM metrics WHERE timestamp < ?",
        [metricsCleanupDate]
      );

      result.operations.push({
        table: "logs",
        action: "deleted",
        count: logResult.changes,
        beforeDate: logCleanupDate,
      });

      result.operations.push({
        table: "metrics",
        action: "deleted",
        count: metricsResult.changes,
        beforeDate: metricsCleanupDate,
      });
    }

    res.json({
      success: true,
      message: dryRun
        ? "Cleanup preview completed"
        : "Database cleanup completed",
      result,
      timestamp: new Date().toISOString(),
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: "Failed to cleanup database",
      message: error.message,
    });
  }
});

/**
 * GET /api/database/migrations
 * Get migration history
 */
router.get("/migrations", (req, res) => {
  try {
    const migrations = databaseService.query(
      "SELECT * FROM migrations ORDER BY executed_at DESC"
    );

    res.json({
      success: true,
      migrations,
      count: migrations.length,
      timestamp: new Date().toISOString(),
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: "Failed to get migration history",
      message: error.message,
    });
  }
});

export default router;

/**
 * Log Model - Database operations for application logs
 */
import databaseService from "../services/databaseService.js";

class LogModel {
  /**
   * Insert new log entry
   */
  static insert(logData) {
    const {
      app_name,
      level = "info",
      message,
      source = "pm2",
      metadata = null,
    } = logData;

    return databaseService.run(
      `INSERT INTO logs
       (app_name, level, message, source, metadata)
       VALUES (?, ?, ?, ?, ?)`,
      [
        app_name,
        level,
        message,
        source,
        metadata ? JSON.stringify(metadata) : null,
      ]
    );
  }

  /**
   * Batch insert multiple log entries
   */
  static batchInsert(logsArray) {
    const queries = logsArray.map((logData) => {
      const {
        app_name,
        level = "info",
        message,
        source = "pm2",
        metadata = null,
        timestamp = new Date().toISOString(),
      } = logData;

      return {
        sql: `INSERT INTO logs
              (app_name, level, message, source, metadata, timestamp)
              VALUES (?, ?, ?, ?, ?, ?)`,
        params: [
          app_name,
          level,
          message,
          source,
          metadata ? JSON.stringify(metadata) : null,
          timestamp,
        ],
      };
    });

    return databaseService.transaction(queries);
  }

  /**
   * Get logs for an application with pagination
   */
  static getByApp(appName, options = {}) {
    const {
      level = null,
      limit = 100,
      offset = 0,
      startDate = null,
      endDate = null,
      search = null,
    } = options;

    let sql = "SELECT * FROM logs WHERE app_name = ?";
    const params = [appName];

    if (level) {
      sql += " AND level = ?";
      params.push(level);
    }

    if (startDate) {
      sql += " AND timestamp >= ?";
      params.push(startDate);
    }

    if (endDate) {
      sql += " AND timestamp <= ?";
      params.push(endDate);
    }

    if (search) {
      sql += " AND message LIKE ?";
      params.push(`%${search}%`);
    }

    sql += " ORDER BY timestamp DESC LIMIT ? OFFSET ?";
    params.push(limit, offset);

    return databaseService.query(sql, params);
  }

  /**
   * Search logs across all applications
   */
  static search(searchTerm, options = {}) {
    const {
      level = null,
      app_name = null,
      limit = 100,
      offset = 0,
      startDate = null,
      endDate = null,
    } = options;

    let sql = "SELECT * FROM logs WHERE message LIKE ?";
    const params = [`%${searchTerm}%`];

    if (app_name) {
      sql += " AND app_name = ?";
      params.push(app_name);
    }

    if (level) {
      sql += " AND level = ?";
      params.push(level);
    }

    if (startDate) {
      sql += " AND timestamp >= ?";
      params.push(startDate);
    }

    if (endDate) {
      sql += " AND timestamp <= ?";
      params.push(endDate);
    }

    sql += " ORDER BY timestamp DESC LIMIT ? OFFSET ?";
    params.push(limit, offset);

    return databaseService.query(sql, params);
  }

  /**
   * Get recent logs for all applications
   */
  static getRecent(limit = 50) {
    return databaseService.query(
      `SELECT * FROM logs
       ORDER BY timestamp DESC
       LIMIT ?`,
      [limit]
    );
  }

  /**
   * Get log level statistics
   */
  static getLevelStats(appName = null, hours = 24) {
    const hoursAgo = new Date();
    hoursAgo.setHours(hoursAgo.getHours() - hours);

    let sql = `SELECT
                level,
                COUNT(*) as count,
                MAX(timestamp) as latest
               FROM logs
               WHERE timestamp >= ?`;
    const params = [hoursAgo.toISOString()];

    if (appName) {
      sql += " AND app_name = ?";
      params.push(appName);
    }

    sql += " GROUP BY level ORDER BY count DESC";

    return databaseService.query(sql, params);
  }

  /**
   * Get error logs (errors and warnings)
   */
  static getErrors(appName = null, hours = 24) {
    const hoursAgo = new Date();
    hoursAgo.setHours(hoursAgo.getHours() - hours);

    let sql = `SELECT * FROM logs
               WHERE level IN ('error', 'warn')
               AND timestamp >= ?`;
    const params = [hoursAgo.toISOString()];

    if (appName) {
      sql += " AND app_name = ?";
      params.push(appName);
    }

    sql += " ORDER BY timestamp DESC";

    return databaseService.query(sql, params);
  }

  /**
   * Delete old logs based on retention policy
   */
  static deleteOlderThan(days) {
    const cutoffDate = new Date();
    cutoffDate.setDate(cutoffDate.getDate() - days);

    return databaseService.run("DELETE FROM logs WHERE timestamp < ?", [
      cutoffDate.toISOString(),
    ]);
  }

  /**
   * Get logs summary for dashboard
   */
  static getSummary() {
    return databaseService.query(
      `SELECT
         app_name,
         COUNT(*) as total_logs,
         SUM(CASE WHEN level = 'error' THEN 1 ELSE 0 END) as error_count,
         SUM(CASE WHEN level = 'warn' THEN 1 ELSE 0 END) as warn_count,
         MAX(timestamp) as last_log
       FROM logs
       GROUP BY app_name
       ORDER BY app_name`
    );
  }

  /**
   * Get log timeline for an application
   */
  static getTimeline(appName, hours = 24) {
    const hoursAgo = new Date();
    hoursAgo.setHours(hoursAgo.getHours() - hours);

    return databaseService.query(
      `SELECT
         datetime(timestamp, 'localtime', 'start of hour') as hour,
         level,
         COUNT(*) as count
       FROM logs
       WHERE app_name = ? AND timestamp >= ?
       GROUP BY hour, level
       ORDER BY hour, level`,
      [appName, hoursAgo.toISOString()]
    );
  }
}

export default LogModel;

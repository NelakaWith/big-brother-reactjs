/**
 * Metrics Model - Database operations for historical metrics
 */
import databaseService from "../services/databaseService.js";

class MetricsModel {
  /**
   * Insert new metrics data
   */
  static insert(metricsData) {
    const {
      app_name,
      status,
      cpu_usage = 0,
      memory_usage = 0,
      restart_count = 0,
      uptime = 0,
      metadata = null,
    } = metricsData;

    return databaseService.run(
      `INSERT INTO metrics
       (app_name, status, cpu_usage, memory_usage, restart_count, uptime, metadata)
       VALUES (?, ?, ?, ?, ?, ?, ?)`,
      [
        app_name,
        status,
        cpu_usage,
        memory_usage,
        restart_count,
        uptime,
        metadata ? JSON.stringify(metadata) : null,
      ]
    );
  }

  /**
   * Get metrics for an application within a time range
   */
  static getByAppAndTimeRange(appName, startDate, endDate, limit = 1000) {
    return databaseService.query(
      `SELECT * FROM metrics
       WHERE app_name = ? AND timestamp BETWEEN ? AND ?
       ORDER BY timestamp DESC
       LIMIT ?`,
      [appName, startDate, endDate, limit]
    );
  }

  /**
   * Get latest metrics for an application
   */
  static getLatest(appName, limit = 100) {
    return databaseService.query(
      `SELECT * FROM metrics
       WHERE app_name = ?
       ORDER BY timestamp DESC
       LIMIT ?`,
      [appName, limit]
    );
  }

  /**
   * Get metrics for all applications (latest)
   */
  static getLatestForAllApps() {
    return databaseService.query(
      `SELECT m1.* FROM metrics m1
       INNER JOIN (
         SELECT app_name, MAX(timestamp) as max_timestamp
         FROM metrics
         GROUP BY app_name
       ) m2 ON m1.app_name = m2.app_name AND m1.timestamp = m2.max_timestamp
       ORDER BY m1.app_name`
    );
  }

  /**
   * Get aggregated metrics (hourly averages)
   */
  static getHourlyAverages(appName, hours = 24) {
    const hoursAgo = new Date();
    hoursAgo.setHours(hoursAgo.getHours() - hours);

    return databaseService.query(
      `SELECT
         datetime(timestamp, 'localtime', 'start of hour') as hour,
         AVG(cpu_usage) as avg_cpu,
         AVG(memory_usage) as avg_memory,
         COUNT(*) as sample_count
       FROM metrics
       WHERE app_name = ? AND timestamp >= ?
       GROUP BY hour
       ORDER BY hour`,
      [appName, hoursAgo.toISOString()]
    );
  }

  /**
   * Get daily statistics for an application
   */
  static getDailyStats(appName, days = 7) {
    const daysAgo = new Date();
    daysAgo.setDate(daysAgo.getDate() - days);

    return databaseService.query(
      `SELECT
         date(timestamp, 'localtime') as date,
         AVG(cpu_usage) as avg_cpu,
         MAX(cpu_usage) as max_cpu,
         AVG(memory_usage) as avg_memory,
         MAX(memory_usage) as max_memory,
         AVG(uptime) as avg_uptime,
         COUNT(*) as sample_count
       FROM metrics
       WHERE app_name = ? AND timestamp >= ?
       GROUP BY date
       ORDER BY date`,
      [appName, daysAgo.toISOString()]
    );
  }

  /**
   * Delete old metrics based on retention policy
   */
  static deleteOlderThan(days) {
    const cutoffDate = new Date();
    cutoffDate.setDate(cutoffDate.getDate() - days);

    return databaseService.run("DELETE FROM metrics WHERE timestamp < ?", [
      cutoffDate.toISOString(),
    ]);
  }

  /**
   * Get resource usage trends
   */
  static getResourceTrends(appName, hours = 24) {
    const hoursAgo = new Date();
    hoursAgo.setHours(hoursAgo.getHours() - hours);

    return databaseService.query(
      `SELECT
         timestamp,
         cpu_usage,
         memory_usage,
         uptime
       FROM metrics
       WHERE app_name = ? AND timestamp >= ?
       ORDER BY timestamp`,
      [appName, hoursAgo.toISOString()]
    );
  }

  /**
   * Get metrics summary for dashboard
   */
  static getSummary() {
    return databaseService.query(
      `SELECT
         app_name,
         COUNT(*) as total_records,
         AVG(cpu_usage) as avg_cpu,
         AVG(memory_usage) as avg_memory,
         MAX(timestamp) as last_update
       FROM metrics
       GROUP BY app_name
       ORDER BY app_name`
    );
  }
}

export default MetricsModel;

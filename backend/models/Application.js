/**
 * Application Model - Database operations for applications
 */
import databaseService from "../services/databaseService.js";

class ApplicationModel {
  /**
   * Get all applications
   */
  static getAll() {
    return databaseService.query("SELECT * FROM applications ORDER BY name");
  }

  /**
   * Get application by name
   */
  static getByName(name) {
    return databaseService.queryOne(
      "SELECT * FROM applications WHERE name = ?",
      [name]
    );
  }

  /**
   * Create or update application
   */
  static upsert(appData) {
    const {
      name,
      description = "",
      category = "general",
      pm2_id = null,
      port = null,
      script_path = "",
      alert_cpu_threshold = 80.0,
      alert_memory_threshold = 512.0,
      alert_enabled = true,
    } = appData;

    return databaseService.run(
      `INSERT OR REPLACE INTO applications
       (name, description, category, pm2_id, port, script_path,
        alert_cpu_threshold, alert_memory_threshold, alert_enabled, updated_at)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, CURRENT_TIMESTAMP)`,
      [
        name,
        description,
        category,
        pm2_id,
        port,
        script_path,
        alert_cpu_threshold,
        alert_memory_threshold,
        alert_enabled ? 1 : 0,
      ]
    );
  }

  /**
   * Update application alert settings
   */
  static updateAlertSettings(name, settings) {
    const { alert_cpu_threshold, alert_memory_threshold, alert_enabled } =
      settings;

    return databaseService.run(
      `UPDATE applications
       SET alert_cpu_threshold = ?, alert_memory_threshold = ?, alert_enabled = ?, updated_at = CURRENT_TIMESTAMP
       WHERE name = ?`,
      [alert_cpu_threshold, alert_memory_threshold, alert_enabled ? 1 : 0, name]
    );
  }

  /**
   * Delete application
   */
  static delete(name) {
    return databaseService.run("DELETE FROM applications WHERE name = ?", [
      name,
    ]);
  }

  /**
   * Get applications with alert settings
   */
  static getAlertsConfig() {
    return databaseService.query(
      `SELECT name, alert_cpu_threshold, alert_memory_threshold, alert_enabled
       FROM applications
       WHERE alert_enabled = 1`
    );
  }
}

export default ApplicationModel;

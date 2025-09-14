/**
 * PM2 Service - Handles all PM2 operations
 */
import pm2 from "pm2";
import { CONFIG } from "../config/index.js";

class PM2Service {
  constructor() {
    this.maxRetries = CONFIG.pm2.maxRetries;
    this.retryDelay = CONFIG.pm2.retryDelay;
  }

  /**
   * Connect to PM2 with retry logic
   */
  async connect() {
    return new Promise((resolve, reject) => {
      pm2.connect((err) => {
        if (err) {
          console.error("PM2 connection error:", err);
          return reject(err);
        }
        resolve();
      });
    });
  }

  /**
   * Disconnect from PM2
   */
  disconnect() {
    try {
      pm2.disconnect();
    } catch (error) {
      console.error("Error disconnecting from PM2:", error);
    }
  }

  /**
   * Get PM2 process list
   */
  async getProcessList() {
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
  }

  /**
   * Format process info for API response
   */
  formatProcessInfo(proc) {
    const monit = proc.monit || {};
    const pm2_env = proc.pm2_env || {};

    return {
      name: proc.name,
      pid: proc.pid,
      pm_id: proc.pm_id,
      status: pm2_env.status || "unknown",
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
  }

  /**
   * Get all formatted processes
   */
  async getFormattedProcessList() {
    const processList = await this.getProcessList();
    return processList.map((proc) => this.formatProcessInfo(proc));
  }

  /**
   * Find a specific process by name
   */
  async findProcess(name) {
    const processList = await this.getProcessList();
    return processList.find((proc) => proc.name === name);
  }

  /**
   * Restart a process
   */
  async restartProcess(name) {
    return new Promise((resolve, reject) => {
      pm2.connect((err) => {
        if (err) {
          return reject(new Error("Failed to connect to PM2"));
        }

        pm2.restart(name, (err) => {
          pm2.disconnect();
          if (err) {
            return reject(
              new Error(`Failed to restart application: ${err.message}`)
            );
          }
          resolve({ message: `Application ${name} restarted successfully` });
        });
      });
    });
  }

  /**
   * Stop a process
   */
  async stopProcess(name) {
    return new Promise((resolve, reject) => {
      pm2.connect((err) => {
        if (err) {
          return reject(new Error("Failed to connect to PM2"));
        }

        pm2.stop(name, (err) => {
          pm2.disconnect();
          if (err) {
            return reject(
              new Error(`Failed to stop application: ${err.message}`)
            );
          }
          resolve({ message: `Application ${name} stopped successfully` });
        });
      });
    });
  }

  /**
   * Launch PM2 bus for log streaming
   */
  async launchBus() {
    return new Promise((resolve, reject) => {
      pm2.connect((err) => {
        if (err) {
          return reject(new Error("Failed to connect to PM2"));
        }

        pm2.launchBus((err, bus) => {
          if (err) {
            pm2.disconnect();
            return reject(new Error("Failed to launch PM2 bus"));
          }
          resolve(bus);
        });
      });
    });
  }
}

// Create singleton instance
const pm2Service = new PM2Service();

export default pm2Service;
export { PM2Service };

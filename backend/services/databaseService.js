/**
 * Database Service - SQLite database management
 * Handles connections, transactions, migrations, and queries
 */
import Database from "better-sqlite3";
import path from "path";
import fs from "fs-extra";
import { CONFIG } from "../config/index.js";

class DatabaseService {
  constructor() {
    this.db = null;
    this.isConnected = false;
    this.dbPath =
      CONFIG.database?.path ||
      path.join(process.cwd(), "data", "bigbrother.db");
    this.migrations = [];
  }

  /**
   * Initialize database connection
   */
  async initialize() {
    try {
      // Ensure database directory exists
      const dbDir = path.dirname(this.dbPath);
      await fs.ensureDir(dbDir);

      // Create database connection
      this.db = new Database(this.dbPath);

      // Configure database
      this.db.exec("PRAGMA foreign_keys = ON");
      this.db.exec("PRAGMA journal_mode = WAL");
      this.db.exec("PRAGMA synchronous = NORMAL");
      this.db.exec("PRAGMA cache_size = 1000");
      this.db.exec("PRAGMA temp_store = MEMORY");

      this.isConnected = true;
      console.log(`✅ Database connected: ${this.dbPath}`);

      // Run migrations
      await this.runMigrations();
    } catch (error) {
      console.error("❌ Database initialization failed:", error.message);
      throw error;
    }
  }

  /**
   * Get database connection
   */
  getConnection() {
    if (!this.isConnected || !this.db) {
      throw new Error("Database not connected. Call initialize() first.");
    }
    return this.db;
  }

  /**
   * Execute a query with parameters
   */
  query(sql, params = []) {
    try {
      const db = this.getConnection();
      const stmt = db.prepare(sql);
      return stmt.all(params);
    } catch (error) {
      console.error("Database query error:", error.message);
      console.error("SQL:", sql);
      console.error("Params:", params);
      throw error;
    }
  }

  /**
   * Execute a single row query
   */
  queryOne(sql, params = []) {
    try {
      const db = this.getConnection();
      const stmt = db.prepare(sql);
      return stmt.get(params);
    } catch (error) {
      console.error("Database queryOne error:", error.message);
      console.error("SQL:", sql);
      console.error("Params:", params);
      throw error;
    }
  }

  /**
   * Execute an insert/update/delete query
   */
  run(sql, params = []) {
    try {
      const db = this.getConnection();
      const stmt = db.prepare(sql);
      return stmt.run(params);
    } catch (error) {
      console.error("Database run error:", error.message);
      console.error("SQL:", sql);
      console.error("Params:", params);
      throw error;
    }
  }

  /**
   * Execute multiple queries in a transaction
   */
  transaction(queries) {
    const db = this.getConnection();
    const transaction = db.transaction((queries) => {
      for (const { sql, params = [] } of queries) {
        const stmt = db.prepare(sql);
        stmt.run(params);
      }
    });

    try {
      return transaction(queries);
    } catch (error) {
      console.error("Database transaction error:", error.message);
      throw error;
    }
  }

  /**
   * Run database migrations
   */
  async runMigrations() {
    try {
      // Create migrations table if it doesn't exist
      this.db.exec(`
        CREATE TABLE IF NOT EXISTS migrations (
          id INTEGER PRIMARY KEY AUTOINCREMENT,
          version TEXT NOT NULL UNIQUE,
          name TEXT NOT NULL,
          executed_at DATETIME DEFAULT CURRENT_TIMESTAMP
        )
      `);

      // Load migration files
      const migrationsDir = path.join(process.cwd(), "migrations");

      if (await fs.pathExists(migrationsDir)) {
        const migrationFiles = await fs.readdir(migrationsDir);
        const sortedMigrations = migrationFiles
          .filter((file) => file.endsWith(".js"))
          .sort();

        for (const file of sortedMigrations) {
          const version = file.replace(".js", "");

          // Check if migration already executed
          const executed = this.queryOne(
            "SELECT version FROM migrations WHERE version = ?",
            [version]
          );

          if (!executed) {
            console.log(`🔄 Running migration: ${file}`);

            const migrationPath = path.join(migrationsDir, file);
            const migration = await import(`file://${migrationPath}`);

            // Execute migration
            await migration.up(this);

            // Record migration as executed
            this.run("INSERT INTO migrations (version, name) VALUES (?, ?)", [
              version,
              file,
            ]);

            console.log(`✅ Migration completed: ${file}`);
          }
        }
      } else {
        console.log(
          "📁 No migrations directory found, creating initial schema..."
        );
        await this.createInitialSchema();
      }
    } catch (error) {
      console.error("❌ Migration error:", error.message);
      throw error;
    }
  }

  /**
   * Create initial database schema
   */
  async createInitialSchema() {
    const initialSchema = `
      -- Users table
      CREATE TABLE IF NOT EXISTS users (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        username TEXT NOT NULL UNIQUE,
        password_hash TEXT NOT NULL,
        role TEXT NOT NULL DEFAULT 'user',
        permissions TEXT, -- JSON array
        email TEXT,
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        last_login DATETIME,
        is_active BOOLEAN DEFAULT 1
      );

      -- Applications table
      CREATE TABLE IF NOT EXISTS applications (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        name TEXT NOT NULL UNIQUE,
        description TEXT,
        category TEXT DEFAULT 'general',
        pm2_id INTEGER,
        port INTEGER,
        script_path TEXT,
        alert_cpu_threshold REAL DEFAULT 80.0,
        alert_memory_threshold REAL DEFAULT 512.0,
        alert_enabled BOOLEAN DEFAULT 1,
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
      );

      -- Metrics table for historical data
      CREATE TABLE IF NOT EXISTS metrics (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        app_name TEXT NOT NULL,
        timestamp DATETIME DEFAULT CURRENT_TIMESTAMP,
        status TEXT NOT NULL,
        cpu_usage REAL DEFAULT 0,
        memory_usage INTEGER DEFAULT 0,
        restart_count INTEGER DEFAULT 0,
        uptime INTEGER DEFAULT 0,
        metadata TEXT, -- JSON for additional metrics
        FOREIGN KEY (app_name) REFERENCES applications(name)
      );

      -- Logs table for persistent log storage
      CREATE TABLE IF NOT EXISTS logs (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        app_name TEXT NOT NULL,
        level TEXT DEFAULT 'info',
        message TEXT NOT NULL,
        timestamp DATETIME DEFAULT CURRENT_TIMESTAMP,
        source TEXT DEFAULT 'pm2',
        metadata TEXT, -- JSON for additional context
        FOREIGN KEY (app_name) REFERENCES applications(name)
      );

      -- Alerts table
      CREATE TABLE IF NOT EXISTS alerts (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        app_name TEXT NOT NULL,
        alert_type TEXT NOT NULL,
        severity TEXT DEFAULT 'medium',
        title TEXT NOT NULL,
        message TEXT NOT NULL,
        threshold_value REAL,
        current_value REAL,
        is_resolved BOOLEAN DEFAULT 0,
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        resolved_at DATETIME,
        metadata TEXT, -- JSON
        FOREIGN KEY (app_name) REFERENCES applications(name)
      );

      -- Sessions table for JWT refresh tokens
      CREATE TABLE IF NOT EXISTS sessions (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        user_id INTEGER NOT NULL,
        refresh_token TEXT NOT NULL UNIQUE,
        expires_at DATETIME NOT NULL,
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        last_used DATETIME DEFAULT CURRENT_TIMESTAMP,
        ip_address TEXT,
        user_agent TEXT,
        is_revoked BOOLEAN DEFAULT 0,
        FOREIGN KEY (user_id) REFERENCES users(id)
      );

      -- Create indexes for better performance
      CREATE INDEX IF NOT EXISTS idx_metrics_app_timestamp ON metrics(app_name, timestamp);
      CREATE INDEX IF NOT EXISTS idx_logs_app_timestamp ON logs(app_name, timestamp);
      CREATE INDEX IF NOT EXISTS idx_logs_level ON logs(level);
      CREATE INDEX IF NOT EXISTS idx_alerts_app_created ON alerts(app_name, created_at);
      CREATE INDEX IF NOT EXISTS idx_alerts_unresolved ON alerts(is_resolved, created_at);
      CREATE INDEX IF NOT EXISTS idx_sessions_token ON sessions(refresh_token);
      CREATE INDEX IF NOT EXISTS idx_sessions_user_active ON sessions(user_id, is_revoked);
    `;

    try {
      this.db.exec(initialSchema);
      console.log("✅ Initial database schema created");

      // Record initial schema as migration
      this.run(
        "INSERT OR IGNORE INTO migrations (version, name) VALUES (?, ?)",
        ["001_initial_schema", "Initial database schema"]
      );
    } catch (error) {
      console.error("❌ Failed to create initial schema:", error.message);
      throw error;
    }
  }

  /**
   * Get database statistics
   */
  getStats() {
    try {
      const tables = [
        "users",
        "applications",
        "metrics",
        "logs",
        "alerts",
        "sessions",
      ];
      const stats = {
        connected: this.isConnected,
        path: this.dbPath,
        tables: {},
      };

      for (const table of tables) {
        try {
          const count = this.queryOne(`SELECT COUNT(*) as count FROM ${table}`);
          stats.tables[table] = count?.count || 0;
        } catch (error) {
          stats.tables[table] = "error";
        }
      }

      // Get database size
      try {
        const dbStats = fs.statSync(this.dbPath);
        stats.size = dbStats.size;
        stats.sizeFormatted = this.formatBytes(dbStats.size);
      } catch (error) {
        stats.size = 0;
        stats.sizeFormatted = "0 B";
      }

      return stats;
    } catch (error) {
      console.error("Error getting database stats:", error.message);
      return { connected: false, error: error.message };
    }
  }

  /**
   * Format bytes to human readable format
   */
  formatBytes(bytes) {
    if (bytes === 0) return "0 B";
    const k = 1024;
    const sizes = ["B", "KB", "MB", "GB"];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + " " + sizes[i];
  }

  /**
   * Close database connection
   */
  close() {
    if (this.db) {
      this.db.close();
      this.isConnected = false;
      console.log("🔌 Database connection closed");
    }
  }

  /**
   * Backup database
   */
  async backup(backupPath) {
    try {
      const timestamp = new Date().toISOString().replace(/[:.]/g, "-");
      const defaultBackupPath =
        backupPath || `${this.dbPath}.backup.${timestamp}`;

      await fs.copy(this.dbPath, defaultBackupPath);
      console.log(`💾 Database backup created: ${defaultBackupPath}`);
      return defaultBackupPath;
    } catch (error) {
      console.error("❌ Database backup failed:", error.message);
      throw error;
    }
  }
}

// Create singleton instance
const databaseService = new DatabaseService();

export default databaseService;

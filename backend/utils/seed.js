/**
 * Database Seeding Utility
 * Populates database with initial data
 */
import databaseService from "../services/databaseService.js";
import { CONFIG } from "../config/index.js";

async function seedDatabase() {
  try {
    console.log("🌱 Starting database seeding...");

    // Initialize database
    await databaseService.initialize();

    // Seed applications (PM2 apps that might be monitored)
    const sampleApps = [
      {
        name: "big-brother-frontend",
        description: "Big Brother monitoring dashboard frontend",
        category: "web",
        port: 3000,
        alert_cpu_threshold: 80.0,
        alert_memory_threshold: 512.0,
        alert_enabled: 1,
      },
      {
        name: "big-brother-backend",
        description: "Big Brother monitoring dashboard backend API",
        category: "api",
        port: 3001,
        alert_cpu_threshold: 70.0,
        alert_memory_threshold: 256.0,
        alert_enabled: 1,
      },
    ];

    console.log("📦 Seeding applications...");
    for (const app of sampleApps) {
      try {
        databaseService.run(
          `INSERT OR IGNORE INTO applications
           (name, description, category, port, alert_cpu_threshold, alert_memory_threshold, alert_enabled)
           VALUES (?, ?, ?, ?, ?, ?, ?)`,
          [
            app.name,
            app.description,
            app.category,
            app.port,
            app.alert_cpu_threshold,
            app.alert_memory_threshold,
            app.alert_enabled,
          ]
        );
        console.log(`   ✅ Added application: ${app.name}`);
      } catch (error) {
        console.log(
          `   ⚠️  Application ${app.name} already exists or error: ${error.message}`
        );
      }
    }

    // Add sample metrics for demonstration (last 24 hours)
    console.log("📊 Seeding sample metrics...");
    const now = new Date();
    const hoursBack = 24;

    for (let i = hoursBack; i >= 0; i--) {
      const timestamp = new Date(now.getTime() - i * 60 * 60 * 1000);

      for (const app of sampleApps) {
        // Generate realistic sample data
        const cpuUsage = Math.random() * 30 + 10; // 10-40% CPU
        const memoryUsage = Math.random() * 200 + 100; // 100-300MB memory
        const uptime = (hoursBack - i) * 3600; // Uptime in seconds

        try {
          databaseService.run(
            `INSERT INTO metrics
             (app_name, timestamp, status, cpu_usage, memory_usage, restart_count, uptime)
             VALUES (?, ?, ?, ?, ?, ?, ?)`,
            [
              app.name,
              timestamp.toISOString(),
              "online",
              cpuUsage,
              memoryUsage * 1024 * 1024,
              0,
              uptime,
            ]
          );
        } catch (error) {
          // Ignore duplicate entries
        }
      }
    }
    console.log(
      `   ✅ Added ${hoursBack + 1} hours of sample metrics for each app`
    );

    // Add sample logs
    console.log("📝 Seeding sample logs...");
    const sampleLogs = [
      {
        app_name: "big-brother-backend",
        level: "info",
        message: "Server started successfully",
      },
      {
        app_name: "big-brother-backend",
        level: "info",
        message: "Database connection established",
      },
      {
        app_name: "big-brother-frontend",
        level: "info",
        message: "Frontend application ready",
      },
      {
        app_name: "big-brother-frontend",
        level: "warn",
        message: "Slow API response detected",
      },
      {
        app_name: "big-brother-backend",
        level: "info",
        message: "PM2 monitoring active",
      },
    ];

    for (const log of sampleLogs) {
      try {
        databaseService.run(
          `INSERT INTO logs (app_name, level, message, timestamp, source)
           VALUES (?, ?, ?, ?, ?)`,
          [
            log.app_name,
            log.level,
            log.message,
            new Date().toISOString(),
            "system",
          ]
        );
        console.log(`   ✅ Added log: ${log.app_name} - ${log.message}`);
      } catch (error) {
        console.log(`   ⚠️  Log insertion error: ${error.message}`);
      }
    }

    console.log("\n✅ Database seeding completed successfully");

    // Display final stats
    const stats = databaseService.getStats();
    console.log("\n📊 Final Database Statistics:");
    console.log(`   Path: ${stats.path}`);
    console.log(`   Size: ${stats.sizeFormatted}`);
    console.log("   Tables:");

    Object.entries(stats.tables).forEach(([table, count]) => {
      console.log(`     ${table}: ${count} records`);
    });
  } catch (error) {
    console.error("❌ Database seeding failed:", error.message);
    process.exit(1);
  } finally {
    databaseService.close();
    process.exit(0);
  }
}

// CLI execution
if (process.argv[1].endsWith("seed.js")) {
  seedDatabase();
}

export { seedDatabase };

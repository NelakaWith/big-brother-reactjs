/**
 * Database Migration Utility
 * Manages database schema migrations
 */
import databaseService from "../services/databaseService.js";
import { CONFIG } from "../config/index.js";

async function runMigrations() {
  try {
    console.log("🔄 Starting database migrations...");

    // Initialize database
    await databaseService.initialize();

    // Migrations are automatically run during initialization
    console.log("✅ Database migrations completed successfully");

    // Display database stats
    const stats = databaseService.getStats();
    console.log("\n📊 Database Statistics:");
    console.log(`   Path: ${stats.path}`);
    console.log(`   Size: ${stats.sizeFormatted}`);
    console.log("   Tables:");

    Object.entries(stats.tables).forEach(([table, count]) => {
      console.log(`     ${table}: ${count} records`);
    });
  } catch (error) {
    console.error("❌ Migration failed:", error.message);
    process.exit(1);
  } finally {
    databaseService.close();
    process.exit(0);
  }
}

// CLI execution
if (process.argv[1].endsWith("migrate.js")) {
  runMigrations();
}

export { runMigrations };

/**
 * Database Reset Utility
 * Resets database to clean state
 */
import fs from "fs-extra";
import databaseService from "../services/databaseService.js";
import { CONFIG } from "../config/index.js";

async function resetDatabase() {
  try {
    console.log("🔄 Resetting database...");

    // Close any existing connections
    databaseService.close();

    // Backup existing database if it exists
    const dbPath = CONFIG.database.path;

    if (await fs.pathExists(dbPath)) {
      console.log("💾 Creating backup of existing database...");
      const backupPath = await databaseService.backup();
      console.log(`   ✅ Backup created: ${backupPath}`);

      // Remove existing database
      await fs.remove(dbPath);
      console.log("🗑️  Existing database removed");
    }

    // Initialize fresh database
    console.log("🏗️  Creating fresh database...");
    await databaseService.initialize();

    console.log("✅ Database reset completed successfully");

    // Display stats
    const stats = databaseService.getStats();
    console.log("\n📊 New Database Statistics:");
    console.log(`   Path: ${stats.path}`);
    console.log(`   Size: ${stats.sizeFormatted}`);
    console.log("   Tables:");

    Object.entries(stats.tables).forEach(([table, count]) => {
      console.log(`     ${table}: ${count} records`);
    });

    console.log("\n💡 To populate with sample data, run: npm run db:seed");
  } catch (error) {
    console.error("❌ Database reset failed:", error.message);
    process.exit(1);
  } finally {
    databaseService.close();
    process.exit(0);
  }
}

// CLI execution
if (process.argv[1].endsWith("reset-db.js")) {
  resetDatabase();
}

export { resetDatabase };

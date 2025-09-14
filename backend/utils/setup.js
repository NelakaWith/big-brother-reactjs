/**
 * Setup utility for Big Brother application
 * Generates password hashes and provides configuration guidance
 */

import bcrypt from "bcryptjs";
import { createHash } from "crypto";

/**
 * Generate password hash for environment configuration
 * @param {string} password - Plain text password
 * @returns {Promise<string>} - Hashed password
 */
export async function generatePasswordHash(password) {
  try {
    const hash = await bcrypt.hash(password, 12);
    return hash;
  } catch (error) {
    throw new Error(`Failed to generate password hash: ${error.message}`);
  }
}

/**
 * Generate secure JWT secret
 * @returns {string} - Random JWT secret
 */
export function generateJWTSecret() {
  return createHash("sha256")
    .update(Math.random().toString() + Date.now().toString())
    .digest("hex");
}

/**
 * Validate password strength
 * @param {string} password - Password to validate
 * @returns {object} - Validation result
 */
export function validatePassword(password) {
  const errors = [];

  if (!password || password.length < 8) {
    errors.push("Password must be at least 8 characters long");
  }

  if (!/[A-Z]/.test(password)) {
    errors.push("Password must contain at least one uppercase letter");
  }

  if (!/[a-z]/.test(password)) {
    errors.push("Password must contain at least one lowercase letter");
  }

  if (!/[0-9]/.test(password)) {
    errors.push("Password must contain at least one number");
  }

  if (!/[!@#$%^&*]/.test(password)) {
    errors.push(
      "Password must contain at least one special character (!@#$%^&*)"
    );
  }

  return {
    isValid: errors.length === 0,
    errors,
    strength:
      errors.length === 0 ? "strong" : errors.length <= 2 ? "medium" : "weak",
  };
}

/**
 * Generate environment configuration template
 * @param {object} options - Configuration options
 * @returns {string} - Environment file content
 */
export function generateEnvTemplate(options = {}) {
  const {
    username = "admin",
    jwtSecret = generateJWTSecret(),
    passwordHash = "",
    port = 3001,
    nodeEnv = "production",
  } = options;

  return `# Big Brother Application Configuration
# Copy this file to .env and update the values

# Server Configuration
NODE_ENV=${nodeEnv}
PORT=${port}

# Authentication Configuration
JWT_SECRET=${jwtSecret}
JWT_ACCESS_EXPIRY=30m
JWT_REFRESH_EXPIRY=7d

# Admin User Configuration
ADMIN_USERNAME=${username}
ADMIN_PASSWORD_HASH=${passwordHash}

# Security Notes:
# - Keep JWT_SECRET secure and never commit it to version control
# - Use a strong password and generate ADMIN_PASSWORD_HASH using setup utility
# - Change default values before deploying to production
`;
}

/**
 * Interactive setup function
 * @returns {Promise<object>} - Setup results
 */
export async function interactiveSetup() {
  console.log("🔧 Big Brother Authentication Setup\n");

  // Generate JWT secret
  const jwtSecret = generateJWTSecret();
  console.log("✅ Generated JWT secret");

  // Get admin username
  const username = process.env.SETUP_USERNAME || "admin";
  console.log(`✅ Admin username: ${username}`);

  // Get password from environment - REQUIRED for security
  const password = process.env.SETUP_PASSWORD;

  if (!password) {
    console.log(
      "❌ No password provided. Set SETUP_PASSWORD environment variable."
    );
    console.log("Example: SETUP_PASSWORD=YourSecurePassword123! npm run setup");
    return { success: false, error: "Password required" };
  }

  // Validate password
  const validation = validatePassword(password);
  if (!validation.isValid) {
    console.log("❌ Password validation failed:");
    validation.errors.forEach((error) => console.log(`   - ${error}`));
    return {
      success: false,
      error: "Invalid password",
      details: validation.errors,
    };
  }

  console.log(`✅ Password strength: ${validation.strength}`);

  // Generate password hash
  const passwordHash = await generatePasswordHash(password);
  console.log("✅ Generated password hash");

  // Generate environment template
  const envTemplate = generateEnvTemplate({
    username,
    jwtSecret,
    passwordHash,
  });

  console.log("\n📝 Environment Configuration:");
  console.log("Save this to your .env file:\n");
  console.log(envTemplate);

  console.log("\n🔒 Security Recommendations:");
  console.log("1. Save the environment configuration to .env file");
  console.log("2. Ensure .env is added to .gitignore");
  console.log("3. Use different JWT_SECRET for each environment");
  console.log("4. Regularly rotate JWT_SECRET and password");
  console.log("5. Use HTTPS in production");

  return {
    success: true,
    username,
    passwordHash,
    jwtSecret,
    envTemplate,
  };
}

// CLI execution
if (process.argv[1].endsWith("setup.js") || process.argv[1].endsWith("setup")) {
  interactiveSetup()
    .then((result) => {
      if (result.success) {
        console.log("\n✅ Setup completed successfully!");
        process.exit(0);
      } else {
        console.log("\n❌ Setup failed:", result.error);
        process.exit(1);
      }
    })
    .catch((error) => {
      console.error("\n💥 Setup error:", error.message);
      process.exit(1);
    });
}

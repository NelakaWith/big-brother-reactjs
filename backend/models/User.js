/**
 * User Model - Environment-based single user authentication
 */
import { CONFIG } from "../config/index.js";

class User {
  constructor() {
    this.adminUsername = CONFIG.auth.adminUsername;
    this.adminPasswordHash = CONFIG.auth.adminPasswordHash;
  }

  /**
   * Get admin user information
   */
  getAdminUser() {
    return {
      id: "admin",
      username: this.adminUsername,
      role: "admin",
      email: null, // Can be added to config if needed
      createdAt: null, // Static user, no creation date
      lastLogin: null, // Can be tracked in future
      permissions: [
        "view_apps",
        "manage_apps",
        "view_logs",
        "restart_apps",
        "stop_apps",
        "view_health",
        "admin_access",
      ],
    };
  }

  /**
   * Validate if user exists (only admin in this implementation)
   */
  userExists(username) {
    return username === this.adminUsername;
  }

  /**
   * Get user by username
   */
  getUserByUsername(username) {
    if (username === this.adminUsername) {
      return this.getAdminUser();
    }
    return null;
  }

  /**
   * Get user by ID
   */
  getUserById(id) {
    if (id === "admin") {
      return this.getAdminUser();
    }
    return null;
  }

  /**
   * Check if user has permission
   */
  hasPermission(username, permission) {
    const user = this.getUserByUsername(username);
    if (!user) return false;

    return user.permissions.includes(permission) || user.role === "admin";
  }

  /**
   * Get password hash for user
   */
  getPasswordHash(username) {
    if (username === this.adminUsername) {
      return this.adminPasswordHash;
    }
    return null;
  }

  /**
   * Validate user credentials format
   */
  validateCredentials(username, password) {
    const errors = [];

    if (!username || typeof username !== "string") {
      errors.push("Username is required and must be a string");
    }

    if (!password || typeof password !== "string") {
      errors.push("Password is required and must be a string");
    }

    if (username && username.length < 3) {
      errors.push("Username must be at least 3 characters long");
    }

    if (password && password.length < 8) {
      errors.push("Password must be at least 8 characters long");
    }

    return {
      isValid: errors.length === 0,
      errors,
    };
  }

  /**
   * Get user session info
   */
  createUserSession(username) {
    const user = this.getUserByUsername(username);
    if (!user) return null;

    return {
      id: user.id,
      username: user.username,
      role: user.role,
      permissions: user.permissions,
      sessionStart: new Date().toISOString(),
    };
  }

  /**
   * Get sanitized user info (no sensitive data)
   */
  getSafeUserInfo(username) {
    const user = this.getUserByUsername(username);
    if (!user) return null;

    return {
      id: user.id,
      username: user.username,
      role: user.role,
      permissions: user.permissions,
      // Exclude sensitive information
    };
  }

  /**
   * Check if authentication system is properly configured
   */
  isConfigured() {
    return !!(this.adminUsername && this.adminPasswordHash);
  }

  /**
   * Get configuration status
   */
  getConfigStatus() {
    return {
      hasUsername: !!this.adminUsername,
      hasPasswordHash: !!this.adminPasswordHash,
      isFullyConfigured: this.isConfigured(),
      adminUserExists: this.userExists(this.adminUsername),
    };
  }
}

// Create singleton instance
const userModel = new User();

export default userModel;
export { User };

/**
 * Authentication Service - JWT operations and password handling
 */
import jwt from "jsonwebtoken";
import bcrypt from "bcryptjs";
import { CONFIG } from "../config/index.js";

class AuthService {
  constructor() {
    this.jwtSecret = CONFIG.auth.jwtSecret;
    this.accessTokenExpiry = CONFIG.auth.jwtAccessExpiry;
    this.refreshTokenExpiry = CONFIG.auth.jwtRefreshExpiry;
    this.adminUsername = CONFIG.auth.adminUsername;
    this.adminPasswordHash = CONFIG.auth.adminPasswordHash;

    // Store for refresh tokens (in production, use Redis or database)
    this.refreshTokens = new Set();
  }

  /**
   * Hash a password using bcrypt
   */
  async hashPassword(password) {
    const saltRounds = 12;
    return await bcrypt.hash(password, saltRounds);
  }

  /**
   * Verify a password against its hash
   */
  async verifyPassword(password, hash) {
    return await bcrypt.compare(password, hash);
  }

  /**
   * Generate JWT access token
   */
  generateAccessToken(user) {
    const payload = {
      userId: user.id || "admin",
      username: user.username,
      role: user.role || "admin",
      type: "access",
    };

    return jwt.sign(payload, this.jwtSecret, {
      expiresIn: this.accessTokenExpiry,
      issuer: "big-brother-api",
      audience: "big-brother-dashboard",
    });
  }

  /**
   * Generate JWT refresh token
   */
  generateRefreshToken(user) {
    const payload = {
      userId: user.id || "admin",
      username: user.username,
      type: "refresh",
    };

    const token = jwt.sign(payload, this.jwtSecret, {
      expiresIn: this.refreshTokenExpiry,
      issuer: "big-brother-api",
      audience: "big-brother-dashboard",
    });

    // Store refresh token
    this.refreshTokens.add(token);
    return token;
  }

  /**
   * Verify JWT token
   */
  verifyToken(token, tokenType = "access") {
    try {
      const decoded = jwt.verify(token, this.jwtSecret, {
        issuer: "big-brother-api",
        audience: "big-brother-dashboard",
      });

      // Check token type
      if (decoded.type !== tokenType) {
        throw new Error("Invalid token type");
      }

      // For refresh tokens, check if it's still valid in our store
      if (tokenType === "refresh" && !this.refreshTokens.has(token)) {
        throw new Error("Refresh token revoked");
      }

      return decoded;
    } catch (error) {
      throw new Error(`Token verification failed: ${error.message}`);
    }
  }

  /**
   * Authenticate user with username and password
   */
  async authenticateUser(username, password) {
    // Check if username matches admin user
    if (username !== this.adminUsername) {
      throw new Error("Invalid credentials");
    }

    // Verify password
    const isValidPassword = await this.verifyPassword(
      password,
      this.adminPasswordHash
    );
    if (!isValidPassword) {
      throw new Error("Invalid credentials");
    }

    // Return user object
    return {
      id: "admin",
      username: this.adminUsername,
      role: "admin",
      loginTime: new Date().toISOString(),
    };
  }

  /**
   * Login and generate tokens
   */
  async login(username, password) {
    try {
      const user = await this.authenticateUser(username, password);

      const accessToken = this.generateAccessToken(user);
      const refreshToken = this.generateRefreshToken(user);

      return {
        success: true,
        user: {
          id: user.id,
          username: user.username,
          role: user.role,
        },
        tokens: {
          accessToken,
          refreshToken,
          accessTokenExpiry: this.accessTokenExpiry,
          refreshTokenExpiry: this.refreshTokenExpiry,
        },
        loginTime: user.loginTime,
      };
    } catch (error) {
      throw new Error(error.message);
    }
  }

  /**
   * Refresh access token using refresh token
   */
  async refreshAccessToken(refreshToken) {
    try {
      const decoded = this.verifyToken(refreshToken, "refresh");

      // Generate new access token
      const user = {
        id: decoded.userId,
        username: decoded.username,
        role: "admin", // For single-user system
      };

      const newAccessToken = this.generateAccessToken(user);

      return {
        success: true,
        accessToken: newAccessToken,
        accessTokenExpiry: this.accessTokenExpiry,
      };
    } catch (error) {
      throw new Error(`Token refresh failed: ${error.message}`);
    }
  }

  /**
   * Logout and revoke refresh token
   */
  logout(refreshToken) {
    if (refreshToken) {
      this.refreshTokens.delete(refreshToken);
    }
    return { success: true, message: "Logged out successfully" };
  }

  /**
   * Get user info from access token
   */
  getUserFromToken(accessToken) {
    try {
      const decoded = this.verifyToken(accessToken, "access");
      return {
        id: decoded.userId,
        username: decoded.username,
        role: decoded.role,
      };
    } catch (error) {
      throw new Error(`Invalid token: ${error.message}`);
    }
  }

  /**
   * Change user password (for future multi-user support)
   */
  async changePassword(currentPassword, newPassword) {
    // Verify current password
    const isValidPassword = await this.verifyPassword(
      currentPassword,
      this.adminPasswordHash
    );
    if (!isValidPassword) {
      throw new Error("Current password is incorrect");
    }

    // Generate new password hash
    const newPasswordHash = await this.hashPassword(newPassword);

    // Note: In a real implementation, this would update the environment or database
    // For now, we'll just return the new hash that needs to be updated manually
    return {
      success: true,
      message: "Password changed successfully",
      newPasswordHash, // This needs to be updated in ADMIN_PASSWORD_HASH
    };
  }

  /**
   * Validate token middleware helper
   */
  extractTokenFromHeader(authHeader) {
    if (!authHeader) {
      throw new Error("Authorization header missing");
    }

    if (!authHeader.startsWith("Bearer ")) {
      throw new Error("Invalid authorization header format");
    }

    return authHeader.substring(7); // Remove 'Bearer ' prefix
  }

  /**
   * Cleanup expired refresh tokens (should be called periodically)
   */
  cleanupExpiredTokens() {
    const expiredTokens = [];

    for (const token of this.refreshTokens) {
      try {
        this.verifyToken(token, "refresh");
      } catch (error) {
        expiredTokens.push(token);
      }
    }

    expiredTokens.forEach((token) => this.refreshTokens.delete(token));

    console.log(`Cleaned up ${expiredTokens.length} expired refresh tokens`);
    return expiredTokens.length;
  }
}

// Create singleton instance
const authService = new AuthService();

export default authService;
export { AuthService };

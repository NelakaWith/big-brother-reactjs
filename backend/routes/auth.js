/**
 * Authentication routes - Login, logout, token management
 */
import { Router } from "express";
import authService from "../services/authService.js";
import userModel from "../models/User.js";
import { authenticate, optionalAuth } from "../middleware/auth.js";

const router = Router();

/**
 * POST /api/auth/login
 * Login with username and password
 */
router.post("/login", async (req, res) => {
  try {
    const { username, password } = req.body;

    // Validate input
    if (!username || !password) {
      return res.status(400).json({
        success: false,
        error: "Username and password are required",
      });
    }

    // Validate credentials format
    const validation = userModel.validateCredentials(username, password);
    if (!validation.isValid) {
      return res.status(400).json({
        success: false,
        error: "Invalid credentials format",
        details: validation.errors,
      });
    }

    // Authenticate user
    const loginResult = await authService.login(username, password);

    res.json({
      success: true,
      message: "Login successful",
      ...loginResult,
    });
  } catch (error) {
    console.error("Login error:", error.message);
    res.status(401).json({
      success: false,
      error: "Authentication failed",
      message: error.message,
    });
  }
});

/**
 * POST /api/auth/refresh
 * Refresh access token using refresh token
 */
router.post("/refresh", async (req, res) => {
  try {
    const { refreshToken } = req.body;

    if (!refreshToken) {
      return res.status(400).json({
        success: false,
        error: "Refresh token is required",
      });
    }

    const result = await authService.refreshAccessToken(refreshToken);

    res.json({
      success: true,
      message: "Token refreshed successfully",
      ...result,
    });
  } catch (error) {
    console.error("Token refresh error:", error.message);
    res.status(401).json({
      success: false,
      error: "Token refresh failed",
      message: error.message,
    });
  }
});

/**
 * POST /api/auth/logout
 * Logout and revoke refresh token
 */
router.post("/logout", optionalAuth, (req, res) => {
  try {
    const { refreshToken } = req.body;

    const result = authService.logout(refreshToken);

    res.json({
      success: true,
      message: "Logout successful",
      ...result,
    });
  } catch (error) {
    console.error("Logout error:", error.message);
    res.status(500).json({
      success: false,
      error: "Logout failed",
      message: error.message,
    });
  }
});

/**
 * GET /api/auth/me
 * Get current user information
 */
router.get("/me", authenticate, (req, res) => {
  try {
    const user = userModel.getSafeUserInfo(req.user.username);

    if (!user) {
      return res.status(404).json({
        success: false,
        error: "User not found",
      });
    }

    res.json({
      success: true,
      user,
      authenticated: true,
      timestamp: new Date().toISOString(),
    });
  } catch (error) {
    console.error("Get user error:", error.message);
    res.status(500).json({
      success: false,
      error: "Failed to get user information",
      message: error.message,
    });
  }
});

/**
 * POST /api/auth/change-password
 * Change user password
 */
router.post("/change-password", authenticate, async (req, res) => {
  try {
    const { currentPassword, newPassword } = req.body;

    if (!currentPassword || !newPassword) {
      return res.status(400).json({
        success: false,
        error: "Current password and new password are required",
      });
    }

    // Validate new password format
    const validation = userModel.validateCredentials(
      req.user.username,
      newPassword
    );
    if (!validation.isValid) {
      return res.status(400).json({
        success: false,
        error: "Invalid new password format",
        details: validation.errors,
      });
    }

    const result = await authService.changePassword(
      currentPassword,
      newPassword
    );

    res.json({
      success: true,
      message: "Password changed successfully",
      note: "Please update ADMIN_PASSWORD_HASH environment variable with the new hash",
      newPasswordHash: result.newPasswordHash,
    });
  } catch (error) {
    console.error("Change password error:", error.message);
    res.status(400).json({
      success: false,
      error: "Password change failed",
      message: error.message,
    });
  }
});

/**
 * GET /api/auth/status
 * Get authentication system status
 */
router.get("/status", (req, res) => {
  try {
    const configStatus = userModel.getConfigStatus();

    res.json({
      success: true,
      configured: configStatus.isFullyConfigured,
      status: configStatus,
      timestamp: new Date().toISOString(),
    });
  } catch (error) {
    console.error("Auth status error:", error.message);
    res.status(500).json({
      success: false,
      error: "Failed to get authentication status",
      message: error.message,
    });
  }
});

/**
 * POST /api/auth/verify
 * Verify token validity
 */
router.post("/verify", (req, res) => {
  try {
    const { token } = req.body;

    if (!token) {
      return res.status(400).json({
        success: false,
        error: "Token is required",
      });
    }

    const user = authService.getUserFromToken(token);

    res.json({
      success: true,
      valid: true,
      user: {
        id: user.id,
        username: user.username,
        role: user.role,
      },
      timestamp: new Date().toISOString(),
    });
  } catch (error) {
    res.status(401).json({
      success: false,
      valid: false,
      error: "Invalid token",
      message: error.message,
    });
  }
});

export default router;

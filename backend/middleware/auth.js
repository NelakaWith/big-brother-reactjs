/**
 * JWT Authentication middleware
 */
import authService from "../services/authService.js";
import userModel from "../models/User.js";

export const authenticate = (req, res, next) => {
  try {
    const authHeader = req.headers.authorization;
    let token = null;

    // Try to extract token from Authorization header first
    if (authHeader) {
      token = authService.extractTokenFromHeader(authHeader);
    }

    // If no token in header, check query parameters (for SSE connections)
    if (!token && req.query.token) {
      token = req.query.token;
    }

    if (!token) {
      throw new Error("No authentication token provided");
    }

    // Verify token and get user info
    const user = authService.getUserFromToken(token);

    // Add user to request object
    req.user = user;
    req.token = token;

    next();
  } catch (error) {
    return res.status(401).json({
      success: false,
      error: "Authentication required",
      message: error.message,
    });
  }
};

/**
 * Optional authentication - doesn't fail if no token provided
 */
export const optionalAuth = (req, res, next) => {
  try {
    const authHeader = req.headers.authorization;

    if (authHeader) {
      const token = authService.extractTokenFromHeader(authHeader);
      const user = authService.getUserFromToken(token);
      req.user = user;
      req.token = token;
    }

    next();
  } catch (error) {
    // Continue without authentication
    next();
  }
};

/**
 * Permission-based authorization middleware
 */
export const authorize = (permission) => {
  return (req, res, next) => {
    if (!req.user) {
      return res.status(401).json({
        success: false,
        error: "Authentication required",
      });
    }

    if (!userModel.hasPermission(req.user.username, permission)) {
      return res.status(403).json({
        success: false,
        error: "Insufficient permissions",
        required: permission,
      });
    }

    next();
  };
};

/**
 * Admin-only authorization
 */
export const requireAdmin = (req, res, next) => {
  if (!req.user) {
    return res.status(401).json({
      success: false,
      error: "Authentication required",
    });
  }

  if (req.user.role !== "admin") {
    return res.status(403).json({
      success: false,
      error: "Admin access required",
    });
  }

  next();
};

export default authenticate;

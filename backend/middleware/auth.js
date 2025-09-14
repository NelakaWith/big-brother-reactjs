/**
 * Authentication middleware
 */
import basicAuth from "basic-auth";
import { CONFIG } from "../config/index.js";

export const authenticate = (req, res, next) => {
  const credentials = basicAuth(req);

  if (
    !credentials ||
    credentials.name !== CONFIG.auth.username ||
    credentials.pass !== CONFIG.auth.password
  ) {
    res.set("WWW-Authenticate", `Basic realm="${CONFIG.auth.realm}"`);
    return res.status(401).json({
      success: false,
      error: "Authentication required",
    });
  }

  next();
};

export default authenticate;

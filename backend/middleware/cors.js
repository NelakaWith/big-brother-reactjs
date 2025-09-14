/**
 * CORS middleware configuration
 */
import cors from "cors";
import { CONFIG } from "../config/index.js";

export const corsMiddleware = cors({
  origin: CONFIG.cors.origin,
  credentials: CONFIG.cors.credentials,
});

export default corsMiddleware;

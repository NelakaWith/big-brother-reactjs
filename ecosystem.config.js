module.exports = {
  apps: [
    {
      name: "big-brother-backend",
      script: "./server.js",
      cwd: "./backend",
      instances: 1,
      exec_mode: "fork",
      env: {
        NODE_ENV: "production",
        PORT: 3001,
        HOST: "0.0.0.0",
        AUTH_USERNAME: process.env.AUTH_USERNAME || "admin",
        AUTH_PASSWORD: process.env.AUTH_PASSWORD || "SETUP_REQUIRED",
        FRONTEND_URL: "http://localhost:3000",
      },
      env_development: {
        NODE_ENV: "development",
        PORT: 3001,
        HOST: "0.0.0.0",
        AUTH_USERNAME: process.env.AUTH_USERNAME || "admin",
        AUTH_PASSWORD: process.env.AUTH_PASSWORD || "SETUP_REQUIRED",
        FRONTEND_URL: "http://localhost:3000",
      },
      env_production: {
        NODE_ENV: "production",
        PORT: 3001,
        HOST: "0.0.0.0",
        AUTH_USERNAME: process.env.AUTH_USERNAME || "admin",
        AUTH_PASSWORD: process.env.AUTH_PASSWORD, // No fallback for production security
        FRONTEND_URL:
          process.env.FRONTEND_URL || "https://bigbro.nelakawithanage.com",
      },
      log_date_format: "YYYY-MM-DD HH:mm Z",
      error_file: "./logs/big-brother-backend-error.log",
      out_file: "./logs/big-brother-backend-out.log",
      log_file: "./logs/big-brother-backend-combined.log",
      time: true,
      autorestart: true,
      watch: false,
      max_memory_restart: "500M",
      ignore_watch: ["node_modules", "logs"],
    },
    {
      name: "big-brother-frontend",
      script: "npm",
      args: "start",
      cwd: "./frontend",
      instances: 1,
      exec_mode: "fork",
      env: {
        NODE_ENV: "production",
        PORT: 3006,
        NEXT_PUBLIC_BACKEND_URL: "https://bigbro.nelakawithanage.com",
        NEXT_PUBLIC_AUTH_USERNAME: process.env.AUTH_USERNAME || "admin",
        // SECURITY: Removed NEXT_PUBLIC_AUTH_PASSWORD - credentials should not be exposed to frontend
      },
      env_development: {
        NODE_ENV: "development",
        PORT: 3000,
        NEXT_PUBLIC_BACKEND_URL: "http://localhost:3001",
        NEXT_PUBLIC_AUTH_USERNAME: process.env.AUTH_USERNAME || "admin",
        // SECURITY: Removed NEXT_PUBLIC_AUTH_PASSWORD - credentials should not be exposed to frontend
      },
      env_production: {
        NODE_ENV: "production",
        PORT: 3006,
        NEXT_PUBLIC_BACKEND_URL: "https://bigbro.nelakawithanage.com",
        NEXT_PUBLIC_AUTH_USERNAME: process.env.AUTH_USERNAME || "admin",
        // SECURITY: Removed NEXT_PUBLIC_AUTH_PASSWORD - credentials should not be exposed to frontend
      },
      log_date_format: "YYYY-MM-DD HH:mm Z",
      error_file: "./logs/big-brother-frontend-error.log",
      out_file: "./logs/big-brother-frontend-out.log",
      log_file: "./logs/big-brother-frontend-combined.log",
      time: true,
      autorestart: true,
      watch: false,
      max_memory_restart: "300M",
    },
  ],
};

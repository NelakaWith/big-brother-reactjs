/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  swcMinify: true,
  output: "standalone",
  env: {
    BACKEND_URL: process.env.BACKEND_URL || "http://localhost:3001",
    AUTH_USERNAME: process.env.AUTH_USERNAME || "admin",
    AUTH_PASSWORD: process.env.AUTH_PASSWORD || "admin123",
  },
};

module.exports = nextConfig;

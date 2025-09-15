/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  swcMinify: true,
  output: "standalone",
  // Do not provide a localhost fallback here. If NEXT_PUBLIC_BACKEND_URL is
  // set in the build environment it will be embedded. Otherwise runtime code
  // will resolve the backend origin (window.location.origin) and the client
  // normalization ensures the final URL includes `/api`.
};

module.exports = nextConfig;

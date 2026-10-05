/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,

  // Standalone output for Docker — smaller image, self-contained
  output: process.env.DOCKER_BUILD === '1' ? 'standalone' : undefined,

  // Silence Turbopack warning (Next.js 16+ uses Turbopack by default)
  turbopack: {},

  // Allow access via IP address in development
  allowedDevOrigins: ['192.168.8.56'],

  images: {
    remotePatterns: [
      // Cloudflare R2 public bucket (add your domain when ready)
      // { protocol: 'https', hostname: '*.r2.cloudflarestorage.com' },
    ],
  },
};

module.exports = nextConfig;
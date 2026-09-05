/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  images: {
    remotePatterns: [
      // Cloudflare R2 public bucket (add your domain when ready)
      // { protocol: 'https', hostname: '*.r2.cloudflarestorage.com' },
    ],
  },
};

module.exports = nextConfig;
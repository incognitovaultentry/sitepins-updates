/** @type {import('next').NextConfig} */
const { setupDevPlatform } = require('@cloudflare/next-on-pages/next-dev');

const nextConfig = {
  images: {
    remotePatterns: [],
  },
};

if (process.env.NODE_ENV === 'development') {
  setupDevPlatform().catch(console.error);
}

module.exports = nextConfig;

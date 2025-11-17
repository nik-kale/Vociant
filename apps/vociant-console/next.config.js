/** @type {import('next').NextConfig} */
const nextConfig = {
  transpilePackages: ['@vociant/core'],
  experimental: {
    serverActions: {
      bodySizeLimit: '10mb',
    },
  },
};

module.exports = nextConfig;

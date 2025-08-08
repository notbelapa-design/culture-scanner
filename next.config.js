// @ts-check

/**
 * @type {import('next').NextConfig}
 */
const nextConfig = {
  reactStrictMode: true,
  images: {
    // Allow remote icons/images from Polymarket's CDN
    domains: ['polymarket-upload.s3.us-east-2.amazonaws.com'],
  },
};

module.exports = nextConfig;

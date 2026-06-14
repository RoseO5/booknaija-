/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  env: {
    NEXT_PUBLIC_SELAR_LINK: process.env.SELAR_PRODUCT_LINK,
  },
};

module.exports = nextConfig;

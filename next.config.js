/** @type {import('next').NextConfig} */
// @indwella/sdk now ships a compiled build (dist/, see its package.json
// main/types), so Next can consume it as a normal pre-built dependency - no
// transpilePackages entry is needed. It is installed via `file:../indwella-sdk`.
const nextConfig = {
  reactStrictMode: true,
  eslint: { ignoreDuringBuilds: false },
};

module.exports = nextConfig;

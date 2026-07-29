/** @type {import('next').NextConfig} */
const path = require('path');

const nextConfig = {
  reactStrictMode: true,
  // The workspace packages ship their raw TypeScript source (no build step -
  // see packages/*/package.json `main`/`types`), so Next.js needs to be told
  // to run its own compiler over them instead of treating them as pre-built.
  transpilePackages: ['@indwella/api-client', '@indwella/types'],
  eslint: { ignoreDuringBuilds: false },
};

module.exports = nextConfig;

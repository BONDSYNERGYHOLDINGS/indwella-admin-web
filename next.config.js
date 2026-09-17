/** @type {import('next').NextConfig} */
// @indwella/sdk now ships a compiled build (dist/, see its package.json
// main/types), so Next can consume it as a normal pre-built dependency - no
// transpilePackages entry is needed. It is installed via `file:../indwella-sdk`.

// Same-origin API proxy (see ADMIN_AUTH.md). The admin console authenticates by
// the httpOnly `admin_access_token` cookie the backend sets at /admin/login.
// A cookie can't ride a *cross-site* XHR unless it's SameSite=None; Secure and
// CORS allows credentials for the exact origin - fragile and backend-dependent.
// Instead the browser calls this app's OWN origin at /api/*, and Next proxies
// server-side to the backend. The cookie is then first-party, so it's stored
// and sent automatically regardless of its SameSite attribute, and CORS no
// longer applies to the browser at all.
const API_PROXY_TARGET =
  process.env.API_PROXY_TARGET ?? 'https://indwella-server.onrender.com';

const nextConfig = {
  reactStrictMode: true,
  eslint: { ignoreDuringBuilds: false },
  async rewrites() {
    return [
      {
        source: '/api/:path*',
        destination: `${API_PROXY_TARGET}/:path*`,
      },
    ];
  },
};

module.exports = nextConfig;

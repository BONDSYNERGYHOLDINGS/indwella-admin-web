'use client';

import type { TokenStorage } from '@indwella/api-client';

const ACCESS_KEY = 'indwella_admin_access_token';
const REFRESH_KEY = 'indwella_admin_refresh_token';
/**
 * Non-sensitive cookie that only says "a session might exist" so the Edge
 * middleware (middleware.ts) can redirect unauthenticated visitors away from
 * /dashboard/* without a network round trip. The actual bearer tokens never
 * touch a cookie - they stay in localStorage and are attached by the shared
 * api-client's request interceptor.
 *
 * PRODUCTION HARDENING NOTE: localStorage is convenient but readable by any
 * script on the page (XSS risk). For a production deployment, prefer moving
 * token storage into an httpOnly cookie set by a Next.js Route Handler (see
 * README "Security hardening" section) so client-side JS never sees the
 * token at all. That's a backend-compatible change - only this file and
 * `middleware.ts` would need to change.
 */
const AUTH_FLAG_COOKIE = 'indwella_admin_authed';

const isBrowser = () => typeof window !== 'undefined';

function setAuthFlagCookie(present: boolean) {
  if (!isBrowser()) return;
  if (present) {
    document.cookie = `${AUTH_FLAG_COOKIE}=1; path=/; max-age=${60 * 60 * 24 * 30}; samesite=lax`;
  } else {
    document.cookie = `${AUTH_FLAG_COOKIE}=; path=/; max-age=0`;
  }
}

export const adminTokenStorage: TokenStorage = {
  async getAccessToken() {
    if (!isBrowser()) return null;
    return window.localStorage.getItem(ACCESS_KEY);
  },
  async getRefreshToken() {
    if (!isBrowser()) return null;
    return window.localStorage.getItem(REFRESH_KEY);
  },
  async setTokens({ accessToken, refreshToken }) {
    if (!isBrowser()) return;
    window.localStorage.setItem(ACCESS_KEY, accessToken);
    window.localStorage.setItem(REFRESH_KEY, refreshToken);
    setAuthFlagCookie(true);
  },
  async clear() {
    if (!isBrowser()) return;
    window.localStorage.removeItem(ACCESS_KEY);
    window.localStorage.removeItem(REFRESH_KEY);
    setAuthFlagCookie(false);
  },
};

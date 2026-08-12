'use client';

import type { TokenStorage } from '@indwella/sdk';

const ACCESS_KEY = 'indwella_admin_access_token';
const REFRESH_KEY = 'indwella_admin_refresh_token';
/**
 * Non-sensitive cookie that only says "a session might exist" so the Edge
 * middleware (middleware.ts) can redirect unauthenticated visitors away from
 * /dashboard/* without a network round trip.
 *
 * AUTH MODEL (see ADMIN_AUTH.md): the admin console authenticates by the
 * httpOnly `admin_access_token` cookie the backend sets at /admin/login. That
 * cookie is invisible to JS by design, so it can't be read back on reload -
 * this readable flag cookie is our client-side "logged in" signal instead. The
 * localStorage keys below are a compatibility fallback: they're only populated
 * if /admin/login also returns tokens in its JSON body (which additionally
 * enables body-based silent refresh via /auth/refresh). The httpOnly cookie is
 * the source of truth for API authorization; localStorage is best-effort.
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

/**
 * Whether the "a session might exist" flag cookie is present. This is the
 * authoritative client-side signal in the cookie-auth flow: the real
 * `admin_access_token` is an httpOnly cookie the browser never exposes to JS,
 * so we can't read it back - we mark this flag at login and check it on reload.
 */
export function hasAuthFlag(): boolean {
  if (!isBrowser()) return false;
  return document.cookie.split('; ').some((c) => c.startsWith(`${AUTH_FLAG_COOKIE}=1`));
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
    // Cookie-auth flow: /admin/login may deliver auth purely via the httpOnly
    // `admin_access_token` cookie and return no body tokens. Only persist real
    // values (never the string "undefined"); the auth-flag cookie is what marks
    // the session as present either way. If a refresh_token IS returned in the
    // body, storing it enables silent refresh (see ADMIN_AUTH.md).
    if (accessToken) window.localStorage.setItem(ACCESS_KEY, accessToken);
    if (refreshToken) window.localStorage.setItem(REFRESH_KEY, refreshToken);
    setAuthFlagCookie(true);
  },
  async clear() {
    if (!isBrowser()) return;
    window.localStorage.removeItem(ACCESS_KEY);
    window.localStorage.removeItem(REFRESH_KEY);
    setAuthFlagCookie(false);
  },
};

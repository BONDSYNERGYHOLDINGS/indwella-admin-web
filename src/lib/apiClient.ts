'use client';

import { createAdminSdk } from '@indwella/sdk';
import { adminTokenStorage } from './tokenStorage';

const baseURL = process.env.NEXT_PUBLIC_API_BASE_URL || '';

// API_PROXY_TARGET (see next.config.js / .env.example) can point at a
// Render-hosted backend, which cold-starts after idling and can take
// 30-60s+ to respond to the first request of a session (usually login).
// The SDK's default timeout (20s) is shorter than that, so it's raised here
// to survive a cold start. See docs/AUTHENTICATION.md, "Login timeouts on
// Render cold starts."
const REQUEST_TIMEOUT_MS = 45000;

let sessionExpiredHandler: (() => void) | null = null;
export const setSessionExpiredHandler = (handler: (() => void) | null) => {
  sessionExpiredHandler = handler;
};

export const adminSdk = createAdminSdk({
  baseURL,
  storage: adminTokenStorage,
  timeoutMs: REQUEST_TIMEOUT_MS,
   withCredentials: true,
  onSessionExpired: () => sessionExpiredHandler?.(),
  
});

export const api = adminSdk.client.axios;
export const adminApi = adminSdk.admin;
export const superAdminApi = adminSdk.superAdmin;
export const authApi = adminSdk.auth;
export const passwordResetApi = adminSdk.passwordReset;
export const notificationsApi = adminSdk.notifications;

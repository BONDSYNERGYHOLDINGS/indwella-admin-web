'use client';

import { createAdminSdk } from '@indwella/api-client';
import { adminTokenStorage } from './tokenStorage';

const baseURL = process.env.NEXT_PUBLIC_API_BASE_URL || '';
console.log("API URL:", baseURL);

let sessionExpiredHandler: (() => void) | null = null;
export const setSessionExpiredHandler = (handler: (() => void) | null) => {
  sessionExpiredHandler = handler;
};

export const adminSdk = createAdminSdk({
  baseURL,
  storage: adminTokenStorage,
  onSessionExpired: () => sessionExpiredHandler?.(),
});

export const api = adminSdk.client.axios;
export const adminApi = adminSdk.admin;
export const superAdminApi = adminSdk.superAdmin;
export const authApi = adminSdk.auth;
export const passwordResetApi = adminSdk.passwordReset;
export const notificationsApi = adminSdk.notifications;

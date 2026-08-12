'use client';

import React, { createContext, useContext, useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { adminTokenStorage, hasAuthFlag } from './tokenStorage';
import { authApi, setSessionExpiredHandler } from './apiClient';

export type AdminRole = 'admin' | 'superadmin';

type AuthContextType = {
  isAuthenticated: boolean;
  isAuthLoading: boolean;
  role: AdminRole | null;
  login: (token: string | null | undefined, refreshToken: string | null | undefined, role: AdminRole) => Promise<void>;
  logout: () => Promise<void>;
};

const ROLE_KEY = 'indwella_admin_role';
const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const router = useRouter();
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [isAuthLoading, setIsAuthLoading] = useState(true);
  const [role, setRole] = useState<AdminRole | null>(null);

  useEffect(() => {
    setSessionExpiredHandler(() => {
      setIsAuthenticated(false);
      setRole(null);
      router.replace('/login');
    });
    return () => setSessionExpiredHandler(null);
  }, [router]);

  useEffect(() => {
    (async () => {
      // In the cookie-auth flow the real token is an httpOnly cookie we can't
      // read, so "am I logged in?" is answered by the flag cookie set at login.
      // Fall back to a localStorage token if one was persisted (body-token flow).
      const token = await adminTokenStorage.getAccessToken();
      const storedRole = typeof window !== 'undefined' ? window.localStorage.getItem(ROLE_KEY) : null;
      if (hasAuthFlag() || token) {
        setIsAuthenticated(true);
        setRole((storedRole as AdminRole) ?? 'admin');
      }
      setIsAuthLoading(false);
    })();
  }, []);

  const login = async (
    token: string | null | undefined,
    refreshToken: string | null | undefined,
    loggedInRole: AdminRole,
  ) => {
    // setTokens tolerates missing tokens (cookie-only login): it still sets the
    // auth-flag cookie, and persists tokens only if the backend returned them.
    await adminTokenStorage.setTokens({ accessToken: token ?? '', refreshToken: refreshToken ?? '' });
    window.localStorage.setItem(ROLE_KEY, loggedInRole);
    setRole(loggedInRole);
    setIsAuthenticated(true);
  };

  const logout = async () => {
    try {
      if (role === 'superadmin') {
        await authApi.superAdminLogout();
      } else {
        await authApi.logout();
      }
    } catch (error) {
      console.warn('Could not clear backend session on logout:', error);
    }
    await adminTokenStorage.clear();
    window.localStorage.removeItem(ROLE_KEY);
    setIsAuthenticated(false);
    setRole(null);
    router.replace('/login');
  };

  return (
    <AuthContext.Provider value={{ isAuthenticated, isAuthLoading, role, login, logout }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be used within an AuthProvider');
  return ctx;
}

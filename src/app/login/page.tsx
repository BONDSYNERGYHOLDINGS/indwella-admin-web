'use client';

import { useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { api, authApi } from '@/lib/apiClient';
import { useAuth, type AdminRole } from '@/lib/auth-context';

function getErrorMessage(err: unknown): string {
  const anyErr = err as { response?: { data?: { detail?: string; message?: string } }; message?: string };
  return (
    anyErr?.response?.data?.detail ||
    anyErr?.response?.data?.message ||
    anyErr?.message ||
    'Something went wrong. Please try again.'
  );
}

export default function LoginPage() {
  const router = useRouter();
  const { login } = useAuth();
  const [role, setRole] = useState<AdminRole>('admin');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setLoading(true);
    try {
      const { data } =
        role === 'superadmin'
          ? await authApi.superAdminLogin({ email, password })
          : await authApi.login({ email, password });

      // The backend authenticates the admin via the httpOnly `admin_access_token`
      // cookie it sets on this response (the browser stores it because the SDK
      // sends credentials). Body tokens are optional - pass them through if
      // present (enables silent refresh) but don't depend on them.
      await login(data?.access_token, data?.refresh_token, role);
      router.replace('/dashboard');
    } catch (err) {
      setError(getErrorMessage(err));
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex min-h-screen">
      {/* Brand panel - left, hidden on small screens */}
      <div className="relative hidden w-1/2 flex-col justify-between overflow-hidden bg-gradient-to-br from-brand-700 via-brand-500 to-brand-400 p-12 text-white lg:flex">
        <div className="relative z-10 text-2xl font-bold tracking-tight">Indwella</div>
        <div className="relative z-10 max-w-md">
          <h1 className="text-4xl font-bold leading-tight">Run your estate from one dashboard.</h1>
          <p className="mt-4 text-brand-50/90">
            Residents, security, service charges, and wallet activity - all in one place, built for
            estate administrators.
          </p>
        </div>
        <div className="relative z-10 text-sm text-brand-50/70">© {new Date().getFullYear()} Indwella</div>
        <div className="absolute -bottom-24 -right-24 h-96 w-96 rounded-full bg-white/10" />
        <div className="absolute -top-16 -left-16 h-72 w-72 rounded-full bg-white/10" />
      </div>

      {/* Form panel - right */}
      <div className="flex w-full flex-col justify-center px-6 py-12 lg:w-1/2 lg:px-24">
        <div className="mx-auto w-full max-w-sm">
          <h2 className="text-2xl font-bold text-ink-900">Welcome back</h2>
          <p className="mt-1 text-sm text-ink-500">Sign in to manage your estate.</p>

          <div className="mt-6 inline-flex rounded-lg border border-ink-200 bg-ink-50 p-1 text-sm">
            <button
              type="button"
              onClick={() => setRole('admin')}
              className={`rounded-md px-3 py-1.5 font-medium transition ${
                role === 'admin' ? 'bg-white text-brand-600 shadow-card' : 'text-ink-500'
              }`}>
              Estate Admin
            </button>
            {/* <button
              type="button"
              onClick={() => setRole('superadmin')}
              className={`rounded-md px-3 py-1.5 font-medium transition ${
                role === 'superadmin' ? 'bg-white text-brand-600 shadow-card' : 'text-ink-500'
              }`}>
              Super Admin
            </button> */}
          </div>

          <form onSubmit={handleSubmit} className="mt-6 space-y-4">
            {error && (
              <div className="rounded-lg border border-red-200 bg-red-50 px-3.5 py-2.5 text-sm text-red-700">
                {error}
              </div>
            )}
            <div>
              <label htmlFor="email" className="mb-1.5 block text-sm font-medium text-ink-700">
                Email
              </label>
              <input
                id="email"
                type="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="you@estate.com"
                className="input-field"
                autoComplete="email"
              />
            </div>
            <div>
              <div className="mb-1.5 flex items-center justify-between">
                <label htmlFor="password" className="block text-sm font-medium text-ink-700">
                  Password
                </label>
                <Link href="/forgot-password" className="text-sm font-medium text-brand-600 hover:text-brand-700">
                  Forgot password?
                </Link>
              </div>
              <input
                id="password"
                type="password"
                required
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="••••••••"
                className="input-field"
                autoComplete="current-password"
              />
            </div>
            <button type="submit" disabled={loading} className="btn-primary w-full">
              {loading ? 'Signing in…' : 'Sign in'}
            </button>
          </form>
        </div>
      </div>
    </div>
  );
}

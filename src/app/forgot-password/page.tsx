'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { passwordResetApi } from '@/lib/apiClient';
import { AuthSplitLayout } from '@/components/AuthSplitLayout';

export default function ForgotPasswordPage() {
  const router = useRouter();
  const [email, setEmail] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setLoading(true);
    try {
      await passwordResetApi.requestReset({ email });
      router.push(`/verify-otp?email=${encodeURIComponent(email)}`);
    } catch (err: any) {
      setError(err?.response?.data?.detail || err?.response?.data?.message || 'Could not send reset code.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <AuthSplitLayout title="Forgot your password?" subtitle="We'll send a reset code to your email.">
      <form onSubmit={handleSubmit} className="space-y-4">
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
          />
        </div>
        <button type="submit" disabled={loading} className="btn-primary w-full">
          {loading ? 'Sending…' : 'Send reset code'}
        </button>
      </form>
    </AuthSplitLayout>
  );
}

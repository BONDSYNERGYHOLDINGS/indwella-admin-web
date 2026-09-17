'use client';

import { useState } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { passwordResetApi } from '@/lib/apiClient';
import { AuthSplitLayout } from '@/components/AuthSplitLayout';
import { getApiErrorMessage } from '@/lib/errorMessage';

export default function VerifyOtpPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const email = searchParams.get('email') ?? '';
  const [otp, setOtp] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setLoading(true);
    try {
      await passwordResetApi.verifyOtpAdmin({ email, otp });
      router.push(`/reset-password?email=${encodeURIComponent(email)}`);
    } catch (err: any) {
      setError(getApiErrorMessage(err, 'Invalid or expired code.'));
    } finally {
      setLoading(false);
    }
  };

  return (
    <AuthSplitLayout title="Enter verification code" subtitle={`We sent a code to ${email || 'your email'}.`}>
      <form onSubmit={handleSubmit} className="space-y-4">
        {error && (
          <div className="rounded-lg border border-red-200 bg-red-50 px-3.5 py-2.5 text-sm text-red-700">
            {error}
          </div>
        )}
        <div>
          <label htmlFor="otp" className="mb-1.5 block text-sm font-medium text-ink-700">
            Verification code
          </label>
          <input
            id="otp"
            required
            value={otp}
            onChange={(e) => setOtp(e.target.value)}
            placeholder="123456"
            className="input-field tracking-[0.5em]"
            maxLength={6}
          />
        </div>
        <button type="submit" disabled={loading} className="btn-primary w-full">
          {loading ? 'Verifying…' : 'Verify code'}
        </button>
      </form>
    </AuthSplitLayout>
  );
}

'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { passwordResetApi } from '@/lib/apiClient';
import { AuthSplitLayout } from '@/components/AuthSplitLayout';

export default function ResetPasswordPage() {
  const router = useRouter();
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    if (newPassword !== confirmPassword) {
      setError('Passwords do not match.');
      return;
    }
    setLoading(true);
    try {
      await passwordResetApi.resetPassword({
        new_password: newPassword,
        confirm_password: confirmPassword,
      });
      router.push('/login');
    } catch (err: any) {
      setError(err?.response?.data?.detail || err?.response?.data?.message || 'Could not reset password.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <AuthSplitLayout title="Set a new password" subtitle="Choose a strong password you haven't used before.">
      <form onSubmit={handleSubmit} className="space-y-4">
        {error && (
          <div className="rounded-lg border border-red-200 bg-red-50 px-3.5 py-2.5 text-sm text-red-700">
            {error}
          </div>
        )}
        <div>
          <label htmlFor="new_password" className="mb-1.5 block text-sm font-medium text-ink-700">
            New password
          </label>
          <input
            id="new_password"
            type="password"
            required
            value={newPassword}
            onChange={(e) => setNewPassword(e.target.value)}
            className="input-field"
          />
        </div>
        <div>
          <label htmlFor="confirm_password" className="mb-1.5 block text-sm font-medium text-ink-700">
            Confirm password
          </label>
          <input
            id="confirm_password"
            type="password"
            required
            value={confirmPassword}
            onChange={(e) => setConfirmPassword(e.target.value)}
            className="input-field"
          />
        </div>
        <button type="submit" disabled={loading} className="btn-primary w-full">
          {loading ? 'Saving…' : 'Reset password'}
        </button>
      </form>
    </AuthSplitLayout>
  );
}

'use client';

import { useState } from 'react';
import { PageHeader } from '@/components/PageHeader';
import { authApi } from '@/lib/apiClient';
import { useAuth } from '@/lib/auth-context';
import { getApiErrorMessage } from '@/lib/errorMessage';

export default function SettingsPage() {
  const { role } = useAuth();
  const [oldPassword, setOldPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    setMessage(null);
    setError(null);
    try {
      await authApi.changePassword({ old_password: oldPassword, new_password: newPassword });
      setMessage('Password updated.');
      setOldPassword('');
      setNewPassword('');
    } catch (err: any) {
      setError(getApiErrorMessage(err, 'Could not update password.'));
    } finally {
      setSaving(false);
    }
  };

  return (
    <div>
      <PageHeader title="Settings" subtitle="Manage your account." />

      <div className="card max-w-md">
        <h3 className="font-semibold text-ink-900">Signed in as</h3>
        <p className="mt-1 text-sm capitalize text-ink-500">{role ?? 'admin'}</p>
      </div>

      <form onSubmit={handleSubmit} className="card mt-6 max-w-md space-y-4">
        <h3 className="font-semibold text-ink-900">Change password</h3>
        {message && <p className="text-sm text-emerald-600">{message}</p>}
        {error && <p className="text-sm text-red-600">{error}</p>}
        <div>
          <label className="mb-1.5 block text-sm font-medium text-ink-700">Current password</label>
          <input
            required
            type="password"
            value={oldPassword}
            onChange={(e) => setOldPassword(e.target.value)}
            className="input-field"
          />
        </div>
        <div>
          <label className="mb-1.5 block text-sm font-medium text-ink-700">New password</label>
          <input
            required
            type="password"
            value={newPassword}
            onChange={(e) => setNewPassword(e.target.value)}
            className="input-field"
          />
        </div>
        <button type="submit" disabled={saving} className="btn-primary">
          {saving ? 'Saving…' : 'Update password'}
        </button>
      </form>
    </div>
  );
}

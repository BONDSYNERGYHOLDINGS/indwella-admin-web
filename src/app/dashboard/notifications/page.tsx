'use client';

import { useEffect, useState } from 'react';
import { PageHeader } from '@/components/PageHeader';
import { notificationsApi } from '@/lib/apiClient';
import type { NotificationOut, BroadcastNotificationRequest } from '@indwella/sdk';

export default function NotificationsPage() {
  const [notifications, setNotifications] = useState<NotificationOut[]>([]);
  const [loading, setLoading] = useState(true);
  const [title, setTitle] = useState('');
  const [body, setBody] = useState('');
  const [sending, setSending] = useState(false);
  const [message, setMessage] = useState<string | null>(null);

  const load = async () => {
    setLoading(true);
    try {
      const { data } = await notificationsApi.list();
      setNotifications(data);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    load();
  }, []);

  const handleBroadcast = async (e: React.FormEvent) => {
    e.preventDefault();
    setSending(true);
    setMessage(null);
    try {
      const payload: BroadcastNotificationRequest = { title, body, target: 'estate_residents' };
      await notificationsApi.broadcast(payload);
      setTitle('');
      setBody('');
      setMessage('Notification sent to your estate residents.');
      await load();
    } catch (err: any) {
      setMessage(err?.response?.data?.detail || 'Could not send notification.');
    } finally {
      setSending(false);
    }
  };

  return (
    <div>
      <PageHeader title="Notifications" subtitle="Broadcast announcements to residents in your estate." />

      <form onSubmit={handleBroadcast} className="card mb-6 space-y-4">
        {message && <p className="text-sm text-ink-600">{message}</p>}
        <div>
          <label className="mb-1.5 block text-sm font-medium text-ink-700">Title</label>
          <input required value={title} onChange={(e) => setTitle(e.target.value)} className="input-field" />
        </div>
        <div>
          <label className="mb-1.5 block text-sm font-medium text-ink-700">Message</label>
          <textarea required value={body} onChange={(e) => setBody(e.target.value)} className="input-field" rows={3} />
        </div>
        <button type="submit" disabled={sending} className="btn-primary">
          {sending ? 'Sending…' : 'Send to all residents'}
        </button>
      </form>

      <h3 className="mb-3 font-semibold text-ink-900">Recent notifications</h3>
      <div className="space-y-3">
        {loading ? (
          <p className="text-ink-400">Loading…</p>
        ) : notifications.length === 0 ? (
          <p className="text-ink-400">No notifications sent yet.</p>
        ) : (
          notifications.map((n) => (
            <div key={n.id} className="card py-4">
              <div className="flex items-center justify-between">
                <p className="font-semibold text-ink-900">{n.title}</p>
                <p className="text-xs text-ink-400">{new Date(n.created_at).toLocaleString()}</p>
              </div>
              <p className="mt-1 text-sm text-ink-600">{n.body}</p>
            </div>
          ))
        )}
      </div>
    </div>
  );
}

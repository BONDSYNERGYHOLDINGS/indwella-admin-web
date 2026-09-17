'use client';

import { useEffect, useState } from 'react';
import { PageHeader } from '@/components/PageHeader';
import { notificationsApi } from '@/lib/apiClient';
import { getApiErrorMessage } from '@/lib/errorMessage';
import type { NotificationOut, BroadcastNotificationRequest } from '@indwella/sdk';

// NotificationOut.data is typed loosely (Record<string, unknown> | null) since
// its exact shape isn't documented anywhere - but indwella-resident-app's
// NotificationScreen.tsx (a real, working screen) reads an ad-hoc
// `data.attachment: { url, name }` payload the same way, so this mirrors that.
interface NotificationAttachment {
  url?: string;
  name?: string;
}

function getAttachment(n: NotificationOut): NotificationAttachment | null {
  const attachment = (n.data as { attachment?: NotificationAttachment } | null | undefined)?.attachment;
  return attachment?.url ? attachment : null;
}

export default function NotificationsPage() {
  const [notifications, setNotifications] = useState<NotificationOut[]>([]);
  const [loading, setLoading] = useState(true);
  const [title, setTitle] = useState('');
  const [body, setBody] = useState('');
  const [sending, setSending] = useState(false);
  const [message, setMessage] = useState<string | null>(null);
  const [selected, setSelected] = useState<NotificationOut | null>(null);

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
      const payload: BroadcastNotificationRequest = { subject: title, message: body, target: 'estate_residents' };
      await notificationsApi.broadcast(payload);
      setTitle('');
      setBody('');
      setMessage('Notification sent to your estate residents.');
      await load();
    } catch (err: any) {
      setMessage(getApiErrorMessage(err, 'Could not send notification.'));
    } finally {
      setSending(false);
    }
  };

  // Opens the detail view and marks the notification read on first open.
  // Failing to mark-read shouldn't block the admin from reading the detail
  // they just clicked into, so it's fire-and-forget with a local optimistic
  // update rather than something the UI blocks on.
  const openNotification = (n: NotificationOut) => {
    setSelected(n);
    if (n.is_read) return;
    setNotifications((prev) => prev.map((item) => (item.id === n.id ? { ...item, is_read: true } : item)));
    notificationsApi.markRead([n.id]).catch(() => {
      // Non-critical - worst case the item shows read locally but the
      // backend still has it unread; next load() will reconcile it.
    });
  };

  const selectedAttachment = selected ? getAttachment(selected) : null;

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
            <button
              key={n.id}
              type="button"
              onClick={() => openNotification(n)}
              className="card block w-full py-4 text-left transition hover:border-brand-200 hover:shadow-card">
              <div className="flex items-center justify-between gap-3">
                <div className="flex min-w-0 items-center gap-2">
                  {!n.is_read && (
                    <span className="h-2 w-2 shrink-0 rounded-full bg-brand-500" aria-label="Unread" />
                  )}
                  <p className="truncate font-semibold text-ink-900">{n.title}</p>
                </div>
                <p className="shrink-0 text-xs text-ink-400">{new Date(n.created_at).toLocaleString()}</p>
              </div>
              <p className="mt-1 line-clamp-2 text-sm text-ink-600">{n.message}</p>
            </button>
          ))
        )}
      </div>

      {selected && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-ink-900/40 p-4"
          onClick={() => setSelected(null)}>
          <div
            className="card max-h-[80vh] w-full max-w-lg overflow-y-auto"
            onClick={(e) => e.stopPropagation()}
            role="dialog"
            aria-modal="true">
            <div className="flex items-start justify-between gap-3">
              <h3 className="text-lg font-semibold text-ink-900">{selected.title}</h3>
              <button
                type="button"
                onClick={() => setSelected(null)}
                className="rounded-md px-2 py-1 text-ink-400 hover:bg-ink-100 hover:text-ink-600"
                aria-label="Close">
                ✕
              </button>
            </div>
            <p className="mt-1 text-xs text-ink-400">{new Date(selected.created_at).toLocaleString()}</p>
            <p className="mt-4 whitespace-pre-wrap text-sm text-ink-700">{selected.message}</p>
            {selectedAttachment && (
              <a
                href={selectedAttachment.url}
                target="_blank"
                rel="noopener noreferrer"
                className="btn-secondary mt-4">
                {selectedAttachment.name || 'Open attachment'}
              </a>
            )}
          </div>
        </div>
      )}
    </div>
  );
}

'use client';

import { useEffect, useState } from 'react';
import { PageHeader } from '@/components/PageHeader';
import { DataTable, type DataTableColumn } from '@/components/DataTable';
import { Badge } from '@/components/Badge';
import { adminApi } from '@/lib/apiClient';
import type { AdminResidentListItem } from '@indwella/sdk';

// getResidentsInfo() returns loosely-typed rows while searchResident() is typed
// as AdminResidentListItem[]; accept either and coerce each field defensively.
const toResident = (
  raw: AdminResidentListItem | Record<string, unknown>,
): AdminResidentListItem => ({
  id: Number(raw.id ?? 0),
  first_name: String(raw.first_name ?? ''),
  last_name: String(raw.last_name ?? ''),
  email: String(raw.email ?? ''),
  phone_number: String(raw.phone_number ?? ''),
  house_address: String(raw.house_address ?? ''),
  status: (raw.status as AdminResidentListItem['status']) ?? 'pending',
  is_approved: Boolean(raw.is_approved),
  created_at: String(raw.created_at ?? ''),
});

export default function ResidentsPage() {
  const [residents, setResidents] = useState<AdminResidentListItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [query, setQuery] = useState('');
  const [actioningId, setActioningId] = useState<number | null>(null);
  const [error, setError] = useState<string | null>(null);

  // Server-side search: a non-empty query hits /admin/search-resident, an empty
  // one lists everything. Defaults to the active query so mutations can reload
  // the current view.
  const load = async (q: string = query) => {
    setLoading(true);
    setError(null);
    try {
      const trimmed = q.trim();
      const { data } = trimmed
        ? await adminApi.searchResident(trimmed)
        : await adminApi.getResidentsInfo();
      const rows = Array.isArray(data) ? data : [];
      setResidents(rows.map(toResident));
    } catch (err: any) {
      setError(err?.response?.data?.detail || 'Could not load residents.');
    } finally {
      setLoading(false);
    }
  };

  // Debounce the search input (~350ms). Also drives the initial load (q = '').
  useEffect(() => {
    const timer = setTimeout(() => {
      load(query);
    }, 350);
    return () => clearTimeout(timer);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [query]);

  const handleApproval = async (residentId: number, status: 'confirmed' | 'rejected') => {
    setActioningId(residentId);
    setError(null);
    try {
      await adminApi.setResidentApproval(residentId, { status });
      await load();
    } catch (err: any) {
      setError(err?.response?.data?.detail || 'Could not update resident status.');
    } finally {
      setActioningId(null);
    }
  };

  const handleDelete = async (residentId: number) => {
    if (!window.confirm('Delete this resident? This cannot be undone.')) return;
    setActioningId(residentId);
    setError(null);
    try {
      await adminApi.deleteResident(residentId);
      await load(query);
    } catch (err: any) {
      setError(err?.response?.data?.detail || 'Could not delete resident.');
    } finally {
      setActioningId(null);
    }
  };

  const columns: DataTableColumn<AdminResidentListItem>[] = [
    {
      key: 'name',
      header: 'Resident',
      render: (r) => (
        <div>
          <p className="font-medium text-ink-900">
            {r.first_name} {r.last_name}
          </p>
          <p className="text-xs text-ink-400">{r.email}</p>
        </div>
      ),
    },
    { key: 'house_address', header: 'Address' },
    { key: 'phone_number', header: 'Phone' },
    {
      key: 'status',
      header: 'Status',
      render: (r) => <Badge status={r.status ?? 'pending'} />,
    },
    {
      key: 'actions',
      header: '',
      render: (r) => (
        <div className="flex gap-2">
          {r.status === 'pending' && (
            <>
              <button
                disabled={actioningId === r.id}
                onClick={() => handleApproval(r.id, 'confirmed')}
                className="rounded-md bg-emerald-50 px-2.5 py-1.5 text-xs font-semibold text-emerald-700 hover:bg-emerald-100 disabled:opacity-50">
                Approve
              </button>
              <button
                disabled={actioningId === r.id}
                onClick={() => handleApproval(r.id, 'rejected')}
                className="rounded-md bg-red-50 px-2.5 py-1.5 text-xs font-semibold text-red-700 hover:bg-red-100 disabled:opacity-50">
                Reject
              </button>
            </>
          )}
          <button
            disabled={actioningId === r.id}
            onClick={() => handleDelete(r.id)}
            className="rounded-md bg-ink-100 px-2.5 py-1.5 text-xs font-semibold text-ink-600 hover:bg-ink-200 disabled:opacity-50">
            Delete
          </button>
        </div>
      ),
    },
  ];

  return (
    <div>
      <PageHeader
        title="Residents"
        subtitle="Review, approve, and manage residents in your estate."
        action={
          <input
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Search residents…"
            className="input-field w-64"
          />
        }
      />
      {error && (
        <div className="mb-4 rounded-lg border border-red-200 bg-red-50 px-3.5 py-2.5 text-sm text-red-700">
          {error}
        </div>
      )}
      <DataTable columns={columns} rows={residents} isLoading={loading} emptyMessage="No residents found." />
    </div>
  );
}

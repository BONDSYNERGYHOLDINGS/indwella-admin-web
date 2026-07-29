'use client';

import { useEffect, useState } from 'react';
import { PageHeader } from '@/components/PageHeader';
import { DataTable, type DataTableColumn } from '@/components/DataTable';
import { Badge } from '@/components/Badge';
import { adminApi } from '@/lib/apiClient';

interface ResidentRow {
  id: number;
  first_name?: string;
  last_name?: string;
  email?: string;
  phone_number?: string;
  house_address?: string;
  status?: string;
  [key: string]: unknown;
}

export default function ResidentsPage() {
  const [residents, setResidents] = useState<ResidentRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [query, setQuery] = useState('');
  const [actioningId, setActioningId] = useState<number | null>(null);

  const load = async () => {
    setLoading(true);
    try {
      const { data } = await adminApi.getResidentsInfo();
      setResidents(data as ResidentRow[]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    load();
  }, []);

  const handleApproval = async (residentId: number, action: 'approved' | 'rejected') => {
    setActioningId(residentId);
    try {
      await adminApi.setResidentApproval(residentId, { action });
      await load();
    } finally {
      setActioningId(null);
    }
  };

  const filtered = residents.filter((r) => {
    if (!query) return true;
    const haystack = `${r.first_name ?? ''} ${r.last_name ?? ''} ${r.email ?? ''} ${r.house_address ?? ''}`.toLowerCase();
    return haystack.includes(query.toLowerCase());
  });

  const columns: DataTableColumn<ResidentRow>[] = [
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
      render: (r) =>
        r.status === 'pending' ? (
          <div className="flex gap-2">
            <button
              disabled={actioningId === r.id}
              onClick={() => handleApproval(r.id, 'approved')}
              className="rounded-md bg-emerald-50 px-2.5 py-1.5 text-xs font-semibold text-emerald-700 hover:bg-emerald-100 disabled:opacity-50">
              Approve
            </button>
            <button
              disabled={actioningId === r.id}
              onClick={() => handleApproval(r.id, 'rejected')}
              className="rounded-md bg-red-50 px-2.5 py-1.5 text-xs font-semibold text-red-700 hover:bg-red-100 disabled:opacity-50">
              Reject
            </button>
          </div>
        ) : null,
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
      <DataTable columns={columns} rows={filtered} isLoading={loading} emptyMessage="No residents found." />
    </div>
  );
}

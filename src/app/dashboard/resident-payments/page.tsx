'use client';

import { useEffect, useState } from 'react';
import { PageHeader } from '@/components/PageHeader';
import { DataTable, type DataTableColumn } from '@/components/DataTable';
import { Badge } from '@/components/Badge';
import { adminApi } from '@/lib/apiClient';
import type { ResidentPaymentOut } from '@indwella/sdk';

export default function ResidentPaymentsPage() {
  const [payments, setPayments] = useState<ResidentPaymentOut[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const load = async () => {
    setLoading(true);
    setError(null);
    try {
      const { data } = await adminApi.getResidentPayments();
      setPayments(data);
    } catch (err: any) {
      setError(err?.response?.data?.detail || 'Could not load resident payments.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    load();
  }, []);

  const columns: DataTableColumn<ResidentPaymentOut>[] = [
    { key: 'resident', header: 'Resident', render: (r) => r.resident_name ?? `#${r.resident_id}` },
    { key: 'service_charge', header: 'Service charge', render: (r) => r.service_charge_name ?? '—' },
    {
      key: 'amount',
      header: 'Amount',
      render: (r) => new Intl.NumberFormat('en-NG', { style: 'currency', currency: 'NGN' }).format(r.amount),
    },
    { key: 'status', header: 'Status', render: (r) => <Badge status={r.status ?? 'pending'} /> },
    { key: 'reference', header: 'Reference', render: (r) => r.reference ?? '—' },
    {
      key: 'date',
      header: 'Date',
      render: (r) => {
        const when = r.paid_at ?? r.created_at;
        return when ? new Date(when).toLocaleString() : '—';
      },
    },
  ];

  return (
    <div>
      <PageHeader
        title="Resident Payments"
        subtitle="Payments made by residents across service charges."
      />

      {error && (
        <div className="mb-4 rounded-lg border border-red-200 bg-red-50 px-3.5 py-2.5 text-sm text-red-700">
          {error}
        </div>
      )}

      <DataTable columns={columns} rows={payments} isLoading={loading} emptyMessage="No payments yet." />
    </div>
  );
}

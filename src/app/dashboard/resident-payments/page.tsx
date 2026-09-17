'use client';

import { useEffect, useState } from 'react';
import { PageHeader } from '@/components/PageHeader';
import { DataTable, type DataTableColumn } from '@/components/DataTable';
import { Badge } from '@/components/Badge';
import { adminApi } from '@/lib/apiClient';
import { getApiErrorMessage } from '@/lib/errorMessage';
import type { ResidentPaymentOut } from '@indwella/sdk';

export default function ResidentPaymentsPage() {
  const [payments, setPayments] = useState<ResidentPaymentOut[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // GET /admin/resident-payments' response shape is now confirmed as
  // { payments: ResidentPaymentOut[] } (see ResidentPaymentOut's comment) -
  // this unwrapper is kept as a defensive fallback for other envelope shapes
  // rather than reading `data.payments` directly, so a future backend change
  // still surfaces its raw shape in the error banner instead of crashing.
  // See docs/ENGINEERING-HANDOFF.md.
  const extractPayments = (data: unknown): ResidentPaymentOut[] => {
    if (Array.isArray(data)) return data;
    if (data && typeof data === 'object') {
      for (const key of ['items', 'results', 'data', 'payments', 'resident_payments']) {
        const value = (data as Record<string, unknown>)[key];
        if (Array.isArray(value)) return value as ResidentPaymentOut[];
      }
    }
    throw new Error(
      `Unexpected response shape from /admin/resident-payments (not an array, and no items/results/data/payments key found): ${JSON.stringify(data)?.slice(0, 500)}`
    );
  };

  const load = async () => {
    setLoading(true);
    setError(null);
    try {
      const { data } = await adminApi.getResidentPayments();
      setPayments(extractPayments(data));
    } catch (err: any) {
      setError(getApiErrorMessage(err, 'Could not load resident payments.'));
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    load();
  }, []);

  const columns: DataTableColumn<ResidentPaymentOut>[] = [
    { key: 'resident', header: 'Resident', render: (r) => r.resident_name ?? `#${r.resident_id}` },
    { key: 'house_address', header: 'Address', render: (r) => r.house_address ?? '—' },
    { key: 'name', header: 'Charge', render: (r) => r.name },
    {
      key: 'amount',
      header: 'Amount',
      render: (r) => new Intl.NumberFormat('en-NG', { style: 'currency', currency: 'NGN' }).format(r.amount),
    },
    // This endpoint has no status field - every item observed so far carries
    // paid_at plus both transaction ids, i.e. it's a completed-payments list,
    // not one with a pending/failed state. See ResidentPaymentOut's comment.
    { key: 'status', header: 'Status', render: () => <Badge status="paid" /> },
    {
      key: 'date',
      header: 'Date',
      render: (r) => (r.paid_at ? new Date(r.paid_at).toLocaleString() : '—'),
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

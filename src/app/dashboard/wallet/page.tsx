'use client';

import { useEffect, useState } from 'react';
import { PageHeader } from '@/components/PageHeader';
import { StatCard } from '@/components/StatCard';
import { DataTable, type DataTableColumn } from '@/components/DataTable';
import { Badge } from '@/components/Badge';
import { Wallet } from 'lucide-react';
import { adminApi } from '@/lib/apiClient';

interface WalletTxRow {
  id: number;
  amount?: number;
  status?: string;
  reference?: string;
  created_at?: string;
  [key: string]: unknown;
}

export default function WalletPage() {
  const [balance, setBalance] = useState<number | null>(null);
  const [transactions, setTransactions] = useState<WalletTxRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [withdrawAmount, setWithdrawAmount] = useState('');
  const [withdrawing, setWithdrawing] = useState(false);
  const [message, setMessage] = useState<string | null>(null);

  const load = async () => {
    setLoading(true);
    const [walletRes, txRes] = await Promise.allSettled([
      adminApi.getEstateWallet(),
      adminApi.getEstateWalletTransactions(),
    ]);
    if (walletRes.status === 'fulfilled') {
      const b = (walletRes.value.data as { balance?: number })?.balance;
      if (typeof b === 'number') setBalance(b);
    }
    if (txRes.status === 'fulfilled') {
      const data = txRes.value.data as { transactions?: WalletTxRow[] } | WalletTxRow[];
      setTransactions(Array.isArray(data) ? data : data.transactions ?? []);
    }
    setLoading(false);
  };

  useEffect(() => {
    load();
  }, []);

  const handleWithdraw = async (e: React.FormEvent) => {
    e.preventDefault();
    setWithdrawing(true);
    setMessage(null);
    try {
      await adminApi.withdrawFromEstateWallet({ amount: Number(withdrawAmount) });
      setMessage('Withdrawal request submitted.');
      setWithdrawAmount('');
      await load();
    } catch (err: any) {
      setMessage(err?.response?.data?.detail || 'Could not submit withdrawal.');
    } finally {
      setWithdrawing(false);
    }
  };

  const fmtCurrency = (n?: number) =>
    typeof n === 'number' ? new Intl.NumberFormat('en-NG', { style: 'currency', currency: 'NGN' }).format(n) : '—';

  const columns: DataTableColumn<WalletTxRow>[] = [
    { key: 'reference', header: 'Reference' },
    { key: 'amount', header: 'Amount', render: (r) => fmtCurrency(r.amount) },
    { key: 'status', header: 'Status', render: (r) => <Badge status={r.status ?? 'pending'} /> },
    { key: 'created_at', header: 'Date', render: (r) => (r.created_at ? new Date(r.created_at).toLocaleString() : '—') },
  ];

  return (
    <div>
      <PageHeader title="Estate wallet" subtitle="Funds collected from residents via service charges." />

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
        <div className="lg:col-span-1">
          <StatCard label="Available balance" value={loading ? '—' : fmtCurrency(balance ?? undefined)} icon={Wallet} />

          <form onSubmit={handleWithdraw} className="card mt-4 space-y-3">
            <h3 className="font-semibold text-ink-900">Withdraw</h3>
            {message && <p className="text-sm text-ink-600">{message}</p>}
            <input
              type="number"
              min={0}
              required
              value={withdrawAmount}
              onChange={(e) => setWithdrawAmount(e.target.value)}
              placeholder="Amount (NGN)"
              className="input-field"
            />
            <button type="submit" disabled={withdrawing} className="btn-primary w-full">
              {withdrawing ? 'Submitting…' : 'Request withdrawal'}
            </button>
          </form>
        </div>

        <div className="lg:col-span-2">
          <h3 className="mb-3 font-semibold text-ink-900">Recent transactions</h3>
          <DataTable columns={columns} rows={transactions} isLoading={loading} emptyMessage="No transactions yet." />
        </div>
      </div>
    </div>
  );
}

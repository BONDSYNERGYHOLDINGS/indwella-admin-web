'use client';

import { useEffect, useRef, useState } from 'react';
import { PageHeader } from '@/components/PageHeader';
import { StatCard } from '@/components/StatCard';
import { DataTable, type DataTableColumn } from '@/components/DataTable';
import { Badge } from '@/components/Badge';
import { Wallet } from 'lucide-react';
import { adminApi } from '@/lib/apiClient';
import { getApiErrorMessage } from '@/lib/errorMessage';
import { generateIdempotencyKey, type BankAccountUpdateRequest } from '@indwella/sdk';

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
  const [withdrawReason, setWithdrawReason] = useState('');
  const [withdrawing, setWithdrawing] = useState(false);
  const [message, setMessage] = useState<string | null>(null);
  const idempotencyKeyRef = useRef<string | null>(null);

  const [bankForm, setBankForm] = useState<BankAccountUpdateRequest>({
    account_name: '',
    account_number: '',
    bank_code: '',
    bank_name: '',
  });
  const [savingBank, setSavingBank] = useState(false);
  const [bankMessage, setBankMessage] = useState<string | null>(null);

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

  const loadBankAccount = async () => {
    try {
      const { data } = await adminApi.getEstateBankAccount();
      setBankForm({
        account_name: data.account_name ?? '',
        account_number: data.account_number ?? '',
        bank_code: data.bank_code ?? '',
        bank_name: data.bank_name ?? '',
      });
    } catch {
      // No bank account configured yet - treat "not set" as normal and leave the form empty.
    }
  };

  useEffect(() => {
    load();
    loadBankAccount();
  }, []);

  const handleWithdraw = async (e: React.FormEvent) => {
    e.preventDefault();
    setWithdrawing(true);
    setMessage(null);
    // Generate the key once per distinct withdrawal attempt. A retry of a failed
    // request reuses the same key (that's the point of idempotency); a genuinely
    // new withdrawal gets a fresh key after success or when the amount changes.
    if (idempotencyKeyRef.current === null) {
      idempotencyKeyRef.current = generateIdempotencyKey('withdraw');
    }
    try {
      const reason = withdrawReason.trim();
      await adminApi.withdrawFromEstateWallet(
        { amount: Number(withdrawAmount), ...(reason ? { reason } : {}) },
        idempotencyKeyRef.current,
      );
      setMessage('Withdrawal request submitted.');
      setWithdrawAmount('');
      setWithdrawReason('');
      idempotencyKeyRef.current = null;
      await load();
    } catch (err: any) {
      setMessage(getApiErrorMessage(err, 'Could not submit withdrawal.'));
    } finally {
      setWithdrawing(false);
    }
  };

  const handleSaveBank = async (e: React.FormEvent) => {
    e.preventDefault();
    setSavingBank(true);
    setBankMessage(null);
    try {
      await adminApi.setEstateBankAccount(bankForm);
      setBankMessage('Payout bank account saved.');
      await loadBankAccount();
    } catch (err: any) {
      setBankMessage(getApiErrorMessage(err, 'Could not save bank account.'));
    } finally {
      setSavingBank(false);
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
              onChange={(e) => {
                setWithdrawAmount(e.target.value);
                // A changed amount is a new operation - force a fresh key next attempt.
                idempotencyKeyRef.current = null;
              }}
              placeholder="Amount (NGN)"
              className="input-field"
            />
            <input
              type="text"
              value={withdrawReason}
              onChange={(e) => {
                setWithdrawReason(e.target.value);
                // Reason is part of the request - a changed reason is a new operation too.
                idempotencyKeyRef.current = null;
              }}
              placeholder="Reason (optional)"
              className="input-field"
            />
            <button type="submit" disabled={withdrawing} className="btn-primary w-full">
              {withdrawing ? 'Submitting…' : 'Request withdrawal'}
            </button>
          </form>

          <form onSubmit={handleSaveBank} className="card mt-4 space-y-3">
            <h3 className="font-semibold text-ink-900">Payout bank account</h3>
            {bankMessage && <p className="text-sm text-ink-600">{bankMessage}</p>}
            <div>
              <label className="mb-1.5 block text-sm font-medium text-ink-700">Account name</label>
              <input
                required
                value={bankForm.account_name}
                onChange={(e) => setBankForm((f) => ({ ...f, account_name: e.target.value }))}
                className="input-field"
              />
            </div>
            <div>
              <label className="mb-1.5 block text-sm font-medium text-ink-700">Account number</label>
              <input
                required
                value={bankForm.account_number}
                onChange={(e) => setBankForm((f) => ({ ...f, account_number: e.target.value }))}
                className="input-field"
              />
            </div>
            <div>
              <label className="mb-1.5 block text-sm font-medium text-ink-700">Bank code</label>
              <input
                required
                value={bankForm.bank_code}
                onChange={(e) => setBankForm((f) => ({ ...f, bank_code: e.target.value }))}
                className="input-field"
              />
            </div>
            <div>
              <label className="mb-1.5 block text-sm font-medium text-ink-700">Bank name</label>
              <input
                required
                value={bankForm.bank_name}
                onChange={(e) => setBankForm((f) => ({ ...f, bank_name: e.target.value }))}
                className="input-field"
              />
            </div>
            <button type="submit" disabled={savingBank} className="btn-primary w-full">
              {savingBank ? 'Saving…' : 'Save bank account'}
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

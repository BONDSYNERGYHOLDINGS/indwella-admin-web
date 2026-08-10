'use client';

import { useEffect, useState } from 'react';
import { Users, ShieldCheck, ReceiptText, Wallet } from 'lucide-react';
import { PageHeader } from '@/components/PageHeader';
import { StatCard } from '@/components/StatCard';
import { adminApi } from '@/lib/apiClient';

export default function DashboardOverviewPage() {
  const [loading, setLoading] = useState(true);
  const [residentCount, setResidentCount] = useState<number | null>(null);
  const [deviceCount, setDeviceCount] = useState<number | null>(null);
  const [chargeCount, setChargeCount] = useState<number | null>(null);
  const [walletBalance, setWalletBalance] = useState<number | null>(null);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      const results = await Promise.allSettled([
        adminApi.getResidentsCount(),
        adminApi.getSecurityDevices(),
        adminApi.listServiceCharges(),
        adminApi.getEstateWallet(),
      ]);
      if (cancelled) return;

      const [residents, devices, charges, wallet] = results;
      if (residents.status === 'fulfilled') {
        // Count field read defensively pending backend /openapi.json confirmation:
        // tolerates { total }, { count }, or a bare number without breaking on shape drift.
        const d = residents.value.data as any;
        const n =
          typeof d?.total === 'number'
            ? d.total
            : typeof d?.count === 'number'
              ? d.count
              : typeof d === 'number'
                ? d
                : null;
        if (n !== null) setResidentCount(n);
      }
      if (devices.status === 'fulfilled') setDeviceCount(devices.value.data.length);
      if (charges.status === 'fulfilled') setChargeCount(charges.value.data.length);
      if (wallet.status === 'fulfilled') {
        const balance = (wallet.value.data as { balance?: number })?.balance;
        if (typeof balance === 'number') setWalletBalance(balance);
      }
      setLoading(false);
    })();
    return () => {
      cancelled = true;
    };
  }, []);

  const fmt = (n: number | null) => (loading || n === null ? '—' : n.toLocaleString());
  const fmtCurrency = (n: number | null) =>
    loading || n === null ? '—' : new Intl.NumberFormat('en-NG', { style: 'currency', currency: 'NGN' }).format(n);

  return (
    <div>
      <PageHeader title="Overview" subtitle="A snapshot of your estate right now." />
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <StatCard label="Residents" value={fmt(residentCount)} icon={Users} />
        <StatCard label="Security devices" value={fmt(deviceCount)} icon={ShieldCheck} />
        <StatCard label="Active service charges" value={fmt(chargeCount)} icon={ReceiptText} />
        <StatCard label="Estate wallet balance" value={fmtCurrency(walletBalance)} icon={Wallet} />
      </div>

      <div className="mt-8 grid grid-cols-1 gap-6 lg:grid-cols-2">
        <div className="card">
          <h3 className="font-semibold text-ink-900">Quick actions</h3>
          <p className="mt-1 text-sm text-ink-500">Common tasks, one click away.</p>
          <div className="mt-4 flex flex-wrap gap-3">
            <a href="/dashboard/residents" className="btn-secondary">Review pending residents</a>
            <a href="/dashboard/service-charges" className="btn-secondary">Create a service charge</a>
            <a href="/dashboard/security" className="btn-secondary">Generate security code</a>
          </div>
        </div>
        <div className="card">
          <h3 className="font-semibold text-ink-900">Need something else?</h3>
          <p className="mt-1 text-sm text-ink-500">
            This dashboard talks directly to the same Indwella API used by the resident and security
            mobile apps - nothing here is mocked.
          </p>
        </div>
      </div>
    </div>
  );
}

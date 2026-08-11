'use client';

import { useEffect, useState } from 'react';
import { PageHeader } from '@/components/PageHeader';
import { adminApi } from '@/lib/apiClient';

export default function ElectricityPage() {
  const [pricePerKwh, setPricePerKwh] = useState('');
  const [currency, setCurrency] = useState('NGN');
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState<string | null>(null);

  useEffect(() => {
    (async () => {
      try {
        const { data } = await adminApi.getElectricityTariff();
        setPricePerKwh(String(data.price_per_kwh));
        setCurrency(data.currency ?? 'NGN');
      } catch {
        // No tariff configured yet - leave fields blank for the admin to set one.
      } finally {
        setLoading(false);
      }
    })();
  }, []);

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    setMessage(null);
    try {
      await adminApi.setElectricityTariff({ price_per_kwh: Number(pricePerKwh), currency });
      setMessage('Tariff updated.');
    } catch (err: any) {
      setMessage(err?.response?.data?.detail || 'Could not update tariff.');
    } finally {
      setSaving(false);
    }
  };

  return (
    <div>
      <PageHeader title="Electricity" subtitle="Set the price per kWh residents pay when they buy electricity." />
      <form onSubmit={handleSave} className="card max-w-md space-y-4">
        {message && <p className="text-sm text-ink-600">{message}</p>}
        <div>
          <label className="mb-1.5 block text-sm font-medium text-ink-700">Price per kWh</label>
          <input
            required
            disabled={loading}
            type="number"
            step="0.01"
            min={0}
            value={pricePerKwh}
            onChange={(e) => setPricePerKwh(e.target.value)}
            className="input-field"
          />
        </div>
        <div>
          <label className="mb-1.5 block text-sm font-medium text-ink-700">Currency</label>
          <input
            disabled={loading}
            value={currency}
            onChange={(e) => setCurrency(e.target.value)}
            className="input-field"
            maxLength={3}
          />
        </div>
        <button type="submit" disabled={saving || loading} className="btn-primary">
          {saving ? 'Saving…' : 'Save tariff'}
        </button>
      </form>
    </div>
  );
}

'use client';

import { useEffect, useState } from 'react';
import { Copy, Check } from 'lucide-react';
import { PageHeader } from '@/components/PageHeader';
import { DataTable, type DataTableColumn } from '@/components/DataTable';
import { adminApi } from '@/lib/apiClient';
import { getApiErrorMessage } from '@/lib/errorMessage';
import type { SecurityDeviceOut } from '@indwella/sdk';

function CopyableCode({ code, className = '' }: { code: string; className?: string }) {
  const [copied, setCopied] = useState(false);

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(code);
      setCopied(true);
      setTimeout(() => setCopied(false), 1500);
    } catch {
      // Clipboard API can fail (permissions, non-HTTPS context) - this is a
      // low-stakes convenience action, so fail silently rather than showing
      // an error banner for it.
    }
  };

  return (
    <button
      type="button"
      onClick={handleCopy}
      title={copied ? 'Copied!' : 'Click to copy'}
      className={`inline-flex items-center gap-1.5 rounded-md transition hover:opacity-70 ${className}`}>
      <span>{code}</span>
      {copied ? (
        <Check size={15} className="text-emerald-600" />
      ) : (
        <Copy size={15} className="text-ink-400" />
      )}
    </button>
  );
}

export default function SecurityPage() {
  const [devices, setDevices] = useState<SecurityDeviceOut[]>([]);
  const [loading, setLoading] = useState(true);
  const [generating, setGenerating] = useState(false);
  const [newCode, setNewCode] = useState<string | null>(null);
  const [removingId, setRemovingId] = useState<string | null>(null);
  const [currentCode, setCurrentCode] = useState<string | null>(null);
  const [codeLoading, setCodeLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const load = async () => {
    setLoading(true);
    try {
      const { data } = await adminApi.getSecurityDevices();
      setDevices(data);
    } catch (err: any) {
      setError(getApiErrorMessage(err, 'Could not load security devices.'));
    } finally {
      setLoading(false);
    }
  };

  const loadCurrentCode = async () => {
    setCodeLoading(true);
    try {
      const { data } = await adminApi.getSecurityCode();
      setCurrentCode(data?.security_code || null);
    } catch {
      setCurrentCode(null);
    } finally {
      setCodeLoading(false);
    }
  };

  useEffect(() => {
    load();
    loadCurrentCode();
  }, []);

  const handleGenerate = async () => {
    setGenerating(true);
    setNewCode(null);
    setError(null);
    try {
      const { data } = await adminApi.generateSecurityCode();
      setNewCode(data.security_code);
      await loadCurrentCode();
    } catch (err: any) {
      setError(getApiErrorMessage(err, 'Could not generate a new security code. Please Try again later.'));
    } finally {
      setGenerating(false);
    }
  };

  const handleRemove = async (deviceId: string) => {
    setRemovingId(deviceId);
    setError(null);
    try {
      await adminApi.removeSecurityDevice(deviceId);
      await load();
    } catch (err: any) {
      setError(getApiErrorMessage(err, 'Could not revoke this security device.'));
    } finally {
      setRemovingId(null);
    }
  };

  const columns: DataTableColumn<SecurityDeviceOut & { id: string }>[] = [
    { key: 'device_label', header: 'Label' },
    { key: 'device_name', header: 'Device' },
    { key: 'device_brand', header: 'Brand' },
    {
      key: 'security_code',
      header: 'Security code',
      render: (d) => <CopyableCode code={d.security_code} className="font-mono text-sm text-ink-900" />,
    },
    {
      key: 'actions',
      header: '',
      render: (d) => (
        <button
          disabled={removingId === d.device_id}
          onClick={() => handleRemove(d.device_id)}
          className="rounded-md bg-red-50 px-2.5 py-1.5 text-xs font-semibold text-red-700 hover:bg-red-100 disabled:opacity-50">
          Revoke
        </button>
      ),
    },
  ];

  return (
    <div>
      <PageHeader
        title="Security devices"
        subtitle="Devices used by your security team to check in visitors."
        action={
          <button onClick={handleGenerate} disabled={generating} className="btn-primary">
            {generating ? 'Generating…' : 'Generate new code'}
          </button>
        }
      />
      {error && (
        <div className="mb-4 rounded-lg border border-red-200 bg-red-50 px-3.5 py-2.5 text-sm text-red-700">
          {error}
        </div>
      )}
      <div className="card mb-6 flex items-center justify-between">
        <div>
          <p className="text-sm font-medium text-ink-700">Current active security code</p>
          {codeLoading ? (
            <p className="mt-1 text-sm text-ink-500">Loading…</p>
          ) : currentCode ? (
            <CopyableCode code={currentCode} className="mt-1 font-mono text-lg font-bold text-ink-900" />
          ) : (
            <p className="mt-1 text-sm text-ink-500">No active security code</p>
          )}
        </div>
        <button onClick={loadCurrentCode} disabled={codeLoading} className="btn-secondary">
          {codeLoading ? 'Refreshing…' : 'Refresh'}
        </button>
      </div>
      {newCode && (
        <div className="card mb-6 flex items-center justify-between border-brand-200 bg-brand-50">
          <div>
            <p className="text-sm font-medium text-brand-700">New security device code</p>
            <CopyableCode code={newCode} className="mt-1 font-mono text-lg font-bold text-brand-800" />
          </div>
          <p className="max-w-xs text-xs text-brand-700/80">
            Share this code with the security guard's device. It will be consumed the first time they log
            in with it.
          </p>
        </div>
      )}
      <DataTable
        columns={columns}
        rows={devices.map((d) => ({ ...d, id: d.device_id }))}
        isLoading={loading}
        emptyMessage="No security devices registered yet."
      />
    </div>
  );
}

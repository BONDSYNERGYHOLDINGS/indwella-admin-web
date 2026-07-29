'use client';

import { useEffect, useState } from 'react';
import { PageHeader } from '@/components/PageHeader';
import { DataTable, type DataTableColumn } from '@/components/DataTable';
import { adminApi } from '@/lib/apiClient';
import type { SecurityDeviceOut } from '@indwella/types';

export default function SecurityPage() {
  const [devices, setDevices] = useState<SecurityDeviceOut[]>([]);
  const [loading, setLoading] = useState(true);
  const [generating, setGenerating] = useState(false);
  const [newCode, setNewCode] = useState<string | null>(null);
  const [removingId, setRemovingId] = useState<string | null>(null);

  const load = async () => {
    setLoading(true);
    try {
      const { data } = await adminApi.getSecurityDevices();
      setDevices(data);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    load();
  }, []);

  const handleGenerate = async () => {
    setGenerating(true);
    setNewCode(null);
    try {
      const { data } = await adminApi.generateSecurityCode();
      setNewCode(data);
    } finally {
      setGenerating(false);
    }
  };

  const handleRemove = async (deviceId: string) => {
    setRemovingId(deviceId);
    try {
      await adminApi.removeSecurityDevice(deviceId);
      await load();
    } finally {
      setRemovingId(null);
    }
  };

  const columns: DataTableColumn<SecurityDeviceOut & { id: string }>[] = [
    { key: 'device_label', header: 'Label' },
    { key: 'device_name', header: 'Device' },
    { key: 'device_brand', header: 'Brand' },
    { key: 'security_code', header: 'Security code' },
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
      {newCode && (
        <div className="card mb-6 flex items-center justify-between border-brand-200 bg-brand-50">
          <div>
            <p className="text-sm font-medium text-brand-700">New security device code</p>
            <p className="mt-1 font-mono text-lg font-bold text-brand-800">{newCode}</p>
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

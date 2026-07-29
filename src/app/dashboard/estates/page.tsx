'use client';

import { useEffect, useState } from 'react';
import { PageHeader } from '@/components/PageHeader';
import { DataTable, type DataTableColumn } from '@/components/DataTable';
import { useAuth } from '@/lib/auth-context';
import { superAdminApi } from '@/lib/apiClient';

interface EstateRow {
  id: number;
  name?: string;
  admin_email?: string;
  [key: string]: unknown;
}

export default function EstatesPage() {
  const { role } = useAuth();
  const [estates, setEstates] = useState<EstateRow[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (role !== 'superadmin') return;
    (async () => {
      try {
        const { data } = await superAdminApi.listEstates();
        setEstates(data as EstateRow[]);
      } finally {
        setLoading(false);
      }
    })();
  }, [role]);

  if (role !== 'superadmin') {
    return (
      <div className="card">
        <p className="text-ink-600">This section is only available to super admins.</p>
      </div>
    );
  }

  const columns: DataTableColumn<EstateRow>[] = [
    { key: 'name', header: 'Estate' },
    { key: 'admin_email', header: 'Assigned admin' },
  ];

  return (
    <div>
      <PageHeader title="Estates" subtitle="Every estate on the platform and its assigned admin." />
      <DataTable columns={columns} rows={estates} isLoading={loading} emptyMessage="No estates yet." />
    </div>
  );
}

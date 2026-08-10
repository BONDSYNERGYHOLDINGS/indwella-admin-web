'use client';

import { useEffect, useRef, useState } from 'react';
import { PageHeader } from '@/components/PageHeader';
import { DataTable, type DataTableColumn } from '@/components/DataTable';
import { Badge } from '@/components/Badge';
import { adminApi } from '@/lib/apiClient';
import type { ServiceChargeOut, ServiceChargeCreateRequest, ServiceChargeUpdateRequest } from '@indwella/sdk';

const emptyForm: ServiceChargeCreateRequest = {
  name: '',
  description: '',
  charge_type: 'recurring',
  amount: 0,
  frequency: 'monthly',
  due_date: null,
  applies_to_all: true,
};

const emptyEdit: ServiceChargeUpdateRequest = {
  name: '',
  description: '',
  amount: 0,
  due_date: null,
  is_active: true,
};

export default function ServiceChargesPage() {
  const [charges, setCharges] = useState<ServiceChargeOut[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState<ServiceChargeCreateRequest>(emptyForm);
  const [editingId, setEditingId] = useState<number | null>(null);
  const [editForm, setEditForm] = useState<ServiceChargeUpdateRequest>(emptyEdit);
  const [search, setSearch] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const isEditing = editingId !== null;

  const load = async (q: string = search) => {
    setLoading(true);
    try {
      const trimmed = q.trim();
      const { data } = trimmed
        ? await adminApi.searchServiceCharges(trimmed)
        : await adminApi.listServiceCharges();
      setCharges(data);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    load();
  }, []);

  const firstSearch = useRef(true);
  useEffect(() => {
    if (firstSearch.current) {
      firstSearch.current = false;
      return;
    }
    const t = setTimeout(() => load(search), 350);
    return () => clearTimeout(t);
  }, [search]);

  const startEdit = (c: ServiceChargeOut) => {
    setEditingId(c.id);
    setEditForm({
      name: c.name,
      description: c.description ?? '',
      amount: c.amount,
      due_date: c.due_date ?? null,
      is_active: c.is_active,
    });
    setShowForm(false);
    setError(null);
  };

  const cancelEdit = () => {
    setEditingId(null);
    setEditForm(emptyEdit);
    setError(null);
  };

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);
    setError(null);
    try {
      await adminApi.createServiceCharge(form);
      setForm(emptyForm);
      setShowForm(false);
      await load();
    } catch (err: any) {
      setError(err?.response?.data?.detail || 'Could not create service charge.');
    } finally {
      setSubmitting(false);
    }
  };

  const handleUpdate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (editingId === null) return;
    setSubmitting(true);
    setError(null);
    try {
      await adminApi.updateServiceCharge(editingId, editForm);
      cancelEdit();
      await load();
    } catch (err: any) {
      setError(err?.response?.data?.detail || 'Could not update service charge.');
    } finally {
      setSubmitting(false);
    }
  };

  const handleDelete = async (id: number) => {
    await adminApi.deleteServiceCharge(id);
    await load();
  };

  const columns: DataTableColumn<ServiceChargeOut>[] = [
    { key: 'name', header: 'Name' },
    { key: 'charge_type', header: 'Type', render: (c) => <span className="capitalize">{c.charge_type.replace('_', ' ')}</span> },
    {
      key: 'amount',
      header: 'Amount',
      render: (c) => new Intl.NumberFormat('en-NG', { style: 'currency', currency: 'NGN' }).format(c.amount),
    },
    { key: 'frequency', header: 'Frequency', render: (c) => c.frequency ?? '—' },
    { key: 'is_active', header: 'Status', render: (c) => <Badge status={c.is_active ? 'active' : 'pending'} /> },
    {
      key: 'actions',
      header: '',
      render: (c) => (
        <div className="flex gap-2">
          <button
            onClick={() => startEdit(c)}
            className="rounded-md bg-ink-50 px-2.5 py-1.5 text-xs font-semibold text-ink-700 hover:bg-ink-100">
            Edit
          </button>
          <button
            onClick={() => handleDelete(c.id)}
            className="rounded-md bg-red-50 px-2.5 py-1.5 text-xs font-semibold text-red-700 hover:bg-red-100">
            Delete
          </button>
        </div>
      ),
    },
  ];

  return (
    <div>
      <PageHeader
        title="Service charges"
        subtitle="Bill residents for maintenance, security, and other recurring fees."
        action={
          <button
            onClick={() => (isEditing ? cancelEdit() : setShowForm((s) => !s))}
            className="btn-primary">
            {isEditing || showForm ? 'Cancel' : 'New service charge'}
          </button>
        }
      />

      {(showForm || isEditing) && (
        <form onSubmit={isEditing ? handleUpdate : handleCreate} className="card mb-6 space-y-4">
          {error && <div className="rounded-lg border border-red-200 bg-red-50 px-3.5 py-2.5 text-sm text-red-700">{error}</div>}
          {isEditing ? (
            <>
              <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                <div>
                  <label className="mb-1.5 block text-sm font-medium text-ink-700">Name</label>
                  <input
                    required
                    value={editForm.name ?? ''}
                    onChange={(e) => setEditForm({ ...editForm, name: e.target.value })}
                    className="input-field"
                    placeholder="e.g. Estate Security Levy"
                  />
                </div>
                <div>
                  <label className="mb-1.5 block text-sm font-medium text-ink-700">Amount (NGN)</label>
                  <input
                    required
                    type="number"
                    min={0}
                    value={editForm.amount ?? 0}
                    onChange={(e) => setEditForm({ ...editForm, amount: Number(e.target.value) })}
                    className="input-field"
                  />
                </div>
                <div>
                  <label className="mb-1.5 block text-sm font-medium text-ink-700">Due date (optional)</label>
                  <input
                    type="date"
                    value={editForm.due_date ?? ''}
                    onChange={(e) => setEditForm({ ...editForm, due_date: e.target.value || null })}
                    className="input-field"
                  />
                </div>
                <div>
                  <label className="mb-1.5 block text-sm font-medium text-ink-700">Status</label>
                  <select
                    value={editForm.is_active ? 'active' : 'inactive'}
                    onChange={(e) => setEditForm({ ...editForm, is_active: e.target.value === 'active' })}
                    className="input-field">
                    <option value="active">Active</option>
                    <option value="inactive">Inactive</option>
                  </select>
                </div>
              </div>
              <div>
                <label className="mb-1.5 block text-sm font-medium text-ink-700">Description (optional)</label>
                <textarea
                  value={editForm.description ?? ''}
                  onChange={(e) => setEditForm({ ...editForm, description: e.target.value })}
                  className="input-field"
                  rows={2}
                />
              </div>
            </>
          ) : (
            <>
              <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                <div>
                  <label className="mb-1.5 block text-sm font-medium text-ink-700">Name</label>
                  <input
                    required
                    value={form.name}
                    onChange={(e) => setForm({ ...form, name: e.target.value })}
                    className="input-field"
                    placeholder="e.g. Estate Security Levy"
                  />
                </div>
                <div>
                  <label className="mb-1.5 block text-sm font-medium text-ink-700">Amount (NGN)</label>
                  <input
                    required
                    type="number"
                    min={0}
                    value={form.amount}
                    onChange={(e) => setForm({ ...form, amount: Number(e.target.value) })}
                    className="input-field"
                  />
                </div>
                <div>
                  <label className="mb-1.5 block text-sm font-medium text-ink-700">Charge type</label>
                  <select
                    value={form.charge_type}
                    onChange={(e) => setForm({ ...form, charge_type: e.target.value as ServiceChargeCreateRequest['charge_type'] })}
                    className="input-field">
                    <option value="recurring">Recurring</option>
                    <option value="one_off">One-off</option>
                  </select>
                </div>
                {form.charge_type === 'recurring' && (
                  <div>
                    <label className="mb-1.5 block text-sm font-medium text-ink-700">Frequency</label>
                    <select
                      value={form.frequency ?? 'monthly'}
                      onChange={(e) => setForm({ ...form, frequency: e.target.value as ServiceChargeCreateRequest['frequency'] })}
                      className="input-field">
                      <option value="monthly">Monthly</option>
                      <option value="quarterly">Quarterly</option>
                      <option value="yearly">Yearly</option>
                    </select>
                  </div>
                )}
              </div>
              <div>
                <label className="mb-1.5 block text-sm font-medium text-ink-700">Description (optional)</label>
                <textarea
                  value={form.description ?? ''}
                  onChange={(e) => setForm({ ...form, description: e.target.value })}
                  className="input-field"
                  rows={2}
                />
              </div>
            </>
          )}
          <div className="flex items-center gap-3">
            <button type="submit" disabled={submitting} className="btn-primary">
              {isEditing
                ? submitting
                  ? 'Saving…'
                  : 'Save changes'
                : submitting
                  ? 'Creating…'
                  : 'Create service charge'}
            </button>
            {isEditing && (
              <button type="button" onClick={cancelEdit} className="btn-secondary">
                Cancel
              </button>
            )}
          </div>
        </form>
      )}

      <div className="mb-4">
        <input
          type="search"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="input-field max-w-sm"
          placeholder="Search service charges…"
        />
      </div>

      <DataTable columns={columns} rows={charges} isLoading={loading} emptyMessage="No service charges yet." />
    </div>
  );
}

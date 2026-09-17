const STATUS_STYLES: Record<string, string> = {
  approved: 'bg-emerald-50 text-emerald-700',
  confirmed: 'bg-emerald-50 text-emerald-700',
  success: 'bg-emerald-50 text-emerald-700',
  active: 'bg-emerald-50 text-emerald-700',
  paid: 'bg-emerald-50 text-emerald-700',
  pending: 'bg-amber-50 text-amber-700',
  processing: 'bg-amber-50 text-amber-700',
  rejected: 'bg-red-50 text-red-700',
  failed: 'bg-red-50 text-red-700',
  reversed: 'bg-ink-100 text-ink-600',
};

export function Badge({ status }: { status: string }) {
  const style = STATUS_STYLES[status?.toLowerCase()] ?? 'bg-ink-100 text-ink-600';
  return (
    <span className={`inline-flex rounded-full px-2.5 py-1 text-xs font-semibold capitalize ${style}`}>
      {status}
    </span>
  );
}

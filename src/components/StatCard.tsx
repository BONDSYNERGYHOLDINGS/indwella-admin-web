import type { LucideIcon } from 'lucide-react';

export function StatCard({
  label,
  value,
  icon: Icon,
  trend,
}: {
  label: string;
  value: string;
  icon: LucideIcon;
  trend?: { value: string; positive: boolean };
}) {
  return (
    <div className="card flex items-start justify-between">
      <div>
        <p className="text-sm font-medium text-ink-500">{label}</p>
        <p className="mt-2 text-2xl font-bold text-ink-900">{value}</p>
        {trend && (
          <p className={`mt-2 text-xs font-medium ${trend.positive ? 'text-emerald-600' : 'text-red-600'}`}>
            {trend.value}
          </p>
        )}
      </div>
      <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-brand-50 text-brand-600">
        <Icon size={20} />
      </div>
    </div>
  );
}

'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import {
  LayoutDashboard,
  Users,
  ShieldCheck,
  ReceiptText,
  Wallet,
  Zap,
  Building2,
  Bell,
  Settings,
  LogOut,
} from 'lucide-react';
import { useAuth, type AdminRole } from '@/lib/auth-context';
import Image from 'next/image';

interface NavItem {
  href: string;
  label: string;
  icon: typeof LayoutDashboard;
  roles: AdminRole[];
}

const NAV_ITEMS: NavItem[] = [
  { href: '/dashboard', label: 'Overview', icon: LayoutDashboard, roles: ['admin', 'superadmin'] },
  { href: '/dashboard/residents', label: 'Residents', icon: Users, roles: ['admin', 'superadmin'] },
  { href: '/dashboard/security', label: 'Security', icon: ShieldCheck, roles: ['admin', 'superadmin'] },
  { href: '/dashboard/service-charges', label: 'Service Charges', icon: ReceiptText, roles: ['admin', 'superadmin'] },
  { href: '/dashboard/wallet', label: 'Wallet', icon: Wallet, roles: ['admin', 'superadmin'] },
  { href: '/dashboard/electricity', label: 'Electricity', icon: Zap, roles: ['admin', 'superadmin'] },
  { href: '/dashboard/estates', label: 'Estates', icon: Building2, roles: ['superadmin'] },
  { href: '/dashboard/notifications', label: 'Notifications', icon: Bell, roles: ['admin', 'superadmin'] },
  { href: '/dashboard/settings', label: 'Settings', icon: Settings, roles: ['admin', 'superadmin'] },
];

export function Sidebar() {
  const pathname = usePathname();
  const { role, logout } = useAuth();

  const visibleItems = NAV_ITEMS.filter((item) => !role || item.roles.includes(role));

  return (
    <aside className="flex h-screen w-64 flex-col border-r border-ink-100 bg-white">
      <div className="flex items-center gap-2 px-6 py-5">
        {/* <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-brand-500 text-sm font-bold text-white">
          I
        </div> */}
        <Image
        src="/indwella_icon.png"
        width={20}
        height={20}
        alt='Brand Identity'
        />
        <span className="text-lg font-bold text-ink-900">Indwella</span>
      </div>

      <nav className="flex-1 space-y-1 overflow-y-auto px-3 py-2">
        {visibleItems.map((item) => {
          const isActive = pathname === item.href || (item.href !== '/dashboard' && pathname?.startsWith(item.href));
          const Icon = item.icon;
          return (
            <Link
              key={item.href}
              href={item.href}
              className={`flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium transition ${
                isActive ? 'bg-brand-50 text-brand-700' : 'text-ink-600 hover:bg-ink-50 hover:text-ink-900'
              }`}>
              <Icon size={18} strokeWidth={2} />
              {item.label}
            </Link>
          );
        })}
      </nav>

      <div className="border-t border-ink-100 px-3 py-4">
        <button
          onClick={logout}
          className="flex w-full items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium text-ink-600 transition hover:bg-ink-50 hover:text-red-600">
          <LogOut size={18} strokeWidth={2} />
          Log out
        </button>
      </div>
    </aside>
  );
}

import React from 'react';
import Link from 'next/link';
import {
  LayoutDashboard,
  Building2,
  Users,
  CreditCard,
  Zap,
  BarChart3,
  Activity,
  ShieldAlert,
  Sparkles,
  LifeBuoy,
} from 'lucide-react';

const ADMIN_NAV_LINKS = [
  { href: '/admin', label: 'Overview', icon: LayoutDashboard },
  { href: '/admin/clinics', label: 'Clinics & Orgs', icon: Building2 },
  { href: '/admin/users', label: 'Users & Staff', icon: Users },
  { href: '/admin/subscriptions', label: 'Subscriptions', icon: CreditCard },
  { href: '/admin/usage', label: 'AI Usage & Cost', icon: Zap },
  { href: '/admin/analytics', label: 'Global Analytics', icon: BarChart3 },
  { href: '/admin/support', label: 'Support Desk', icon: LifeBuoy },
  { href: '/admin/system-health', label: 'System Health', icon: Activity },
  { href: '/admin/audit-logs', label: 'Audit Trail', icon: ShieldAlert },
];

export default function AdminLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="min-h-screen bg-slate-100 flex flex-col md:flex-row">
      {/* Admin Sidebar */}
      <aside className="w-full md:w-64 bg-slate-900 text-white flex flex-col shrink-0">
        <div className="p-6 border-b border-slate-800 flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-lg bg-purple-600 flex items-center justify-center text-white">
              <Sparkles className="w-4 h-4" />
            </div>
            <div>
              <span className="font-bold text-sm text-white tracking-tight">Radiant Nobel</span>
              <span className="block text-[10px] text-purple-400 font-bold uppercase tracking-wider">Super Admin</span>
            </div>
          </div>
        </div>

        <nav className="p-4 space-y-1 flex-1">
          {ADMIN_NAV_LINKS.map((link) => {
            const Icon = link.icon;
            return (
              <Link
                key={link.href}
                href={link.href}
                className="flex items-center gap-3 px-3.5 py-2.5 rounded-xl text-xs font-semibold text-slate-300 hover:text-white hover:bg-slate-800 transition-all"
              >
                <Icon className="w-4 h-4 text-slate-400 group-hover:text-white" />
                <span>{link.label}</span>
              </Link>
            );
          })}
        </nav>

        <div className="p-4 border-t border-slate-800">
          <Link
            href="/dashboard"
            className="flex items-center justify-center gap-2 w-full py-2 bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-bold rounded-xl transition-all"
          >
            Exit to Clinic App
          </Link>
        </div>
      </aside>

      {/* Main Content Area */}
      <main className="flex-1 overflow-y-auto">
        {children}
      </main>
    </div>
  );
}

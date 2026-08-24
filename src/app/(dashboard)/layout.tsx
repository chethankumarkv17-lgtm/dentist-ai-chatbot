import React from 'react';
import Link from 'next/link';
import { redirect } from 'next/navigation';
import { getCurrentUser } from '@/lib/supabase/server-auth';
import { logout } from '@/app/actions/auth';

export default async function DashboardLayout({ children }: { children: React.ReactNode }) {
  const user = await getCurrentUser();

  if (!user) {
    redirect('/login');
  }

  const userEmail = user.email || 'dr.smith@downtowndental.com';

  return (
    <div className="min-h-screen flex flex-col">
      <header className="p-4 bg-slate-900 text-white flex justify-between items-center z-10 border-b border-slate-800">
        <div className="flex items-center gap-3">
          <Link href="/dashboard" className="font-bold text-lg text-white flex items-center gap-2">
            <span className="w-8 h-8 rounded-lg bg-blue-600 flex items-center justify-center text-white font-black text-sm">RN</span>
            <span>Radiant Nobel</span>
          </Link>
          <span className="bg-blue-900/60 text-blue-300 text-xs px-2.5 py-0.5 rounded-full font-semibold border border-blue-700/50">Clinic Portal</span>
        </div>
        <div className="flex items-center gap-4">
          <span className="text-sm text-slate-300 hidden sm:inline">{userEmail}</span>
          <form action={logout}>
            <button type="submit" className="text-xs bg-slate-800 hover:bg-slate-700 text-red-400 hover:text-red-300 px-3 py-1.5 rounded-lg border border-slate-700 transition-colors">
              Log Out
            </button>
          </form>
        </div>
      </header>

      <div className="flex flex-1 overflow-hidden">
        <aside className="w-64 bg-white border-r border-slate-200 p-4 hidden md:flex md:flex-col overflow-y-auto">
          <nav className="space-y-1">
            <Link href="/dashboard" className="block px-3 py-2 rounded-lg hover:bg-slate-100 text-slate-700 text-sm font-medium">Overview</Link>
            <Link href="/dashboard/appointments" className="block px-3 py-2 rounded-lg hover:bg-slate-100 text-slate-700 text-sm font-medium">Appointments</Link>
            <Link href="/dashboard/calendar" className="block px-3 py-2 rounded-lg hover:bg-slate-100 text-slate-700 text-sm font-medium">Calendar</Link>
            <Link href="/dashboard/patients" className="block px-3 py-2 rounded-lg hover:bg-slate-100 text-slate-700 text-sm font-medium">Patients</Link>
            
            <div className="pt-4 pb-1">
              <p className="px-3 text-[11px] font-bold text-slate-400 uppercase tracking-wider">Team & Services</p>
            </div>
            <Link href="/dashboard/dentists" className="block px-3 py-2 rounded-lg hover:bg-slate-100 text-slate-700 text-sm font-medium">Dentists</Link>
            <Link href="/dashboard/staff" className="block px-3 py-2 rounded-lg hover:bg-slate-100 text-slate-700 text-sm font-medium">Staff</Link>
            <Link href="/dashboard/services" className="block px-3 py-2 rounded-lg hover:bg-slate-100 text-slate-700 text-sm font-medium">Services</Link>
            <Link href="/dashboard/availability" className="block px-3 py-2 rounded-lg hover:bg-slate-100 text-slate-700 text-sm font-medium">Availability</Link>

            <div className="pt-4 pb-1">
              <p className="px-3 text-[11px] font-bold text-slate-400 uppercase tracking-wider">Patient Experience</p>
            </div>
            <Link href="/dashboard/chatbot" className="block px-3 py-2 rounded-lg hover:bg-slate-100 text-slate-700 text-sm font-medium">Chatbot AI</Link>
            <Link href="/dashboard/website" className="block px-3 py-2 rounded-lg hover:bg-slate-100 text-slate-700 text-sm font-medium">Website Integration</Link>
            <Link href="/dashboard/site-builder" className="block px-3 py-2 rounded-lg hover:bg-slate-100 text-slate-700 text-sm font-medium">Site Builder</Link>
            <Link href="/dashboard/domains" className="block px-3 py-2 rounded-lg hover:bg-slate-100 text-slate-700 text-sm font-medium">Domains</Link>

            <div className="pt-4 pb-1">
              <p className="px-3 text-[11px] font-bold text-slate-400 uppercase tracking-wider">Platform & Admin</p>
            </div>
            <Link href="/dashboard/analytics" className="block px-3 py-2 rounded-lg hover:bg-slate-100 text-slate-700 text-sm font-medium">Analytics</Link>
            <Link href="/dashboard/billing" className="block px-3 py-2 rounded-lg hover:bg-slate-100 text-slate-700 text-sm font-medium">Billing</Link>
            <Link href="/dashboard/support" className="block px-3 py-2 rounded-lg hover:bg-slate-100 text-slate-700 text-sm font-medium">Support Desk</Link>
            <Link href="/dashboard/settings" className="block px-3 py-2 rounded-lg hover:bg-slate-100 text-slate-700 text-sm font-medium">Settings & Privacy</Link>
          </nav>

          <div className="mt-auto pt-6 border-t border-slate-100">
            <Link href="/admin" className="flex items-center justify-center gap-2 p-2.5 rounded-xl bg-purple-50 hover:bg-purple-100 text-purple-700 text-xs font-bold transition-all border border-purple-200">
              <span>🛡️ Super Admin Portal</span>
            </Link>
          </div>
        </aside>
        <main className="flex-1 overflow-y-auto p-6 bg-slate-50">{children}</main>
      </div>
    </div>
  );
}

'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { logout } from '@/app/actions/auth';
import {
  Stethoscope,
  LayoutDashboard,
  Calendar,
  Clock,
  Users,
  UserCheck,
  Shield,
  Briefcase,
  Sliders,
  MessageSquare,
  Globe,
  Palette,
  Phone,
  BarChart3,
  CreditCard,
  LifeBuoy,
  Settings,
  Menu,
  X,
  LogOut,
  ChevronRight,
  Sparkles,
} from 'lucide-react';

interface DashboardLayoutClientProps {
  userEmail: string;
  children: React.ReactNode;
}

export function DashboardLayoutClient({ userEmail, children }: DashboardLayoutClientProps) {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const pathname = usePathname();

  const navSections = [
    {
      title: 'Practice Overview',
      items: [
        { label: 'Overview', href: '/dashboard', icon: LayoutDashboard },
        { label: 'Appointments', href: '/dashboard/appointments', icon: Calendar },
        { label: 'Calendar Grid', href: '/dashboard/calendar', icon: Clock },
        { label: 'Patient Directory', href: '/dashboard/patients', icon: Users },
      ],
    },
    {
      title: 'Omnichannel AI Channels',
      items: [
        { label: 'Website Chatbot', href: '/dashboard/chatbot', icon: MessageSquare },
        { label: 'WhatsApp Business', href: '/dashboard/whatsapp', icon: MessageSquare, badge: 'Official' },
        { label: 'AI Voice Receptionist', href: '/dashboard/voice', icon: Phone, badge: 'Pro' },
        { label: 'Website Integration', href: '/dashboard/website', icon: Globe },
        { label: 'Instant Site Builder', href: '/dashboard/site-builder', icon: Palette },
      ],
    },
    {
      title: 'Clinic Operations',
      items: [
        { label: 'Dentists & Schedules', href: '/dashboard/dentists', icon: UserCheck },
        { label: 'Staff Accounts', href: '/dashboard/staff', icon: Shield },
        { label: 'Services & Pricing', href: '/dashboard/services', icon: Briefcase },
        { label: 'Availability Rules', href: '/dashboard/availability', icon: Sliders },
      ],
    },
    {
      title: 'Platform & Finance',
      items: [
        { label: 'Analytics & Insights', href: '/dashboard/analytics', icon: BarChart3 },
        { label: 'Billing & UPI Plans', href: '/dashboard/billing', icon: CreditCard },
        { label: 'Custom Domains SSL', href: '/dashboard/domains', icon: Globe },
        { label: 'Support Desk', href: '/dashboard/support', icon: LifeBuoy },
        { label: 'Settings & Retention', href: '/dashboard/settings', icon: Settings },
      ],
    },
  ];

  // Quick bottom bar items for mobile screens
  const mobileBottomNav = [
    { label: 'Dashboard', href: '/dashboard', icon: LayoutDashboard },
    { label: 'Bookings', href: '/dashboard/appointments', icon: Calendar },
    { label: 'Voice AI', href: '/dashboard/voice', icon: Phone },
    { label: 'WhatsApp', href: '/dashboard/whatsapp', icon: MessageSquare },
    { label: 'Billing', href: '/dashboard/billing', icon: CreditCard },
  ];

  return (
    <div className="min-h-screen flex flex-col bg-slate-50 text-slate-900 font-sans">
      {/* Top Header */}
      <header className="sticky top-0 z-40 h-16 bg-slate-900 text-white flex items-center justify-between px-4 sm:px-6 border-b border-slate-800 shadow-sm">
        <div className="flex items-center gap-3">
          {/* Mobile hamburger toggle */}
          <button
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            className="md:hidden p-2 rounded-lg text-slate-300 hover:text-white hover:bg-slate-800 transition-colors touch-target flex items-center justify-center"
            aria-label={mobileMenuOpen ? 'Close sidebar' : 'Open sidebar'}
          >
            {mobileMenuOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
          </button>

          <Link href="/dashboard" className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-lg bg-blue-600 flex items-center justify-center text-white font-black text-sm shadow-sm shadow-blue-500/30">
              <Stethoscope className="w-4 h-4 text-white" />
            </div>
            <div>
              <span className="font-extrabold text-sm sm:text-base tracking-tight text-white block leading-tight">
                Radiant Nobel
              </span>
              <span className="text-[10px] font-semibold text-blue-400 uppercase tracking-wider block">
                Clinic Portal
              </span>
            </div>
          </Link>
        </div>

        <div className="flex items-center gap-3">
          <div className="hidden sm:flex flex-col text-right">
            <span className="text-xs font-semibold text-slate-200">{userEmail}</span>
            <span className="text-[10px] text-emerald-400 font-medium">● Connected</span>
          </div>

          <form action={logout}>
            <button
              type="submit"
              className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold text-red-300 hover:text-white bg-slate-800/80 hover:bg-red-600/80 border border-slate-700/60 transition-all touch-target"
            >
              <LogOut className="w-3.5 h-3.5" />
              <span className="hidden sm:inline">Sign Out</span>
            </button>
          </form>
        </div>
      </header>

      <div className="flex flex-1 overflow-hidden relative">
        {/* Desktop Sidebar */}
        <aside className="w-64 bg-white border-r border-slate-200 hidden md:flex md:flex-col overflow-y-auto shrink-0 select-none">
          <div className="p-4 space-y-6 flex-1">
            {navSections.map((section) => (
              <div key={section.title} className="space-y-1">
                <p className="px-3 text-[11px] font-bold text-slate-400 uppercase tracking-wider mb-1.5">
                  {section.title}
                </p>
                {section.items.map((item) => {
                  const Icon = item.icon;
                  const isActive = pathname === item.href;
                  return (
                    <Link
                      key={item.href}
                      href={item.href}
                      className={`flex items-center justify-between px-3 py-2 rounded-xl text-xs font-semibold transition-all group ${
                        isActive
                          ? 'bg-blue-600 text-white shadow-xs'
                          : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100/80'
                      }`}
                    >
                      <div className="flex items-center gap-2.5">
                        <Icon
                          className={`w-4 h-4 ${
                            isActive ? 'text-white' : 'text-slate-400 group-hover:text-slate-600'
                          }`}
                        />
                        <span>{item.label}</span>
                      </div>
                      {item.badge && (
                        <span
                          className={`text-[10px] font-extrabold px-1.5 py-0.5 rounded-md ${
                            isActive
                              ? 'bg-blue-700 text-blue-100'
                              : 'bg-indigo-50 text-indigo-700 border border-indigo-200'
                          }`}
                        >
                          {item.badge}
                        </span>
                      )}
                    </Link>
                  );
                })}
              </div>
            ))}
          </div>

          <div className="p-4 border-t border-slate-100 bg-slate-50/50">
            <Link
              href="/admin"
              className="flex items-center justify-between p-2.5 rounded-xl bg-purple-50 hover:bg-purple-100 text-purple-700 text-xs font-bold transition-all border border-purple-200 shadow-2xs group"
            >
              <div className="flex items-center gap-2">
                <Shield className="w-4 h-4 text-purple-600" />
                <span>Super Admin Portal</span>
              </div>
              <ChevronRight className="w-3.5 h-3.5 group-hover:translate-x-0.5 transition-transform" />
            </Link>
          </div>
        </aside>

        {/* Mobile Sliding Drawer */}
        {mobileMenuOpen && (
          <div className="fixed inset-0 z-50 md:hidden flex">
            <div
              className="fixed inset-0 bg-slate-900/60 backdrop-blur-xs animate-fade-in"
              onClick={() => setMobileMenuOpen(false)}
            />
            <div className="relative w-4/5 max-w-xs bg-white h-full shadow-2xl flex flex-col z-10 animate-fade-in overflow-y-auto p-4 space-y-6">
              <div className="flex items-center justify-between pb-3 border-b border-slate-100">
                <div className="flex items-center gap-2">
                  <div className="w-7 h-7 rounded-lg bg-blue-600 flex items-center justify-center text-white font-bold text-xs">
                    RN
                  </div>
                  <span className="font-bold text-sm text-slate-900">Clinic Navigation</span>
                </div>
                <button
                  onClick={() => setMobileMenuOpen(false)}
                  className="p-1.5 rounded-lg text-slate-400 hover:text-slate-700 touch-target"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              {navSections.map((section) => (
                <div key={section.title} className="space-y-1">
                  <p className="px-3 text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1">
                    {section.title}
                  </p>
                  {section.items.map((item) => {
                    const Icon = item.icon;
                    const isActive = pathname === item.href;
                    return (
                      <Link
                        key={item.href}
                        href={item.href}
                        onClick={() => setMobileMenuOpen(false)}
                        className={`flex items-center justify-between px-3 py-2.5 rounded-xl text-sm font-semibold transition-all ${
                          isActive
                            ? 'bg-blue-600 text-white'
                            : 'text-slate-700 hover:bg-slate-100'
                        }`}
                      >
                        <div className="flex items-center gap-3">
                          <Icon className={`w-4 h-4 ${isActive ? 'text-white' : 'text-slate-400'}`} />
                          <span>{item.label}</span>
                        </div>
                        {item.badge && (
                          <span className="text-[10px] font-bold px-1.5 py-0.5 rounded bg-blue-100 text-blue-800">
                            {item.badge}
                          </span>
                        )}
                      </Link>
                    );
                  })}
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Main Content Viewport */}
        <main className="flex-1 overflow-y-auto p-4 sm:p-6 lg:p-8 bg-slate-50/70 pb-20 md:pb-8">
          <div className="max-w-7xl mx-auto">{children}</div>
        </main>
      </div>

      {/* Mobile 1-Tap Bottom Navigation Bar */}
      <nav className="md:hidden fixed bottom-0 left-0 right-0 z-30 bg-white/95 backdrop-blur-md border-t border-slate-200 px-2 py-1 flex items-center justify-around shadow-lg">
        {mobileBottomNav.map((bItem) => {
          const Icon = bItem.icon;
          const isActive = pathname === bItem.href;
          return (
            <Link
              key={bItem.href}
              href={bItem.href}
              className={`flex flex-col items-center justify-center py-1.5 px-3 rounded-lg text-[10px] font-bold transition-colors touch-target ${
                isActive ? 'text-blue-600 font-extrabold' : 'text-slate-500 hover:text-slate-900'
              }`}
            >
              <Icon className={`w-5 h-5 mb-0.5 ${isActive ? 'text-blue-600' : 'text-slate-400'}`} />
              <span>{bItem.label}</span>
            </Link>
          );
        })}
      </nav>
    </div>
  );
}

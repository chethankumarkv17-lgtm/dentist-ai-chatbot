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
        { label: 'AI Knowledge Base', href: '/dashboard/chatbot', icon: MessageSquare, badge: 'New' },
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
    { label: 'AI Brain', href: '/dashboard/chatbot', icon: MessageSquare },
    { label: 'Voice AI', href: '/dashboard/voice', icon: Phone },
    { label: 'Billing', href: '/dashboard/billing', icon: CreditCard },
  ];

  return (
    <div className="min-h-screen flex flex-col bg-slate-50 text-slate-900 font-sans">
      {/* Top Header with Liquid Glass Blur */}
      <header className="sticky top-0 z-40 h-16 bg-slate-900/95 backdrop-blur-md text-white flex items-center justify-between px-4 sm:px-6 border-b border-slate-800/80 shadow-xs">
        <div className="flex items-center gap-3">
          {/* Mobile hamburger toggle */}
          <button
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            className="md:hidden p-2 rounded-xl text-slate-300 hover:text-white hover:bg-slate-800/80 transition-colors touch-target flex items-center justify-center cursor-pointer"
            aria-label={mobileMenuOpen ? 'Close sidebar' : 'Open sidebar'}
          >
            {mobileMenuOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
          </button>

          <Link href="/dashboard" className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-xl bg-gradient-to-br from-blue-600 to-indigo-600 flex items-center justify-center text-white font-black text-sm shadow-md shadow-blue-500/30">
              <Stethoscope className="w-4 h-4 text-white" />
            </div>
            <div>
              <span className="font-extrabold text-sm sm:text-base tracking-tight text-white block leading-tight">
                Radiant Nobel
              </span>
              <span className="text-[10px] font-bold text-blue-400 uppercase tracking-wider block">
                Clinic Portal
              </span>
            </div>
          </Link>
        </div>

        <div className="flex items-center gap-3">
          <div className="hidden sm:flex flex-col text-right">
            <span className="text-xs font-semibold text-slate-200">{userEmail}</span>
            <span className="text-[10px] text-emerald-400 font-medium flex items-center justify-end gap-1">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
              Connected
            </span>
          </div>

          <form action={logout}>
            <button
              type="submit"
              className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-bold text-rose-300 hover:text-white bg-slate-800/80 hover:bg-rose-600/80 border border-slate-700/60 transition-all touch-target cursor-pointer"
            >
              <LogOut className="w-3.5 h-3.5" />
              <span className="hidden sm:inline">Sign Out</span>
            </button>
          </form>
        </div>
      </header>

      <div className="flex flex-1 overflow-hidden relative">
        {/* Desktop Sidebar with Soft Liquid Glass Surface */}
        <aside className="w-64 bg-white/85 backdrop-blur-md border-r border-slate-200/70 hidden md:flex md:flex-col overflow-y-auto shrink-0 select-none">
          <div className="p-4 space-y-6 flex-1">
            {navSections.map((sec) => (
              <div key={sec.title} className="space-y-1">
                <p className="px-3 text-[11px] font-bold uppercase tracking-wider text-slate-400 mb-1.5">
                  {sec.title}
                </p>
                <div className="space-y-0.5">
                  {sec.items.map((item) => {
                    const Icon = item.icon;
                    const isActive = pathname === item.href;
                    return (
                      <Link
                        key={item.href}
                        href={item.href}
                        className={`flex items-center justify-between px-3 py-2 rounded-xl text-xs font-medium transition-all duration-200 ${
                          isActive
                            ? 'bg-blue-50/90 text-blue-700 font-bold border border-blue-200/60 shadow-2xs'
                            : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100/70'
                        }`}
                      >
                        <div className="flex items-center gap-2.5">
                          <Icon className={`w-4 h-4 ${isActive ? 'text-blue-600' : 'text-slate-400'}`} />
                          <span>{item.label}</span>
                        </div>
                        {item.badge && (
                          <span className="text-[10px] font-extrabold px-1.5 py-0.5 rounded-md bg-blue-100/80 text-blue-700 border border-blue-200/60">
                            {item.badge}
                          </span>
                        )}
                      </Link>
                    );
                  })}
                </div>
              </div>
            ))}
          </div>

          <div className="p-4 border-t border-slate-200/60 bg-slate-50/50">
            <div className="flex items-center gap-2 text-xs font-semibold text-slate-600">
              <Sparkles className="w-3.5 h-3.5 text-blue-600 animate-pulse" />
              <span>Omnichannel Dental AI</span>
            </div>
            <p className="text-[10px] text-slate-400 mt-0.5">Web • WhatsApp • Telephony Voice</p>
          </div>
        </aside>

        {/* Mobile Slide-over Drawer with Glass Surface */}
        {mobileMenuOpen && (
          <div className="fixed inset-0 z-50 md:hidden flex">
            <div
              className="fixed inset-0 bg-slate-900/50 backdrop-blur-xs transition-opacity"
              onClick={() => setMobileMenuOpen(false)}
            />
            <div className="relative w-4/5 max-w-xs bg-white/95 backdrop-blur-xl border-r border-slate-200/80 p-4 overflow-y-auto z-10 flex flex-col justify-between shadow-2xl animate-fade-in">
              <div className="space-y-6">
                <div className="flex items-center justify-between pb-3 border-b border-slate-100">
                  <span className="font-extrabold text-sm text-slate-900">Navigation Menu</span>
                  <button
                    onClick={() => setMobileMenuOpen(false)}
                    className="p-1.5 rounded-xl text-slate-400 hover:text-slate-700 hover:bg-slate-100"
                  >
                    <X className="w-5 h-5" />
                  </button>
                </div>

                {navSections.map((sec) => (
                  <div key={sec.title} className="space-y-1">
                    <p className="px-3 text-[10px] font-bold uppercase tracking-wider text-slate-400 mb-1">
                      {sec.title}
                    </p>
                    <div className="space-y-0.5">
                      {sec.items.map((item) => {
                        const Icon = item.icon;
                        const isActive = pathname === item.href;
                        return (
                          <Link
                            key={item.href}
                            href={item.href}
                            onClick={() => setMobileMenuOpen(false)}
                            className={`flex items-center justify-between px-3 py-2.5 rounded-xl text-xs font-medium transition-colors ${
                              isActive
                                ? 'bg-blue-50 text-blue-700 font-bold border border-blue-200/80'
                                : 'text-slate-700 hover:bg-slate-100/80'
                            }`}
                          >
                            <div className="flex items-center gap-2.5">
                              <Icon className="w-4 h-4 text-slate-500" />
                              <span>{item.label}</span>
                            </div>
                            {item.badge && (
                              <span className="text-[10px] font-bold px-1.5 py-0.5 rounded-md bg-blue-100 text-blue-700">
                                {item.badge}
                              </span>
                            )}
                          </Link>
                        );
                      })}
                    </div>
                  </div>
                ))}
              </div>

              <div className="pt-4 border-t border-slate-200">
                <form action={logout}>
                  <button
                    type="submit"
                    className="w-full flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl text-xs font-bold text-rose-700 bg-rose-50 hover:bg-rose-100 transition-colors"
                  >
                    <LogOut className="w-4 h-4" />
                    <span>Sign Out</span>
                  </button>
                </form>
              </div>
            </div>
          </div>
        )}

        {/* Main Content Viewport */}
        <main className="flex-1 overflow-y-auto p-4 sm:p-6 lg:p-8 pb-24 md:pb-8">
          <div className="max-w-7xl mx-auto space-y-6">{children}</div>
        </main>
      </div>

      {/* 1-Tap Mobile Bottom Navigation Bar with Liquid Glass */}
      <div className="md:hidden fixed bottom-0 left-0 right-0 z-40 bg-white/85 backdrop-blur-lg border-t border-slate-200/70 shadow-lg px-2 py-1.5 flex items-center justify-around select-none">
        {mobileBottomNav.map((btn) => {
          const Icon = btn.icon;
          const isActive = pathname === btn.href;
          return (
            <Link
              key={btn.href}
              href={btn.href}
              className={`flex flex-col items-center justify-center py-1 px-3 rounded-xl transition-all ${
                isActive
                  ? 'text-blue-600 font-bold'
                  : 'text-slate-500 hover:text-slate-800'
              }`}
            >
              <Icon className={`w-5 h-5 ${isActive ? 'stroke-[2.5]' : 'stroke-[1.75]'}`} />
              <span className="text-[10px] mt-0.5">{btn.label}</span>
            </Link>
          );
        })}
      </div>
    </div>
  );
}

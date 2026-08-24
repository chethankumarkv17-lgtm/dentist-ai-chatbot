'use client';

import React from 'react';
import {
  Phone,
  MessageSquare,
  Calendar,
  ShieldCheck,
  Zap,
  CreditCard,
  Sparkles,
  Bot,
  Globe,
} from 'lucide-react';

export function CapabilitiesMarquee() {
  const items = [
    { label: '24/7 AI Voice Phone Receptionist', icon: Phone, color: 'text-purple-600' },
    { label: 'Official WhatsApp Business Cloud API', icon: MessageSquare, color: 'text-green-600' },
    { label: 'Zero Double-Booking Calendar Engine', icon: Calendar, color: 'text-blue-600' },
    { label: 'Automated 24h & 2h Patient Reminders', icon: Zap, color: 'text-amber-600' },
    { label: 'Razorpay Indian UPI & e-Mandates', icon: CreditCard, color: 'text-emerald-600' },
    { label: 'HIPAA Compliant & Multi-Tenant RLS', icon: ShieldCheck, color: 'text-indigo-600' },
    { label: 'Google & Outlook 365 Two-Way Sync', icon: Globe, color: 'text-blue-500' },
    { label: 'Instant Drag & Drop Site Builder', icon: Sparkles, color: 'text-pink-600' },
  ];

  // Duplicate for seamless infinite loop
  const duplicated = [...items, ...items];

  return (
    <div className="w-full bg-slate-900 border-y border-slate-800 py-4 overflow-hidden relative select-none">
      {/* Left/Right Fade Gradient Masks */}
      <div className="absolute left-0 top-0 bottom-0 w-16 sm:w-32 bg-gradient-to-r from-slate-900 to-transparent z-10 pointer-events-none" />
      <div className="absolute right-0 top-0 bottom-0 w-16 sm:w-32 bg-gradient-to-l from-slate-900 to-transparent z-10 pointer-events-none" />

      {/* Scrolling Track */}
      <div className="flex gap-8 sm:gap-12 animate-marquee whitespace-nowrap will-change-transform">
        {duplicated.map((item, idx) => {
          const Icon = item.icon;
          return (
            <div
              key={`${item.label}-${idx}`}
              className="inline-flex items-center gap-2.5 px-4 py-2 rounded-xl bg-slate-800/80 border border-slate-700/70 text-slate-200 text-xs font-semibold shrink-0 shadow-2xs hover:border-slate-600 transition-colors"
            >
              <Icon className={`w-4 h-4 ${item.color}`} />
              <span>{item.label}</span>
            </div>
          );
        })}
      </div>
    </div>
  );
}

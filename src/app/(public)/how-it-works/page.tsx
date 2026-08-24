import React from 'react';
import Link from 'next/link';
import {
  UserCheck,
  Bot,
  Calendar,
  Phone,
  MessageSquare,
  Sparkles,
  ArrowRight,
  CheckCircle2,
  Clock,
} from 'lucide-react';
import { Badge } from '@/components/ui/Badge';
import { Card } from '@/components/ui/Card';
import { RevealOnScroll } from '@/components/ui/RevealOnScroll';

export default function HowItWorksPage() {
  const steps = [
    {
      step: '01',
      title: 'Sign Up & Configure Clinic Profile',
      desc: 'Set up your practice name, dentists, services, prices, and operating business hours in under 5 minutes.',
      icon: UserCheck,
      color: 'bg-blue-50 text-blue-600 border-blue-100',
    },
    {
      step: '02',
      title: 'Sync Google & Outlook Calendars',
      desc: 'Connect your existing dentist calendars for automatic real-time slot synchronization and conflict avoidance.',
      icon: Calendar,
      color: 'bg-emerald-50 text-emerald-600 border-emerald-100',
    },
    {
      step: '03',
      title: 'Enable Omnichannel Patient Channels',
      desc: 'Embed the 24/7 chat widget on your website, connect your official WhatsApp Business number, and configure your AI voice phone line.',
      icon: Bot,
      color: 'bg-purple-50 text-purple-600 border-purple-100',
    },
    {
      step: '04',
      title: 'Autonomous 24/7 Scheduling Goes Live',
      desc: 'Patients book appointments effortlessly at any time. Automatic WhatsApp reminders are delivered 24h and 2h before the visit.',
      icon: Clock,
      color: 'bg-amber-50 text-amber-600 border-amber-100',
    },
  ];

  return (
    <div className="py-16 sm:py-24 space-y-20 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 overflow-hidden">
      {/* Header */}
      <RevealOnScroll variant="fade-up" durationMs={500}>
        <div className="text-center max-w-3xl mx-auto space-y-4">
          <Badge variant="pro" size="md">Simple 4-Step Setup</Badge>
          <h1 className="text-4xl sm:text-5xl font-extrabold text-slate-900 tracking-tight">
            How Radiant Nobel Automates Your Dental Front Desk
          </h1>
          <p className="text-slate-600 text-base sm:text-lg">
            No complex coding or hardware installations required. Deploy in minutes with zero disruption to your daily clinic operations.
          </p>
        </div>
      </RevealOnScroll>

      {/* Step Cards Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {steps.map((st, idx) => {
          const Icon = st.icon;
          return (
            <RevealOnScroll key={st.step} variant="fade-up" delayMs={idx * 120} durationMs={500}>
              <Card className="p-6 space-y-4 relative flex flex-col justify-between h-full" hoverable>
                <div>
                  <div className="flex items-center justify-between mb-4">
                    <span className="text-2xl font-black text-slate-300">{st.step}</span>
                    <div className={`w-10 h-10 rounded-xl border flex items-center justify-center ${st.color}`}>
                      <Icon className="w-5 h-5" />
                    </div>
                  </div>

                  <h3 className="text-base font-bold text-slate-900 mb-2">{st.title}</h3>
                  <p className="text-xs text-slate-600 leading-relaxed">{st.desc}</p>
                </div>

                <div className="pt-4 border-t border-slate-100 flex items-center gap-1.5 text-[11px] font-bold text-emerald-600">
                  <CheckCircle2 className="w-3.5 h-3.5" />
                  <span>Zero-code setup</span>
                </div>
              </Card>
            </RevealOnScroll>
          );
        })}
      </div>

      {/* Interactive Demonstration Banner */}
      <RevealOnScroll variant="scale-up" durationMs={550}>
        <div className="bg-gradient-to-r from-slate-900 to-slate-800 text-white rounded-3xl p-8 sm:p-12 flex flex-col md:flex-row md:items-center justify-between gap-8">
          <div className="space-y-2 max-w-xl">
            <h2 className="text-2xl sm:text-3xl font-extrabold">Ready to see it in action?</h2>
            <p className="text-sm text-slate-400">
              Try our interactive patient booking simulation on your local development environment right now.
            </p>
          </div>
          <div className="flex flex-wrap items-center gap-3">
            <Link
              href="/login"
              className="inline-flex items-center gap-2 px-6 py-3.5 rounded-xl bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold shadow-lg shadow-blue-500/25 transition-all touch-target"
            >
              <span>Enter Interactive Demo</span>
              <ArrowRight className="w-4 h-4" />
            </Link>
            <Link
              href="/widget"
              target="_blank"
              className="inline-flex items-center gap-2 px-6 py-3.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-bold border border-slate-700 transition-all touch-target"
            >
              <span>Test Chatbot Widget ↗</span>
            </Link>
          </div>
        </div>
      </RevealOnScroll>
    </div>
  );
}

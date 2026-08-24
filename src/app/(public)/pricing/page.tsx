'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import {
  Check,
  Sparkles,
  ArrowRight,
  ShieldCheck,
  Phone,
  MessageSquare,
  Globe,
  Zap,
  HelpCircle,
} from 'lucide-react';
import { Badge } from '@/components/ui/Badge';
import { Card } from '@/components/ui/Card';
import { RevealOnScroll } from '@/components/ui/RevealOnScroll';

export default function PricingPage() {
  const [annual, setAnnual] = useState(false);

  const plans = [
    {
      key: 'starter',
      name: 'Starter Plan',
      description: 'Essential 24/7 AI Website Receptionist for solo and boutique dental clinics.',
      monthlyPrice: 2999,
      annualPrice: 2399,
      popular: false,
      features: [
        '24/7 Website AI Chatbot Widget',
        '500 AI Patient Conversations/mo',
        'Up to 2 Dentists & Calendars',
        'Google Calendar Two-Way Sync',
        'Zero Double-Booking Guarantee',
        'Email Alerts for Human Handoff',
        'Standard Email Support (24h)',
      ],
      cta: 'Start 14-Day Free Trial',
      href: '/signup?plan=starter',
    },
    {
      key: 'growth',
      name: 'Growth Plan',
      description: 'Full Website AI + Official WhatsApp Business Automation for growing dental practices.',
      monthlyPrice: 5999,
      annualPrice: 4799,
      popular: true,
      badge: 'Most Popular',
      features: [
        'Everything in Starter',
        'Official WhatsApp Business API Channel',
        '1,000 WhatsApp AI Conversations/mo',
        'Automated 24h & 2h WhatsApp Reminders',
        'Up to 6 Dentists & Staff Accounts',
        'Custom Domain SSL Site Builder',
        'Google & Outlook 365 Calendar Sync',
        'Priority Support Desk (4h SLA)',
      ],
      cta: 'Start Growth Trial',
      href: '/signup?plan=growth',
    },
    {
      key: 'pro',
      name: 'Pro Enterprise Plan',
      description: 'The Complete Omnichannel Suite with 24/7 AI Voice Phone Receptionist.',
      monthlyPrice: 11999,
      annualPrice: 9599,
      popular: false,
      badge: 'Voice AI Included',
      features: [
        'Everything in Growth',
        '24/7 AI Voice Phone Receptionist',
        '500 Voice Inbound Minutes/mo Included',
        'Natural Indian English & Bilingual Voices',
        'Emergency Medical Call Escalation',
        'Unlimited Website & WhatsApp AI Chats',
        'Unlimited Dentists & Clinic Locations',
        'Dedicated Account Manager & Phone SLA',
      ],
      cta: 'Start Pro Voice Trial',
      href: '/signup?plan=pro',
    },
  ];

  return (
    <div className="py-16 sm:py-24 space-y-16 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 overflow-hidden">
      {/* Header */}
      <RevealOnScroll variant="fade-up" durationMs={500}>
        <div className="text-center max-w-3xl mx-auto space-y-4">
          <Badge variant="pro" size="md">Transparent Indian Pricing</Badge>
          <h1 className="text-4xl sm:text-5xl font-extrabold text-slate-900 tracking-tight">
            Predictable Practice Plans. Zero Surprises.
          </h1>
          <p className="text-slate-600 text-base sm:text-lg">
            Start with our 14-day free trial. Upgrade or cancel anytime with Indian UPI, Netbanking, or Cards.
          </p>

          {/* Billing Cycle Toggle */}
          <div className="pt-6 flex items-center justify-center gap-4">
            <span className={`text-sm font-bold ${!annual ? 'text-slate-900' : 'text-slate-500'}`}>
              Monthly Billing
            </span>
            <button
              type="button"
              role="switch"
              aria-checked={annual}
              onClick={() => setAnnual(!annual)}
              className={`relative inline-flex h-7 w-14 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none focus:ring-2 focus:ring-blue-600 focus:ring-offset-2 ${
                annual ? 'bg-blue-600' : 'bg-slate-300'
              }`}
            >
              <span
                className={`pointer-events-none inline-block h-6 w-6 transform rounded-full bg-white shadow-md ring-0 transition duration-200 ease-in-out ${
                  annual ? 'translate-x-7' : 'translate-x-0'
                }`}
              />
            </button>
            <div className="flex items-center gap-2">
              <span className={`text-sm font-bold ${annual ? 'text-slate-900' : 'text-slate-500'}`}>
                Annual Billing
              </span>
              <span className="text-xs font-bold text-emerald-700 bg-emerald-100 px-2 py-0.5 rounded-full">
                Save 20%
              </span>
            </div>
          </div>
        </div>
      </RevealOnScroll>

      {/* Plan Cards */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 items-stretch">
        {plans.map((p, idx) => {
          const price = annual ? p.annualPrice : p.monthlyPrice;
          return (
            <RevealOnScroll key={p.key} variant="fade-up" delayMs={idx * 150} durationMs={550}>
              <div
                className={`relative bg-white rounded-3xl p-8 border flex flex-col justify-between h-full transition-all duration-200 ${
                  p.popular
                    ? 'border-blue-600 ring-2 ring-blue-600/20 shadow-xl shadow-blue-500/10'
                    : 'border-slate-200 shadow-sm hover:shadow-md'
                }`}
              >
                {p.badge && (
                  <div className="absolute -top-3.5 left-1/2 -translate-x-1/2">
                    <span className="bg-blue-600 text-white text-xs font-extrabold px-3.5 py-1 rounded-full shadow-md">
                      {p.badge}
                    </span>
                  </div>
                )}

                <div>
                  <h3 className="text-xl font-extrabold text-slate-900">{p.name}</h3>
                  <p className="text-xs text-slate-500 mt-1 min-h-[36px]">{p.description}</p>

                  <div className="mt-6 mb-8 pb-6 border-b border-slate-100">
                    <div className="flex items-baseline gap-1">
                      <span className="text-4xl sm:text-5xl font-black text-slate-900">₹{price.toLocaleString('en-IN')}</span>
                      <span className="text-xs font-semibold text-slate-500">/month</span>
                    </div>
                    <p className="text-[11px] text-slate-400 mt-1">
                      {annual ? 'Billed annually with 20% savings' : 'Billed monthly, cancel anytime'}
                    </p>
                  </div>

                  <div className="space-y-3">
                    <p className="text-xs font-bold text-slate-900 uppercase tracking-wider">Features Included:</p>
                    {p.features.map((feat) => (
                      <div key={feat} className="flex items-start gap-2.5 text-xs text-slate-700 font-medium">
                        <Check className="w-4 h-4 text-emerald-600 shrink-0 mt-0.5" />
                        <span>{feat}</span>
                      </div>
                    ))}
                  </div>
                </div>

                <div className="pt-8 mt-8 border-t border-slate-100">
                  <Link
                    href={p.href}
                    className={`w-full inline-flex items-center justify-center gap-2 py-3.5 px-4 rounded-xl font-bold text-sm transition-all shadow-sm ${
                      p.popular
                        ? 'bg-blue-600 hover:bg-blue-700 text-white shadow-blue-500/25'
                        : 'bg-slate-900 hover:bg-slate-800 text-white'
                    }`}
                  >
                    <span>{p.cta}</span>
                    <ArrowRight className="w-4 h-4" />
                  </Link>
                </div>
              </div>
            </RevealOnScroll>
          );
        })}
      </div>

      {/* Payment Methods Notice */}
      <RevealOnScroll variant="fade-up" durationMs={450}>
        <div className="bg-slate-50 border border-slate-200/80 rounded-2xl p-6 text-center max-w-3xl mx-auto space-y-2">
          <div className="flex items-center justify-center gap-2 text-xs font-bold text-slate-800">
            <ShieldCheck className="w-4 h-4 text-blue-600" />
            <span>Supported Payment Methods in India</span>
          </div>
          <p className="text-xs text-slate-500">
            UPI Intent (Google Pay, PhonePe, Paytm), Dynamic UPI QR, Net Banking (50+ Banks), Visa, Mastercard, RuPay & RBI e-Mandates.
          </p>
        </div>
      </RevealOnScroll>
    </div>
  );
}

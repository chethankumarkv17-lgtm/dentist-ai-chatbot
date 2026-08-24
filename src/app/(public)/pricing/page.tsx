'use client';

import { useState } from 'react';
import Link from 'next/link';
import { BILLING_PLANS, BillingInterval } from '@/lib/billing/plans';
import { Check, Zap, Sparkles, Shield, ArrowRight, CreditCard, Smartphone } from 'lucide-react';

export default function PricingPage() {
  const [interval, setInterval] = useState<BillingInterval>('monthly');

  const plans = Object.values(BILLING_PLANS);

  return (
    <div className="min-h-screen bg-slate-50 py-20 px-4 sm:px-6 lg:px-8">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="text-center max-w-3xl mx-auto mb-16">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-sky-100 text-sky-700 text-xs font-semibold uppercase tracking-wider mb-4">
            <Sparkles className="w-3.5 h-3.5" />
            Simple, Transparent Pricing
          </div>
          <h1 className="text-4xl sm:text-5xl font-extrabold text-slate-900 tracking-tight mb-4">
            Choose the right plan for your dental practice
          </h1>
          <p className="text-lg text-slate-600">
            Automate appointment bookings, reduce front-desk workload, and never miss another patient inquiry.
          </p>

          {/* Billing Interval Toggle */}
          <div className="mt-8 flex flex-col items-center justify-center gap-4">
            <div className="bg-slate-200 p-1 rounded-xl flex items-center shadow-inner">
              <button
                type="button"
                onClick={() => setInterval('monthly')}
                className={`px-5 py-2 rounded-lg text-sm font-semibold transition-all ${
                  interval === 'monthly'
                    ? 'bg-white text-slate-900 shadow-sm'
                    : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                Monthly Billing
              </button>
              <button
                type="button"
                onClick={() => setInterval('yearly')}
                className={`px-5 py-2 rounded-lg text-sm font-semibold flex items-center gap-1.5 transition-all ${
                  interval === 'yearly'
                    ? 'bg-white text-slate-900 shadow-sm'
                    : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                Yearly Billing
                <span className="bg-emerald-100 text-emerald-700 text-xs px-2 py-0.5 rounded-full font-bold">
                  2 Mo Free
                </span>
              </button>
            </div>
            
            <div className="flex items-center gap-4 text-xs font-medium text-slate-500 bg-white px-4 py-2 rounded-full border border-slate-200 shadow-sm">
              <div className="flex items-center gap-1.5">
                <Smartphone className="w-4 h-4 text-slate-400" /> UPI
              </div>
              <span className="text-slate-300">•</span>
              <div className="flex items-center gap-1.5">
                <CreditCard className="w-4 h-4 text-slate-400" /> Cards
              </div>
              <span className="text-slate-300">•</span>
              <span>Netbanking</span>
            </div>
          </div>
        </div>

        {/* Pricing Cards */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 items-stretch mb-20">
          {plans.map((plan) => {
            const price = interval === 'yearly' ? Math.round(plan.yearlyPrice / 12) : plan.monthlyPrice;
            const isPopular = plan.popular;

            return (
              <div
                key={plan.key}
                className={`relative flex flex-col justify-between bg-white rounded-2xl p-8 transition-all ${
                  isPopular
                    ? 'border-2 border-sky-600 shadow-xl ring-4 ring-sky-600/10'
                    : 'border border-slate-200 shadow-sm hover:shadow-md'
                }`}
              >
                {isPopular && (
                  <div className="absolute -top-3.5 left-1/2 -translate-x-1/2 bg-gradient-to-r from-sky-600 to-indigo-600 text-white text-xs font-bold uppercase tracking-wider py-1 px-4 rounded-full shadow-sm">
                    Most Popular
                  </div>
                )}

                <div>
                  <div className="flex items-center justify-between mb-4">
                    <h3 className="text-xl font-bold text-slate-900">{plan.name}</h3>
                    {plan.key === 'starter' && <Zap className="w-5 h-5 text-sky-500" />}
                    {plan.key === 'growth' && <Sparkles className="w-5 h-5 text-indigo-500" />}
                    {plan.key === 'pro' && <Shield className="w-5 h-5 text-purple-500" />}
                  </div>

                  <p className="text-sm text-slate-600 mb-6">{plan.description}</p>

                  <div className="flex items-baseline gap-1 mb-6">
                    <span className="text-4xl sm:text-5xl font-extrabold text-slate-900">₹{price.toLocaleString()}</span>
                    <span className="text-slate-500 font-medium">/ month</span>
                  </div>

                  {interval === 'yearly' && (
                    <p className="text-xs text-emerald-600 font-medium -mt-4 mb-6">
                      Billed annually (₹{plan.yearlyPrice.toLocaleString()}/yr)
                    </p>
                  )}

                  <div className="border-t border-slate-100 pt-6 mb-6">
                    <p className="text-xs font-bold uppercase tracking-wider text-slate-400 mb-4">
                      Plan Includes:
                    </p>
                    <ul className="space-y-3">
                      {plan.highlights.map((highlight, idx) => (
                        <li key={idx} className="flex items-start gap-2.5 text-sm text-slate-700">
                          <Check className="w-4 h-4 text-emerald-500 shrink-0 mt-0.5" />
                          <span>{highlight}</span>
                        </li>
                      ))}
                    </ul>
                  </div>
                </div>

                <div className="mt-8">
                  <Link
                    href={`/signup?plan=${plan.key}&interval=${interval}`}
                    className={`w-full flex items-center justify-center gap-2 py-3 px-4 rounded-xl font-semibold text-sm transition-all ${
                      isPopular
                        ? 'bg-sky-600 text-white hover:bg-sky-700 shadow-md shadow-sky-600/20'
                        : 'bg-slate-900 text-white hover:bg-slate-800'
                    }`}
                  >
                    Get Started with {plan.name}
                    <ArrowRight className="w-4 h-4" />
                  </Link>
                </div>
              </div>
            );
          })}
        </div>

        {/* Feature Comparison / FAQs */}
        <div className="max-w-4xl mx-auto bg-white border border-slate-200 rounded-2xl p-8 sm:p-12 shadow-sm">
          <h2 className="text-2xl font-bold text-slate-900 mb-6 text-center">Frequently Asked Questions</h2>
          <div className="space-y-6">
            <div>
              <h4 className="font-semibold text-slate-900 mb-1">Is there a free trial?</h4>
              <p className="text-sm text-slate-600">Yes! All plans include a 14-day free trial so you can experience how many hours the AI receptionist saves your dental practice.</p>
            </div>
            <div>
              <h4 className="font-semibold text-slate-900 mb-1">Can I upgrade, downgrade, or cancel anytime?</h4>
              <p className="text-sm text-slate-600">Absolutely. You can change your plan or cancel with a single click inside your clinic dashboard.</p>
            </div>
            <div>
              <h4 className="font-semibold text-slate-900 mb-1">How does calendar synchronization work?</h4>
              <p className="text-sm text-slate-600">The AI receptionist connects directly to Google Calendar (and Microsoft Outlook) via secure OAuth to check live dentist availability and prevent any double booking.</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

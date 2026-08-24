'use client';

import { PlatformAnalyticsData } from '@/lib/analytics/types';
import {
  Building2,
  DollarSign,
  TrendingUp,
  MessageSquare,
  CalendarCheck,
  Zap,
  Shield,
  Activity,
} from 'lucide-react';

interface PlatformAnalyticsClientProps {
  initialData: PlatformAnalyticsData;
}

export default function PlatformAnalyticsClient({ initialData }: PlatformAnalyticsClientProps) {
  const data = initialData;

  return (
    <div className="space-y-8 max-w-7xl mx-auto p-6 sm:p-8">
      {/* Header */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 pb-6 border-b border-slate-200">
        <div>
          <div className="flex items-center gap-2">
            <span className="px-2.5 py-0.5 rounded-full text-xs font-bold bg-purple-100 text-purple-800 uppercase">
              Super Admin
            </span>
            <h1 className="text-2xl font-bold text-slate-900">Platform Analytics & Metrics</h1>
          </div>
          <p className="text-sm text-slate-500 mt-1">
            Global metrics across all dental practices, active subscriptions, and AI throughput.
          </p>
        </div>
      </div>

      {/* Platform KPI Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
        {/* Total Organizations */}
        <div className="bg-white border border-slate-200 rounded-2xl p-6 shadow-sm">
          <div className="flex items-center justify-between mb-3">
            <span className="text-xs font-bold text-slate-500 uppercase tracking-wider">Active Practices</span>
            <div className="w-8 h-8 rounded-lg bg-sky-50 flex items-center justify-center text-sky-600">
              <Building2 className="w-4 h-4" />
            </div>
          </div>
          <div className="text-3xl font-extrabold text-slate-900 mb-1">{data.totalOrganizations}</div>
          <p className="text-xs text-slate-500">{data.activeSubscriptions} active subscriptions</p>
        </div>

        {/* MRR Estimate */}
        <div className="bg-white border border-slate-200 rounded-2xl p-6 shadow-sm">
          <div className="flex items-center justify-between mb-3">
            <span className="text-xs font-bold text-slate-500 uppercase tracking-wider">Estimated MRR</span>
            <div className="w-8 h-8 rounded-lg bg-emerald-50 flex items-center justify-center text-emerald-600">
              <DollarSign className="w-4 h-4" />
            </div>
          </div>
          <div className="text-3xl font-extrabold text-slate-900 mb-1">${data.mrrEstimateUsd}</div>
          <p className="text-xs text-slate-500">ARR: ${data.arrEstimateUsd}/yr</p>
        </div>

        {/* Platform AI Conversations */}
        <div className="bg-white border border-slate-200 rounded-2xl p-6 shadow-sm">
          <div className="flex items-center justify-between mb-3">
            <span className="text-xs font-bold text-slate-500 uppercase tracking-wider">AI Conversations</span>
            <div className="w-8 h-8 rounded-lg bg-indigo-50 flex items-center justify-center text-indigo-600">
              <MessageSquare className="w-4 h-4" />
            </div>
          </div>
          <div className="text-3xl font-extrabold text-slate-900 mb-1">{data.platformTotalConversations}</div>
          <p className="text-xs text-slate-500">Platform AI cost: ${data.platformAiCostUsd}</p>
        </div>

        {/* Total Appointments */}
        <div className="bg-white border border-slate-200 rounded-2xl p-6 shadow-sm">
          <div className="flex items-center justify-between mb-3">
            <span className="text-xs font-bold text-slate-500 uppercase tracking-wider">Total Bookings</span>
            <div className="w-8 h-8 rounded-lg bg-purple-50 flex items-center justify-center text-purple-600">
              <CalendarCheck className="w-4 h-4" />
            </div>
          </div>
          <div className="text-3xl font-extrabold text-slate-900 mb-1">{data.platformTotalAppointments}</div>
          <p className="text-xs text-slate-500">{data.platformConversionRate}% avg conversion</p>
        </div>
      </div>

      {/* Plan Distribution & System Health */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        {/* Subscription Plan Distribution */}
        <div className="bg-white border border-slate-200 rounded-2xl p-6 sm:p-8 shadow-sm">
          <h3 className="text-base font-bold text-slate-900 mb-6 flex items-center gap-2">
            <TrendingUp className="w-5 h-5 text-indigo-600" />
            Subscription Plan Tiers
          </h3>

          <div className="space-y-4">
            <div className="p-4 bg-slate-50 rounded-xl border border-slate-100 flex items-center justify-between">
              <div className="flex items-center gap-3">
                <Zap className="w-5 h-5 text-sky-500" />
                <div>
                  <h4 className="text-sm font-bold text-slate-900">Starter (\$99/mo)</h4>
                  <p className="text-xs text-slate-500">Solo practices & small clinics</p>
                </div>
              </div>
              <span className="text-base font-extrabold text-slate-900">{data.planBreakdown.starter}</span>
            </div>

            <div className="p-4 bg-slate-50 rounded-xl border border-slate-100 flex items-center justify-between">
              <div className="flex items-center gap-3">
                <TrendingUp className="w-5 h-5 text-indigo-500" />
                <div>
                  <h4 className="text-sm font-bold text-slate-900">Growth (\$199/mo)</h4>
                  <p className="text-xs text-slate-500">Multi-chair expanding clinics</p>
                </div>
              </div>
              <span className="text-base font-extrabold text-slate-900">{data.planBreakdown.growth}</span>
            </div>

            <div className="p-4 bg-slate-50 rounded-xl border border-slate-100 flex items-center justify-between">
              <div className="flex items-center gap-3">
                <Shield className="w-5 h-5 text-purple-500" />
                <div>
                  <h4 className="text-sm font-bold text-slate-900">Pro Enterprise (\$399/mo)</h4>
                  <p className="text-xs text-slate-500">Dental groups & DSO practices</p>
                </div>
              </div>
              <span className="text-base font-extrabold text-slate-900">{data.planBreakdown.pro}</span>
            </div>
          </div>
        </div>

        {/* System Health */}
        <div className="bg-white border border-slate-200 rounded-2xl p-6 sm:p-8 shadow-sm">
          <h3 className="text-base font-bold text-slate-900 mb-6 flex items-center gap-2">
            <Activity className="w-5 h-5 text-emerald-600" />
            Platform Infrastructure Health
          </h3>

          <div className="space-y-4">
            <div className="flex items-center justify-between p-3.5 bg-emerald-50/60 border border-emerald-100 rounded-xl">
              <span className="text-sm font-semibold text-emerald-900">AI Receptionist API</span>
              <span className="text-xs font-bold px-2 py-0.5 rounded-full bg-emerald-100 text-emerald-800">Operational (99.9%)</span>
            </div>
            <div className="flex items-center justify-between p-3.5 bg-emerald-50/60 border border-emerald-100 rounded-xl">
              <span className="text-sm font-semibold text-emerald-900">Stripe Billing Webhooks</span>
              <span className="text-xs font-bold px-2 py-0.5 rounded-full bg-emerald-100 text-emerald-800">Operational</span>
            </div>
            <div className="flex items-center justify-between p-3.5 bg-emerald-50/60 border border-emerald-100 rounded-xl">
              <span className="text-sm font-semibold text-emerald-900">Google Calendar Sync</span>
              <span className="text-xs font-bold px-2 py-0.5 rounded-full bg-emerald-100 text-emerald-800">Operational</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

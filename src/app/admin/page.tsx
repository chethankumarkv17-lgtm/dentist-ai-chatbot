import { getAdminOverviewMetrics } from '@/lib/admin/service';
import Link from 'next/link';
import {
  Building2,
  CreditCard,
  Zap,
  CalendarCheck,
  AlertTriangle,
  ArrowUpRight,
  Activity,
  CheckCircle2,
  Clock,
  XCircle,
} from 'lucide-react';

export default async function AdminOverviewPage() {
  const metrics = await getAdminOverviewMetrics();

  return (
    <div className="p-6 sm:p-8 space-y-8 max-w-7xl mx-auto">
      {/* Header */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 pb-6 border-b border-slate-200">
        <div>
          <div className="flex items-center gap-2">
            <span className="px-2.5 py-0.5 rounded-full text-xs font-bold bg-purple-100 text-purple-800 uppercase">
              Platform Admin
            </span>
            <h1 className="text-2xl font-bold text-slate-900">Control Center</h1>
          </div>
          <p className="text-sm text-slate-500 mt-1">
            Global operational overview of all clinics, subscriptions, and AI throughput.
          </p>
        </div>

        <div className="flex items-center gap-3">
          <Link
            href="/admin/system-health"
            className="inline-flex items-center gap-2 px-4 py-2 bg-white border border-slate-200 rounded-xl text-xs font-bold text-slate-700 hover:bg-slate-50 transition-all shadow-sm"
          >
            <Activity className="w-3.5 h-3.5 text-emerald-600" />
            System Health
          </Link>
        </div>
      </div>

      {/* KPI Cards Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
        {/* Total Organizations */}
        <div className="bg-white border border-slate-200 rounded-2xl p-6 shadow-sm">
          <div className="flex items-center justify-between mb-3">
            <span className="text-xs font-bold text-slate-500 uppercase tracking-wider">Organizations</span>
            <div className="w-8 h-8 rounded-lg bg-sky-50 flex items-center justify-center text-sky-600">
              <Building2 className="w-4 h-4" />
            </div>
          </div>
          <div className="text-3xl font-extrabold text-slate-900 mb-1">{metrics.totalOrganizations}</div>
          <p className="text-xs text-slate-500">{metrics.totalClinics} total dental clinics</p>
        </div>

        {/* Customer Breakdown */}
        <div className="bg-white border border-slate-200 rounded-2xl p-6 shadow-sm">
          <div className="flex items-center justify-between mb-3">
            <span className="text-xs font-bold text-slate-500 uppercase tracking-wider">Active Customers</span>
            <div className="w-8 h-8 rounded-lg bg-emerald-50 flex items-center justify-center text-emerald-600">
              <CheckCircle2 className="w-4 h-4" />
            </div>
          </div>
          <div className="text-3xl font-extrabold text-slate-900 mb-1">{metrics.activeCustomers}</div>
          <div className="flex items-center gap-2 text-xs text-slate-500 mt-1">
            <span className="text-emerald-700 font-semibold">{metrics.paidCustomers} Paid</span>
            <span>•</span>
            <span className="text-amber-700 font-semibold">{metrics.trialCustomers} Trial</span>
          </div>
        </div>

        {/* AI Usage & Cost */}
        <div className="bg-white border border-slate-200 rounded-2xl p-6 shadow-sm">
          <div className="flex items-center justify-between mb-3">
            <span className="text-xs font-bold text-slate-500 uppercase tracking-wider">AI Messages & Cost</span>
            <div className="w-8 h-8 rounded-lg bg-purple-50 flex items-center justify-center text-purple-600">
              <Zap className="w-4 h-4" />
            </div>
          </div>
          <div className="text-3xl font-extrabold text-slate-900 mb-1">{metrics.totalAiMessages}</div>
          <p className="text-xs text-slate-500">Est. API Cost: ${metrics.totalAiCostUsd}</p>
        </div>

        {/* Appointments */}
        <div className="bg-white border border-slate-200 rounded-2xl p-6 shadow-sm">
          <div className="flex items-center justify-between mb-3">
            <span className="text-xs font-bold text-slate-500 uppercase tracking-wider">Total Bookings</span>
            <div className="w-8 h-8 rounded-lg bg-indigo-50 flex items-center justify-center text-indigo-600">
              <CalendarCheck className="w-4 h-4" />
            </div>
          </div>
          <div className="text-3xl font-extrabold text-slate-900 mb-1">{metrics.totalAppointments}</div>
          <p className="text-xs text-slate-500">Scheduled via platform</p>
        </div>
      </div>

      {/* Secondary Status & Webhook Errors */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Subscription Status Card */}
        <div className="bg-white border border-slate-200 rounded-2xl p-6 shadow-sm">
          <h3 className="text-base font-bold text-slate-900 mb-4 flex items-center gap-2">
            <CreditCard className="w-4 h-4 text-indigo-600" />
            Subscription States
          </h3>
          <div className="space-y-3 text-sm">
            <div className="flex justify-between items-center p-3 bg-emerald-50 rounded-xl border border-emerald-100">
              <span className="font-semibold text-emerald-900 flex items-center gap-2">
                <CheckCircle2 className="w-4 h-4 text-emerald-600" /> Paid Subscriptions
              </span>
              <span className="font-bold text-emerald-950">{metrics.paidCustomers}</span>
            </div>
            <div className="flex justify-between items-center p-3 bg-amber-50 rounded-xl border border-amber-100">
              <span className="font-semibold text-amber-900 flex items-center gap-2">
                <Clock className="w-4 h-4 text-amber-600" /> 14-Day Free Trials
              </span>
              <span className="font-bold text-amber-950">{metrics.trialCustomers}</span>
            </div>
            <div className="flex justify-between items-center p-3 bg-slate-50 rounded-xl border border-slate-100">
              <span className="font-semibold text-slate-700 flex items-center gap-2">
                <XCircle className="w-4 h-4 text-slate-400" /> Cancelled Subscriptions
              </span>
              <span className="font-bold text-slate-900">{metrics.cancelledSubscriptions}</span>
            </div>
          </div>
        </div>

        {/* Failed Webhooks / System Errors */}
        <div className="bg-white border border-slate-200 rounded-2xl p-6 shadow-sm">
          <h3 className="text-base font-bold text-slate-900 mb-4 flex items-center gap-2">
            <AlertTriangle className="w-4 h-4 text-rose-600" />
            Failed Webhooks & Errors
          </h3>
          <div className="p-4 bg-slate-50 rounded-xl border border-slate-100 mb-4">
            <div className="text-2xl font-extrabold text-slate-900">{metrics.failedWebhooksCount}</div>
            <p className="text-xs text-slate-500 mt-0.5">Failed webhook events awaiting retry</p>
          </div>
          <Link
            href="/admin/system-health"
            className="text-xs font-bold text-sky-600 hover:text-sky-700 flex items-center gap-1"
          >
            Inspect System Health & Webhooks <ArrowUpRight className="w-3.5 h-3.5" />
          </Link>
        </div>

        {/* Quick Admin Navigation */}
        <div className="bg-white border border-slate-200 rounded-2xl p-6 shadow-sm flex flex-col justify-between">
          <div>
            <h3 className="text-base font-bold text-slate-900 mb-4">Quick Management</h3>
            <div className="space-y-2">
              <Link
                href="/admin/clinics"
                className="flex items-center justify-between p-2.5 rounded-xl hover:bg-slate-50 text-xs font-semibold text-slate-700"
              >
                <span>Manage Clinics & Suspension</span>
                <ArrowUpRight className="w-4 h-4 text-slate-400" />
              </Link>
              <Link
                href="/admin/users"
                className="flex items-center justify-between p-2.5 rounded-xl hover:bg-slate-50 text-xs font-semibold text-slate-700"
              >
                <span>Manage Users & Roles</span>
                <ArrowUpRight className="w-4 h-4 text-slate-400" />
              </Link>
              <Link
                href="/admin/audit-logs"
                className="flex items-center justify-between p-2.5 rounded-xl hover:bg-slate-50 text-xs font-semibold text-slate-700"
              >
                <span>View Administrative Audit Trail</span>
                <ArrowUpRight className="w-4 h-4 text-slate-400" />
              </Link>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

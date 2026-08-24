'use client';

import React, { useState } from 'react';
import { SystemHealthOverview } from '@/lib/monitoring/service';
import {
  triggerHealthCheckAction,
  acknowledgeAlertAction,
} from '@/app/actions/monitoring';
import {
  Activity,
  CheckCircle2,
  AlertTriangle,
  AlertOctagon,
  RefreshCw,
  Database,
  Cpu,
  CreditCard,
  Mail,
  Calendar,
  Globe,
  Loader2,
  Check,
} from 'lucide-react';

interface SystemHealthClientProps {
  initialOverview: SystemHealthOverview;
}

export default function SystemHealthClient({
  initialOverview,
}: SystemHealthClientProps) {
  const [overview, setOverview] = useState<SystemHealthOverview>(initialOverview);
  const [refreshing, setRefreshing] = useState<boolean>(false);
  const [acknowledgingId, setAcknowledgingId] = useState<string | null>(null);

  const handleRunDiagnostic = async () => {
    setRefreshing(true);
    try {
      const res = await triggerHealthCheckAction();
      if (res.success && res.data) {
        setOverview(res.data);
      }
    } finally {
      setRefreshing(false);
    }
  };

  const handleAcknowledge = async (alertId: string) => {
    setAcknowledgingId(alertId);
    try {
      const res = await acknowledgeAlertAction(alertId);
      if (res.success) {
        setOverview((prev) => ({
          ...prev,
          activeAlerts: prev.activeAlerts.filter((a) => a.id !== alertId),
        }));
      }
    } finally {
      setAcknowledgingId(null);
    }
  };

  const getServiceIcon = (service: string) => {
    switch (service) {
      case 'database':
        return <Database className="w-4 h-4 text-emerald-500" />;
      case 'ai_receptionist':
        return <Cpu className="w-4 h-4 text-sky-500" />;
      case 'stripe_webhooks':
        return <CreditCard className="w-4 h-4 text-purple-500" />;
      case 'email_service':
        return <Mail className="w-4 h-4 text-amber-500" />;
      case 'calendar_sync':
        return <Calendar className="w-4 h-4 text-blue-500" />;
      case 'widget_service':
        return <Globe className="w-4 h-4 text-indigo-500" />;
      default:
        return <Activity className="w-4 h-4 text-slate-500" />;
    }
  };

  return (
    <div className="p-6 sm:p-8 space-y-8 max-w-7xl mx-auto">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2.5">
            <h1 className="text-2xl font-bold text-slate-900">
              System Health & Infrastructure
            </h1>
            <span
              className={`px-2.5 py-0.5 rounded-full text-xs font-bold uppercase tracking-wider ${
                overview.overallStatus === 'healthy'
                  ? 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                  : overview.overallStatus === 'degraded'
                  ? 'bg-amber-50 text-amber-700 border border-amber-200'
                  : 'bg-rose-50 text-rose-700 border border-rose-200'
              }`}
            >
              {overview.overallStatus}
            </span>
          </div>
          <p className="text-sm text-slate-500 mt-1">
            Real-time observability, uptime metrics, error logging, and latency telemetry.
          </p>
        </div>

        <button
          onClick={handleRunDiagnostic}
          disabled={refreshing}
          className="inline-flex items-center gap-2 px-4 py-2.5 bg-sky-600 hover:bg-sky-500 active:bg-sky-700 text-white rounded-xl text-xs font-bold shadow-sm transition-all disabled:opacity-50"
        >
          {refreshing ? (
            <Loader2 className="w-4 h-4 animate-spin" />
          ) : (
            <RefreshCw className="w-4 h-4" />
          )}
          {refreshing ? 'Running Diagnostics...' : 'Run Health Check'}
        </button>
      </div>

      {/* Critical Alerts Banner */}
      {overview.activeAlerts.length > 0 && (
        <div className="space-y-3">
          <h3 className="text-xs font-bold text-slate-500 uppercase tracking-wider">
            Active Critical Alerts ({overview.activeAlerts.length})
          </h3>
          <div className="grid grid-cols-1 gap-3">
            {overview.activeAlerts.map((alert) => (
              <div
                key={alert.id}
                className="p-4 bg-rose-50 border border-rose-200 rounded-2xl flex items-start justify-between gap-4 shadow-sm"
              >
                <div className="flex items-start gap-3">
                  <AlertOctagon className="w-5 h-5 text-rose-600 shrink-0 mt-0.5" />
                  <div>
                    <div className="font-bold text-rose-900 text-sm">
                      {alert.title}
                    </div>
                    <p className="text-xs text-rose-700 mt-0.5">
                      {alert.description}
                    </p>
                    <span className="text-[11px] text-rose-500 mt-1 inline-block">
                      Triggered {new Date(alert.triggeredAt).toLocaleTimeString()}
                    </span>
                  </div>
                </div>

                <button
                  onClick={() => handleAcknowledge(alert.id)}
                  disabled={acknowledgingId === alert.id}
                  className="px-3 py-1.5 bg-white border border-rose-200 text-rose-700 hover:bg-rose-100 rounded-lg text-xs font-bold transition-all shrink-0 inline-flex items-center gap-1.5"
                >
                  {acknowledgingId === alert.id ? (
                    <Loader2 className="w-3.5 h-3.5 animate-spin" />
                  ) : (
                    <Check className="w-3.5 h-3.5" />
                  )}
                  Acknowledge
                </button>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Latency & Telemetry Cards */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
        <div className="p-5 bg-white rounded-2xl border border-slate-200 shadow-sm">
          <div className="text-xs font-bold text-slate-500 uppercase">
            Overall Uptime
          </div>
          <div className="text-2xl font-black text-slate-900 mt-1">
            {overview.overallUptimePercent}%
          </div>
          <p className="text-[11px] text-emerald-600 font-semibold mt-1">
            30-day SLA Target Exceeded
          </p>
        </div>

        <div className="p-5 bg-white rounded-2xl border border-slate-200 shadow-sm">
          <div className="text-xs font-bold text-slate-500 uppercase">
            API P95 Latency
          </div>
          <div className="text-2xl font-black text-slate-900 mt-1">
            {overview.latency.apiP95Ms} ms
          </div>
          <p className="text-[11px] text-slate-400 mt-1">Avg: {overview.latency.apiAvgMs} ms</p>
        </div>

        <div className="p-5 bg-white rounded-2xl border border-slate-200 shadow-sm">
          <div className="text-xs font-bold text-slate-500 uppercase">
            AI Assistant Latency
          </div>
          <div className="text-2xl font-black text-slate-900 mt-1">
            {overview.latency.aiAvgMs} ms
          </div>
          <p className="text-[11px] text-slate-400 mt-1">Guardrails + Inference</p>
        </div>

        <div className="p-5 bg-white rounded-2xl border border-slate-200 shadow-sm">
          <div className="text-xs font-bold text-slate-500 uppercase">
            DB Query Latency
          </div>
          <div className="text-2xl font-black text-slate-900 mt-1">
            {overview.latency.dbAvgMs} ms
          </div>
          <p className="text-[11px] text-emerald-600 font-semibold mt-1">
            Pool Healthy
          </p>
        </div>
      </div>

      {/* Services Grid */}
      <div className="space-y-3">
        <h3 className="text-xs font-bold text-slate-500 uppercase tracking-wider">
          Subsystem Status & Heartbeats
        </h3>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {overview.services.map((svc) => (
            <div
              key={svc.service}
              className="p-5 bg-white rounded-2xl border border-slate-200 shadow-sm flex items-start justify-between gap-4"
            >
              <div className="flex items-start gap-3">
                <div className="p-2.5 rounded-xl bg-slate-50 border border-slate-100">
                  {getServiceIcon(svc.service)}
                </div>
                <div>
                  <div className="font-bold text-slate-900 text-sm">
                    {svc.displayName}
                  </div>
                  <div className="flex items-center gap-2 mt-1 text-xs text-slate-500">
                    <span>{svc.uptimePercent}% Uptime</span>
                    <span>•</span>
                    <span>{svc.latencyMs}ms</span>
                  </div>
                </div>
              </div>

              <div className="flex items-center gap-1 text-emerald-600 text-xs font-bold shrink-0">
                <CheckCircle2 className="w-4 h-4" />
                <span className="capitalize">{svc.status}</span>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Sanitized Error Logs Table */}
      <div className="bg-white border border-slate-200 rounded-2xl overflow-hidden shadow-sm">
        <div className="p-5 border-b border-slate-100 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <AlertTriangle className="w-4 h-4 text-amber-500" />
            <h3 className="font-bold text-slate-900 text-sm">
              Sanitized System Error Logs
            </h3>
          </div>
          <span className="text-xs font-bold px-2.5 py-1 rounded-full bg-slate-100 text-slate-700">
            {overview.recentErrors.length} Recent Logs
          </span>
        </div>

        {overview.recentErrors.length === 0 ? (
          <div className="p-8 text-center text-sm text-slate-500">
            <CheckCircle2 className="w-8 h-8 text-emerald-500 mx-auto mb-2" />
            No recent system errors logged. All subsystems operating normally.
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs text-slate-600">
              <thead className="bg-slate-50 border-b border-slate-200 uppercase font-bold text-slate-400">
                <tr>
                  <th className="py-3 px-5">Severity</th>
                  <th className="py-3 px-5">Service</th>
                  <th className="py-3 px-5">Error Type</th>
                  <th className="py-3 px-5">Sanitized Message</th>
                  <th className="py-3 px-5">Timestamp</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {overview.recentErrors.map((err) => (
                  <tr key={err.id} className="hover:bg-slate-50">
                    <td className="py-3.5 px-5">
                      <span
                        className={`px-2 py-0.5 rounded-full font-bold uppercase text-[10px] ${
                          err.severity === 'critical'
                            ? 'bg-rose-100 text-rose-700'
                            : err.severity === 'high'
                            ? 'bg-amber-100 text-amber-700'
                            : 'bg-slate-100 text-slate-700'
                        }`}
                      >
                        {err.severity}
                      </span>
                    </td>
                    <td className="py-3.5 px-5 font-semibold text-slate-800">
                      {err.serviceName}
                    </td>
                    <td className="py-3.5 px-5 font-mono text-[11px] text-slate-600">
                      {err.errorType}
                    </td>
                    <td className="py-3.5 px-5 max-w-md truncate text-slate-700">
                      {err.message}
                    </td>
                    <td className="py-3.5 px-5 text-slate-400 whitespace-nowrap">
                      {new Date(err.createdAt).toLocaleTimeString()}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}

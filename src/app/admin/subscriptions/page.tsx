import { getAdminSubscriptionsList } from '@/lib/admin/service';
import { CreditCard, CheckCircle2, Clock, XCircle } from 'lucide-react';

export default async function AdminSubscriptionsPage() {
  const subscriptions = await getAdminSubscriptionsList();

  return (
    <div className="p-6 sm:p-8 space-y-8 max-w-7xl mx-auto">
      <div>
        <h1 className="text-2xl font-bold text-slate-900">Subscription & Revenue Telemetry</h1>
        <p className="text-sm text-slate-500">
          All active, trialing, and cancelled clinic subscriptions across the platform.
        </p>
      </div>

      <div className="bg-white border border-slate-200 rounded-2xl overflow-hidden shadow-sm">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm text-slate-600">
            <thead className="bg-slate-50 border-b border-slate-200 text-xs uppercase font-bold text-slate-400">
              <tr>
                <th className="py-3.5 px-6">Clinic Practice</th>
                <th className="py-3.5 px-6">Plan Tier</th>
                <th className="py-3.5 px-6">Status</th>
                <th className="py-3.5 px-6">Billing Cadence</th>
                <th className="py-3.5 px-6">Stripe Subscription ID</th>
                <th className="py-3.5 px-6">Period End</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 font-medium">
              {subscriptions.map((s) => (
                <tr key={s.id} className="hover:bg-slate-50/80 transition-colors">
                  <td className="py-4 px-6">
                    <div className="flex items-center gap-3">
                      <div className="w-8 h-8 rounded-lg bg-indigo-50 text-indigo-600 flex items-center justify-center font-bold">
                        <CreditCard className="w-4 h-4" />
                      </div>
                      <div>
                        <div className="font-semibold text-slate-900">{s.organizationName}</div>
                        <div className="text-[11px] text-slate-400 font-mono">{s.organizationId}</div>
                      </div>
                    </div>
                  </td>
                  <td className="py-4 px-6 font-semibold text-slate-900">{s.planName}</td>
                  <td className="py-4 px-6">
                    {s.status === 'active' ? (
                      <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-bold bg-emerald-100 text-emerald-800">
                        <CheckCircle2 className="w-3 h-3" /> Active
                      </span>
                    ) : s.status === 'trialing' ? (
                      <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-bold bg-amber-100 text-amber-800">
                        <Clock className="w-3 h-3" /> Trialing
                      </span>
                    ) : (
                      <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-bold bg-slate-100 text-slate-700">
                        <XCircle className="w-3 h-3" /> Cancelled
                      </span>
                    )}
                  </td>
                  <td className="py-4 px-6 capitalize">{s.interval}</td>
                  <td className="py-4 px-6 text-xs font-mono text-slate-500">
                    {s.stripeSubscriptionId || 'N/A (Trial)'}
                  </td>
                  <td className="py-4 px-6 text-xs text-slate-400">
                    {s.currentPeriodEnd ? new Date(s.currentPeriodEnd).toLocaleDateString() : 'N/A'}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}

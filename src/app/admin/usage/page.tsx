import { createClient } from '@/lib/supabase/server-auth';
import { Zap, DollarSign, MessageSquare, Activity } from 'lucide-react';

export default async function AdminUsagePage() {
  const supabase = createClient();

  let rows: {
    organization_id: string;
    usage_date: string;
    prompt_tokens: number;
    completion_tokens: number;
    requests_count: number;
    messages_count: number;
    estimated_cost_usd: number;
  }[] = [];

  try {
    const { data } = await supabase
      .from('ai_usage')
      .select('organization_id, usage_date, prompt_tokens, completion_tokens, requests_count, messages_count, estimated_cost_usd')
      .order('usage_date', { ascending: false })
      .limit(50);
    rows = (data as unknown as typeof rows) || [];
  } catch {
    // Fallback
  }

  const totalTokens = rows.reduce((acc, r) => acc + (r.prompt_tokens || 0) + (r.completion_tokens || 0), 0);
  const totalCost = rows.reduce((acc, r) => acc + (Number(r.estimated_cost_usd) || 0), 0);
  const totalMessages = rows.reduce((acc, r) => acc + (r.messages_count || 0), 0);

  return (
    <div className="p-6 sm:p-8 space-y-8 max-w-7xl mx-auto">
      <div>
        <h1 className="text-2xl font-bold text-slate-900">AI Usage & Cost Telemetry</h1>
        <p className="text-sm text-slate-500">
          Monitor token consumption, AI request volume, and model API expenses across all dental clinics.
        </p>
      </div>

      {/* Aggregate Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-5">
        <div className="bg-white border border-slate-200 rounded-2xl p-6 shadow-sm">
          <div className="flex items-center justify-between mb-3">
            <span className="text-xs font-bold text-slate-500 uppercase tracking-wider">Total AI Messages</span>
            <div className="w-8 h-8 rounded-lg bg-sky-50 text-sky-600 flex items-center justify-center">
              <MessageSquare className="w-4 h-4" />
            </div>
          </div>
          <div className="text-3xl font-extrabold text-slate-900 mb-1">{totalMessages}</div>
          <p className="text-xs text-slate-500">Across active clinics</p>
        </div>

        <div className="bg-white border border-slate-200 rounded-2xl p-6 shadow-sm">
          <div className="flex items-center justify-between mb-3">
            <span className="text-xs font-bold text-slate-500 uppercase tracking-wider">Total Tokens Processed</span>
            <div className="w-8 h-8 rounded-lg bg-indigo-50 text-indigo-600 flex items-center justify-center">
              <Zap className="w-4 h-4" />
            </div>
          </div>
          <div className="text-3xl font-extrabold text-slate-900 mb-1">{totalTokens.toLocaleString()}</div>
          <p className="text-xs text-slate-500">Prompt & Completion Tokens</p>
        </div>

        <div className="bg-white border border-slate-200 rounded-2xl p-6 shadow-sm">
          <div className="flex items-center justify-between mb-3">
            <span className="text-xs font-bold text-slate-500 uppercase tracking-wider">Estimated Model Cost</span>
            <div className="w-8 h-8 rounded-lg bg-purple-50 text-purple-600 flex items-center justify-center">
              <DollarSign className="w-4 h-4" />
            </div>
          </div>
          <div className="text-3xl font-extrabold text-slate-900 mb-1">${totalCost.toFixed(4)}</div>
          <p className="text-xs text-slate-500">Estimated API billing</p>
        </div>
      </div>

      {/* Usage Table */}
      <div className="bg-white border border-slate-200 rounded-2xl overflow-hidden shadow-sm">
        <div className="p-6 border-b border-slate-100 flex items-center gap-2">
          <Activity className="w-4 h-4 text-slate-400" />
          <h3 className="font-bold text-slate-900 text-sm">Recent Daily Usage Logs</h3>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm text-slate-600">
            <thead className="bg-slate-50 border-b border-slate-200 text-xs uppercase font-bold text-slate-400">
              <tr>
                <th className="py-3.5 px-6">Clinic ID</th>
                <th className="py-3.5 px-6">Date</th>
                <th className="py-3.5 px-6">Requests</th>
                <th className="py-3.5 px-6">Messages</th>
                <th className="py-3.5 px-6">Prompt Tokens</th>
                <th className="py-3.5 px-6">Completion Tokens</th>
                <th className="py-3.5 px-6">Est. Cost</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 font-medium">
              {rows.length > 0 ? (
                rows.map((r, i) => (
                  <tr key={i} className="hover:bg-slate-50/80 transition-colors">
                    <td className="py-4 px-6 font-mono text-xs text-slate-800">{r.organization_id}</td>
                    <td className="py-4 px-6 text-xs text-slate-500">{r.usage_date}</td>
                    <td className="py-4 px-6">{r.requests_count}</td>
                    <td className="py-4 px-6">{r.messages_count}</td>
                    <td className="py-4 px-6 text-xs font-mono">{r.prompt_tokens}</td>
                    <td className="py-4 px-6 text-xs font-mono">{r.completion_tokens}</td>
                    <td className="py-4 px-6 font-bold text-slate-900">${Number(r.estimated_cost_usd || 0).toFixed(4)}</td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan={7} className="py-8 text-center text-slate-400 text-sm">
                    No usage telemetry recorded yet.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}

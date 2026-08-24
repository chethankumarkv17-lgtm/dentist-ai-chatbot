import { getAdminAuditLogs } from '@/lib/admin/service';
import { Terminal } from 'lucide-react';

export default async function AdminAuditLogsPage() {
  const logs = await getAdminAuditLogs(100);

  return (
    <div className="p-6 sm:p-8 space-y-8 max-w-7xl mx-auto">
      <div>
        <h1 className="text-2xl font-bold text-slate-900">Administrative Audit Trail</h1>
        <p className="text-sm text-slate-500">
          Immutable audit record of all sensitive platform actions, suspensions, and configuration changes.
        </p>
      </div>

      <div className="bg-white border border-slate-200 rounded-2xl overflow-hidden shadow-sm">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm text-slate-600">
            <thead className="bg-slate-50 border-b border-slate-200 text-xs uppercase font-bold text-slate-400">
              <tr>
                <th className="py-3.5 px-6">Timestamp</th>
                <th className="py-3.5 px-6">Action</th>
                <th className="py-3.5 px-6">Entity</th>
                <th className="py-3.5 px-6">Admin User ID</th>
                <th className="py-3.5 px-6">Details</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 font-medium">
              {logs.length > 0 ? (
                logs.map((log) => (
                  <tr key={log.id} className="hover:bg-slate-50/80 transition-colors">
                    <td className="py-4 px-6 text-xs text-slate-400 whitespace-nowrap">
                      {log.createdAt ? new Date(log.createdAt).toLocaleString() : 'Recent'}
                    </td>
                    <td className="py-4 px-6">
                      <span className="inline-flex items-center gap-1.5 font-mono text-xs font-bold px-2.5 py-1 rounded-lg bg-slate-100 text-slate-800">
                        <Terminal className="w-3 h-3 text-slate-500" />
                        {log.action}
                      </span>
                    </td>
                    <td className="py-4 px-6 capitalize text-xs font-semibold text-slate-700">
                      {log.entity} ({log.entityId?.slice(0, 8)}...)
                    </td>
                    <td className="py-4 px-6 text-xs font-mono text-slate-500">
                      {log.userId || 'system'}
                    </td>
                    <td className="py-4 px-6 text-xs text-slate-600 font-mono max-w-xs truncate">
                      {JSON.stringify(log.details || {})}
                    </td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan={5} className="py-8 text-center text-slate-400 text-sm">
                    No administrative audit logs recorded yet.
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

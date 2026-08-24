'use client';

import { useState } from 'react';
import { AdminClinicItem } from '@/lib/admin/service';
import { suspendClinicAction, reactivateClinicAction } from '@/app/actions/admin';
import {
  Building2,
  AlertTriangle,
  CheckCircle2,
  Ban,
  RotateCcw,
  Loader2,
  Clock,
} from 'lucide-react';

interface ClinicsAdminClientProps {
  initialClinics: AdminClinicItem[];
}

export default function ClinicsAdminClient({ initialClinics }: ClinicsAdminClientProps) {
  const [clinics, setClinics] = useState<AdminClinicItem[]>(initialClinics);
  const [selectedClinic, setSelectedClinic] = useState<AdminClinicItem | null>(null);
  const [suspendReason, setSuspendReason] = useState<string>('');
  const [loadingId, setLoadingId] = useState<string | null>(null);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  const handleSuspend = async (orgId: string) => {
    if (!suspendReason.trim()) {
      alert('Please provide a reason for suspending this clinic.');
      return;
    }

    setLoadingId(orgId);
    setErrorMsg(null);
    try {
      const res = await suspendClinicAction(orgId, suspendReason);
      if (res.success) {
        setClinics((prev) =>
          prev.map((c) =>
            c.id === orgId
              ? {
                  ...c,
                  isSuspended: true,
                  suspendedReason: suspendReason,
                  suspendedAt: new Date().toISOString(),
                }
              : c
          )
        );
        setSelectedClinic(null);
        setSuspendReason('');
      } else {
        setErrorMsg(res.error || 'Failed to suspend clinic');
      }
    } catch {
      setErrorMsg('Failed to suspend clinic');
    } finally {
      setLoadingId(null);
    }
  };

  const handleReactivate = async (orgId: string) => {
    if (!confirm('Are you sure you want to reactivate this clinic?')) return;

    setLoadingId(orgId);
    setErrorMsg(null);
    try {
      const res = await reactivateClinicAction(orgId);
      if (res.success) {
        setClinics((prev) =>
          prev.map((c) =>
            c.id === orgId
              ? {
                  ...c,
                  isSuspended: false,
                  suspendedReason: null,
                  suspendedAt: null,
                }
              : c
          )
        );
      } else {
        setErrorMsg(res.error || 'Failed to reactivate clinic');
      }
    } catch {
      setErrorMsg('Failed to reactivate clinic');
    } finally {
      setLoadingId(null);
    }
  };

  return (
    <div className="p-6 sm:p-8 space-y-8 max-w-7xl mx-auto">
      <div>
        <h1 className="text-2xl font-bold text-slate-900">Clinics & Practice Management</h1>
        <p className="text-sm text-slate-500">
          Directory of all dental clinics registered on Radiant Nobel, with administrative suspension controls.
        </p>
      </div>

      {errorMsg && (
        <div className="p-4 bg-rose-50 border border-rose-200 text-rose-700 rounded-xl text-sm flex items-center gap-2">
          <AlertTriangle className="w-4 h-4 shrink-0" />
          <span>{errorMsg}</span>
        </div>
      )}

      {/* Clinics Table */}
      <div className="bg-white border border-slate-200 rounded-2xl overflow-hidden shadow-sm">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm text-slate-600">
            <thead className="bg-slate-50 border-b border-slate-200 text-xs uppercase font-bold text-slate-400">
              <tr>
                <th className="py-3.5 px-6">Clinic / Organization</th>
                <th className="py-3.5 px-6">Status</th>
                <th className="py-3.5 px-6">Plan</th>
                <th className="py-3.5 px-6">Dentists</th>
                <th className="py-3.5 px-6">Appointments</th>
                <th className="py-3.5 px-6">Created</th>
                <th className="py-3.5 px-6 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 font-medium">
              {clinics.map((clinic) => (
                <tr key={clinic.id} className="hover:bg-slate-50/80 transition-colors">
                  <td className="py-4 px-6">
                    <div className="flex items-center gap-3">
                      <div className="w-8 h-8 rounded-lg bg-sky-50 text-sky-600 flex items-center justify-center font-bold">
                        <Building2 className="w-4 h-4" />
                      </div>
                      <div>
                        <div className="font-semibold text-slate-900">{clinic.name}</div>
                        <div className="text-[11px] text-slate-400 font-mono">{clinic.id}</div>
                      </div>
                    </div>
                  </td>
                  <td className="py-4 px-6">
                    {clinic.isSuspended ? (
                      <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-bold bg-rose-100 text-rose-800">
                        <Ban className="w-3 h-3" /> Suspended
                      </span>
                    ) : clinic.subscriptionStatus === 'active' ? (
                      <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-bold bg-emerald-100 text-emerald-800">
                        <CheckCircle2 className="w-3 h-3" /> Active
                      </span>
                    ) : (
                      <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-bold bg-amber-100 text-amber-800">
                        <Clock className="w-3 h-3" /> Trial
                      </span>
                    )}
                  </td>
                  <td className="py-4 px-6 font-semibold text-slate-800">{clinic.planName}</td>
                  <td className="py-4 px-6">{clinic.dentistsCount} dentists</td>
                  <td className="py-4 px-6">{clinic.appointmentsCount} bookings</td>
                  <td className="py-4 px-6 text-xs text-slate-400">
                    {clinic.createdAt ? new Date(clinic.createdAt).toLocaleDateString() : 'Recent'}
                  </td>
                  <td className="py-4 px-6 text-right">
                    {clinic.isSuspended ? (
                      <button
                        type="button"
                        onClick={() => handleReactivate(clinic.id)}
                        disabled={loadingId === clinic.id}
                        className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-emerald-50 hover:bg-emerald-100 text-emerald-700 text-xs font-bold rounded-lg transition-all"
                      >
                        {loadingId === clinic.id ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <RotateCcw className="w-3.5 h-3.5" />}
                        Reactivate
                      </button>
                    ) : (
                      <button
                        type="button"
                        onClick={() => setSelectedClinic(clinic)}
                        disabled={loadingId === clinic.id}
                        className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-rose-50 hover:bg-rose-100 text-rose-700 text-xs font-bold rounded-lg transition-all"
                      >
                        <Ban className="w-3.5 h-3.5" />
                        Suspend
                      </button>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Suspend Confirmation Modal */}
      {selectedClinic && (
        <div className="fixed inset-0 bg-slate-900/40 backdrop-blur-sm flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-2xl p-6 max-w-md w-full shadow-2xl border border-slate-200">
            <h3 className="text-lg font-bold text-slate-900 mb-2">
              Suspend Clinic: {selectedClinic.name}
            </h3>
            <p className="text-xs text-slate-500 mb-4">
              Suspending this organization will immediately disable AI receptionist bookings and block access to clinic dashboards.
            </p>

            <div className="mb-4">
              <label className="block text-xs font-bold text-slate-700 uppercase mb-1">
                Suspension Reason (Required for Audit Trail)
              </label>
              <textarea
                value={suspendReason}
                onChange={(e) => setSuspendReason(e.target.value)}
                placeholder="e.g. Terms violation, payment dispute, suspicious traffic..."
                className="w-full p-3 border border-slate-300 rounded-xl text-sm focus:ring-2 focus:ring-rose-500 outline-none"
                rows={3}
              />
            </div>

            <div className="flex items-center justify-end gap-3">
              <button
                type="button"
                onClick={() => {
                  setSelectedClinic(null);
                  setSuspendReason('');
                }}
                className="px-4 py-2 text-xs font-bold text-slate-600 hover:bg-slate-100 rounded-xl transition-all"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={() => handleSuspend(selectedClinic.id)}
                disabled={loadingId === selectedClinic.id || !suspendReason.trim()}
                className="px-4 py-2 text-xs font-bold bg-rose-600 hover:bg-rose-700 text-white rounded-xl transition-all flex items-center gap-1.5"
              >
                {loadingId === selectedClinic.id && <Loader2 className="w-3.5 h-3.5 animate-spin" />}
                Confirm Suspension
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

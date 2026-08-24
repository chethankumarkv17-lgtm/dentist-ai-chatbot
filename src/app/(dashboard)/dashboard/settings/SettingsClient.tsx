'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { RetentionPolicy } from '@/lib/privacy/types';
import {
  updateRetentionPolicyAction,
  exportClinicDataAction,
  erasePatientDataAction,
  deleteOrganizationAction,
} from '@/app/actions/privacy';
import {
  Download,
  Trash2,
  Clock,
  Save,
  CheckCircle2,
  AlertTriangle,
  Loader2,
  UserX,
  FileSpreadsheet,
} from 'lucide-react';

interface SettingsClientProps {
  organizationId: string;
  initialPolicy: RetentionPolicy;
}

export default function SettingsClient({
  organizationId,
  initialPolicy,
}: SettingsClientProps) {
  const router = useRouter();

  // Retention Policy State
  const [policy, setPolicy] = useState<RetentionPolicy>(initialPolicy);
  const [savingPolicy, setSavingPolicy] = useState<boolean>(false);
  const [policySuccess, setPolicySuccess] = useState<boolean>(false);

  // Patient Erasure State
  const [patientIdentifier, setPatientIdentifier] = useState<string>('');
  const [erasingPatient, setErasingPatient] = useState<boolean>(false);
  const [erasureResult, setErasureResult] = useState<string | null>(null);

  // Export State
  const [exporting, setExporting] = useState<boolean>(false);

  // Danger Zone
  const [deletingOrg, setDeletingOrg] = useState<boolean>(false);

  const handleSavePolicy = async (e: React.FormEvent) => {
    e.preventDefault();
    setSavingPolicy(true);
    setPolicySuccess(false);

    try {
      const res = await updateRetentionPolicyAction(organizationId, policy);
      if (res.success) {
        setPolicySuccess(true);
        setTimeout(() => setPolicySuccess(false), 4000);
      }
    } finally {
      setSavingPolicy(false);
    }
  };

  const handleExportData = async () => {
    setExporting(true);
    try {
      const res = await exportClinicDataAction(organizationId);
      if (res.success && res.data) {
        const dataStr = JSON.stringify(res.data, null, 2);
        const blob = new Blob([dataStr], { type: 'application/json' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `clinic-data-export-${new Date().toISOString().split('T')[0]}.json`;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        URL.revokeObjectURL(url);
      } else {
        alert(res.error || 'Failed to export data');
      }
    } finally {
      setExporting(false);
    }
  };

  const handleErasePatient = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!patientIdentifier.trim()) return;

    if (
      !confirm(
        `Are you sure you want to permanently erase and anonymize all records for "${patientIdentifier}"?`
      )
    ) {
      return;
    }

    setErasingPatient(true);
    setErasureResult(null);

    try {
      const res = await erasePatientDataAction(organizationId, patientIdentifier);
      if (res.success) {
        const count = res.redactedRecordsCount ?? 0;
        setErasureResult(
          `Successfully anonymized ${count} appointment records.`
        );
        setPatientIdentifier('');
      } else {
        setErasureResult(`Error: ${res.error || 'Failed to erase patient data'}`);
      }
    } finally {
      setErasingPatient(false);
    }
  };

  const handleDeleteOrganization = async () => {
    const prompt = window.prompt(
      'Type "DELETE" to confirm permanent deletion of this dental organization and all its data:'
    );
    if (prompt !== 'DELETE') return;

    setDeletingOrg(true);
    try {
      const res = await deleteOrganizationAction(organizationId);
      if (res.success) {
        router.push('/login?deleted=1');
      } else {
        alert(res.error || 'Failed to delete organization');
      }
    } finally {
      setDeletingOrg(false);
    }
  };

  return (
    <div className="space-y-8 max-w-5xl">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold text-slate-900">Privacy & Data Management</h1>
        <p className="text-sm text-slate-500">
          Configure automated data retention schedules, export machine-readable clinic data, and manage patient erasure rights.
        </p>
      </div>

      {/* 1. Automated Data Retention Policies */}
      <div className="bg-white border border-slate-200 rounded-2xl p-6 sm:p-8 shadow-sm space-y-6">
        <div className="flex items-center justify-between border-b border-slate-100 pb-4">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-lg bg-sky-50 text-sky-600 flex items-center justify-center font-bold">
              <Clock className="w-4 h-4" />
            </div>
            <div>
              <h3 className="text-base font-bold text-slate-900">Configurable Data Retention</h3>
              <p className="text-xs text-slate-500">
                Automated background purges for historical appointments and chat conversations.
              </p>
            </div>
          </div>
          {policySuccess && (
            <span className="text-xs font-bold text-emerald-600 flex items-center gap-1">
              <CheckCircle2 className="w-4 h-4" /> Saved!
            </span>
          )}
        </div>

        <form onSubmit={handleSavePolicy} className="space-y-4">
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div>
              <label className="block text-xs font-bold text-slate-700 uppercase mb-1">
                Appointments Retention
              </label>
              <select
                value={policy.appointmentDays}
                onChange={(e) =>
                  setPolicy({ ...policy, appointmentDays: Number(e.target.value) })
                }
                className="w-full px-3 py-2 border border-slate-300 rounded-xl text-sm focus:ring-2 focus:ring-sky-500 outline-none"
              >
                <option value={90}>90 Days (3 Months)</option>
                <option value={180}>180 Days (6 Months)</option>
                <option value={365}>365 Days (1 Year)</option>
                <option value={2555}>2,555 Days (7 Years)</option>
              </select>
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 uppercase mb-1">
                AI Chat Transcripts
              </label>
              <select
                value={policy.transcriptDays}
                onChange={(e) =>
                  setPolicy({ ...policy, transcriptDays: Number(e.target.value) })
                }
                className="w-full px-3 py-2 border border-slate-300 rounded-xl text-sm focus:ring-2 focus:ring-sky-500 outline-none"
              >
                <option value={30}>30 Days (1 Month)</option>
                <option value={60}>60 Days (2 Months)</option>
                <option value={90}>90 Days (3 Months)</option>
                <option value={365}>365 Days (1 Year)</option>
              </select>
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 uppercase mb-1">
                Anonymous Analytics
              </label>
              <select
                value={policy.analyticsDays}
                onChange={(e) =>
                  setPolicy({ ...policy, analyticsDays: Number(e.target.value) })
                }
                className="w-full px-3 py-2 border border-slate-300 rounded-xl text-sm focus:ring-2 focus:ring-sky-500 outline-none"
              >
                <option value={90}>90 Days (3 Months)</option>
                <option value={180}>180 Days (6 Months)</option>
                <option value={365}>365 Days (1 Year)</option>
              </select>
            </div>
          </div>

          <div className="flex justify-end pt-2">
            <button
              type="submit"
              disabled={savingPolicy}
              className="px-4 py-2 bg-slate-900 hover:bg-slate-800 text-white rounded-xl text-xs font-bold transition-all flex items-center gap-1.5"
            >
              {savingPolicy ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Save className="w-3.5 h-3.5" />}
              Save Retention Schedule
            </button>
          </div>
        </form>
      </div>

      {/* 2. Right to Data Portability (Export) & Patient Erasure */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Data Portability */}
        <div className="bg-white border border-slate-200 rounded-2xl p-6 shadow-sm flex flex-col justify-between space-y-4">
          <div>
            <div className="flex items-center gap-2 mb-2">
              <Download className="w-5 h-5 text-sky-600" />
              <h3 className="font-bold text-slate-900 text-base">Export Clinic Data</h3>
            </div>
            <p className="text-xs text-slate-500 leading-relaxed">
              Download your entire clinic directory, dentists, services, appointment history, and tickets as a machine-readable JSON archive.
            </p>
          </div>

          <button
            type="button"
            onClick={handleExportData}
            disabled={exporting}
            className="w-full py-2.5 bg-slate-100 hover:bg-slate-200 text-slate-800 rounded-xl text-xs font-bold transition-all flex items-center justify-center gap-2"
          >
            {exporting ? <Loader2 className="w-4 h-4 animate-spin" /> : <FileSpreadsheet className="w-4 h-4" />}
            Download JSON Export
          </button>
        </div>

        {/* Patient Right to Erasure */}
        <div className="bg-white border border-slate-200 rounded-2xl p-6 shadow-sm space-y-4">
          <div>
            <div className="flex items-center gap-2 mb-2">
              <UserX className="w-5 h-5 text-rose-600" />
              <h3 className="font-bold text-slate-900 text-base">Patient Right to Erasure</h3>
            </div>
            <p className="text-xs text-slate-500 leading-relaxed">
              Permanently anonymize and erase a patient&apos;s phone number, email, and name across all past appointment records.
            </p>
          </div>

          <form onSubmit={handleErasePatient} className="space-y-2">
            <input
              type="text"
              required
              value={patientIdentifier}
              onChange={(e) => setPatientIdentifier(e.target.value)}
              placeholder="Patient email or phone number..."
              className="w-full px-3 py-2 border border-slate-300 rounded-xl text-xs focus:ring-2 focus:ring-rose-500 outline-none"
            />
            <button
              type="submit"
              disabled={erasingPatient || !patientIdentifier.trim()}
              className="w-full py-2 bg-rose-50 hover:bg-rose-100 text-rose-700 rounded-xl text-xs font-bold transition-all flex items-center justify-center gap-1.5"
            >
              {erasingPatient ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Trash2 className="w-3.5 h-3.5" />}
              Erase Patient Records
            </button>
          </form>

          {erasureResult && (
            <p className="text-xs font-semibold text-slate-700 bg-slate-50 p-2 rounded-lg border border-slate-100">
              {erasureResult}
            </p>
          )}
        </div>
      </div>

      {/* 3. Danger Zone: Organization Deletion */}
      <div className="bg-rose-50/60 border border-rose-200 rounded-2xl p-6 sm:p-8 space-y-4">
        <div className="flex items-center gap-2 text-rose-800">
          <AlertTriangle className="w-5 h-5" />
          <h3 className="font-bold text-base">Danger Zone</h3>
        </div>
        <p className="text-xs text-rose-700 leading-relaxed">
          Permanently deletes this dental organization, canceling any active Stripe subscriptions and wiping all dentists, services, appointment records, and chat widgets. This action cannot be reversed.
        </p>

        <div className="pt-2 flex justify-end">
          <button
            type="button"
            onClick={handleDeleteOrganization}
            disabled={deletingOrg}
            className="px-4 py-2.5 bg-rose-600 hover:bg-rose-700 text-white rounded-xl text-xs font-bold transition-all flex items-center gap-2 shadow-sm"
          >
            {deletingOrg ? <Loader2 className="w-4 h-4 animate-spin" /> : <Trash2 className="w-4 h-4" />}
            Permanently Delete Organization
          </button>
        </div>
      </div>
    </div>
  );
}

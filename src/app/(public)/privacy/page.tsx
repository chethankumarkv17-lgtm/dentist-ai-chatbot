import Link from 'next/link';
import { ShieldCheck, Lock, Database, Trash2, Download, AlertCircle } from 'lucide-react';

export default function PrivacyPolicyPage() {
  return (
    <div className="min-h-screen bg-slate-50 py-16 px-4 sm:px-6 lg:px-8">
      <div className="max-w-4xl mx-auto space-y-10">
        {/* Header */}
        <div className="text-center space-y-3">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-emerald-100 text-emerald-800 text-xs font-bold uppercase">
            <ShieldCheck className="w-4 h-4" />
            Privacy-First Architecture
          </div>
          <h1 className="text-4xl font-extrabold text-slate-900 tracking-tight">Privacy Policy</h1>
          <p className="text-sm text-slate-500">
            Last Updated: August 23, 2026 • Transparent Data Practices & Patient Privacy
          </p>
        </div>

        {/* Content Box */}
        <div className="bg-white border border-slate-200 rounded-2xl p-8 sm:p-12 shadow-sm space-y-8 text-slate-700 leading-relaxed">
          {/* Section 1: Overview */}
          <section className="space-y-3">
            <h2 className="text-xl font-bold text-slate-900 flex items-center gap-2">
              <Lock className="w-5 h-5 text-emerald-600" />
              1. Our Privacy Commitments
            </h2>
            <p>
              Radiant Nobel (&quot;Platform&quot;, &quot;we&quot;, &quot;us&quot;) provides AI receptionist software and booking infrastructure for dental practices. We prioritize patient and clinic privacy by enforcing strict data minimization, tenant isolation, and automated data retention controls.
            </p>
          </section>

          {/* Section 2: Data Minimization */}
          <section className="space-y-3">
            <h2 className="text-xl font-bold text-slate-900 flex items-center gap-2">
              <Database className="w-5 h-5 text-sky-600" />
              2. Information We Collect & Data Minimization
            </h2>
            <p>
              We collect only the minimum information necessary to schedule appointments and facilitate clinic communication:
            </p>
            <ul className="list-disc pl-6 space-y-1.5 text-sm">
              <li><strong>Patient Booking Data:</strong> Name, phone number, email address, and requested dental service.</li>
              <li><strong>No Sensitive Medical Records:</strong> We do NOT collect, solicit, or store comprehensive medical histories, diagnostic scans, or Social Security Numbers.</li>
              <li><strong>Payment Information:</strong> All subscription billing is processed directly by Stripe. We never store or transmit credit card numbers.</li>
            </ul>
          </section>

          {/* Section 3: AI Processing */}
          <section className="space-y-3">
            <h2 className="text-xl font-bold text-slate-900">
              3. AI Receptionist Processing
            </h2>
            <p>
              Patient chat interactions are processed server-side through structured tools strictly to check real-time dental slot availability and submit appointments. The AI does not diagnose conditions or prescribe treatments.
            </p>
          </section>

          {/* Section 4: Data Retention */}
          <section className="space-y-3">
            <h2 className="text-xl font-bold text-slate-900">
              4. Configurable Data Retention
            </h2>
            <p>
              Each dental clinic configures independent data retention periods (e.g. 90 days, 365 days) for appointment logs and conversation transcripts. Once expired, records are permanently deleted from database tables.
            </p>
          </section>

          {/* Section 5: Patient Rights */}
          <section className="space-y-3">
            <h2 className="text-xl font-bold text-slate-900 flex items-center gap-2">
              <Trash2 className="w-5 h-5 text-rose-600" />
              5. Your Rights: Export & Erasure
            </h2>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-2">
              <div className="p-4 bg-slate-50 rounded-xl border border-slate-100">
                <h4 className="font-bold text-slate-900 text-sm flex items-center gap-1.5 mb-1">
                  <Download className="w-4 h-4 text-sky-600" /> Right to Data Portability
                </h4>
                <p className="text-xs text-slate-600">
                  Clinic administrators can export full practice records in machine-readable JSON format anytime in Dashboard Settings.
                </p>
              </div>
              <div className="p-4 bg-slate-50 rounded-xl border border-slate-100">
                <h4 className="font-bold text-slate-900 text-sm flex items-center gap-1.5 mb-1">
                  <Trash2 className="w-4 h-4 text-rose-600" /> Right to Erasure
                </h4>
                <p className="text-xs text-slate-600">
                  Patients or clinic staff can trigger immediate erasure and anonymization of personal identifiers across all appointment logs.
                </p>
              </div>
            </div>
          </section>

          {/* Section 6: Compliance Disclosure */}
          <section className="space-y-3 pt-4 border-t border-slate-100">
            <div className="p-4 bg-amber-50 rounded-xl border border-amber-200 text-xs text-amber-900 flex items-start gap-3">
              <AlertCircle className="w-5 h-5 text-amber-600 shrink-0 mt-0.5" />
              <div>
                <strong>Honest Compliance Disclosure:</strong> Radiant Nobel employs industry-standard encryption in transit (TLS 1.3) and at rest (AES-256), multi-tenant Row-Level Security, and privacy-first sanitization. We do not claim independent certification or legal seals (e.g. certified HIPAA seal) unless independently audited and verified for your specific jurisdiction.
              </div>
            </div>
          </section>

          {/* Contact */}
          <div className="pt-6 text-xs text-slate-500 flex flex-col sm:flex-row items-center justify-between gap-4">
            <span>Questions about our privacy policy?</span>
            <Link href="/help" className="font-bold text-sky-600 hover:text-sky-700">
              Visit the Help Center
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}

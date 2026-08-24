import Link from 'next/link';
import { FileText } from 'lucide-react';

export default function TermsOfServicePage() {
  return (
    <div className="min-h-screen bg-slate-50 py-16 px-4 sm:px-6 lg:px-8">
      <div className="max-w-4xl mx-auto space-y-10">
        {/* Header */}
        <div className="text-center space-y-3">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-sky-100 text-sky-800 text-xs font-bold uppercase">
            <FileText className="w-4 h-4" />
            Terms of Service
          </div>
          <h1 className="text-4xl font-extrabold text-slate-900 tracking-tight">Terms of Service</h1>
          <p className="text-sm text-slate-500">
            Last Updated: August 23, 2026 • Agreement for Dental Practices & Platform Users
          </p>
        </div>

        {/* Content Box */}
        <div className="bg-white border border-slate-200 rounded-2xl p-8 sm:p-12 shadow-sm space-y-8 text-slate-700 leading-relaxed">
          <section className="space-y-3">
            <h2 className="text-xl font-bold text-slate-900">1. Acceptance of Terms</h2>
            <p>
              By accessing Radiant Nobel (&quot;Service&quot;, &quot;Platform&quot;) or deploying the AI Receptionist widget, you agree to be bound by these Terms of Service. If you are registering on behalf of a dental practice or clinic, you represent that you have authority to bind the entity.
            </p>
          </section>

          <section className="space-y-3">
            <h2 className="text-xl font-bold text-slate-900">2. Nature of the AI Receptionist</h2>
            <p>
              The AI receptionist is an administrative assistant for answering approved clinic FAQs and booking appointments. <strong>The AI is not a medical professional, does not provide medical diagnoses, and cannot prescribe treatments or medication.</strong> Clinic owners are responsible for ensuring that all emergency inquiries are properly escalated.
            </p>
          </section>

          <section className="space-y-3">
            <h2 className="text-xl font-bold text-slate-900">3. Subscription & Billing</h2>
            <p>
              Radiant Nobel offers Starter, Growth, and Pro subscription plans billed monthly or annually via Stripe. Subscriptions renew automatically unless cancelled via the Stripe Customer Portal prior to the renewal date.
            </p>
          </section>

          <section className="space-y-3">
            <h2 className="text-xl font-bold text-slate-900">4. Data Ownership & Tenant Privacy</h2>
            <p>
              You retain full ownership of all patient booking data, clinic services, and custom knowledge base entries. We do not sell or monetize your clinic data or patient details.
            </p>
          </section>

          <section className="space-y-3">
            <h2 className="text-xl font-bold text-slate-900">5. Limitation of Liability</h2>
            <p>
              To the maximum extent permitted by law, Radiant Nobel is not liable for indirect, incidental, or consequential damages arising from internet interruptions, third-party calendar OAuth outages, or patient cancellations.
            </p>
          </section>

          <div className="pt-6 border-t border-slate-100 flex items-center justify-between text-xs text-slate-500">
            <span>Questions regarding our terms?</span>
            <Link href="/contact" className="font-bold text-sky-600 hover:text-sky-700">
              Contact Support
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}

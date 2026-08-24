import Link from 'next/link';
import { RotateCcw, Clock, CreditCard, ShieldCheck } from 'lucide-react';

export default function RefundPolicyPage() {
  return (
    <div className="min-h-screen bg-slate-50 py-16 px-4 sm:px-6 lg:px-8">
      <div className="max-w-4xl mx-auto space-y-10">
        {/* Header */}
        <div className="text-center space-y-3">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-emerald-100 text-emerald-800 text-xs font-bold uppercase">
            <RotateCcw className="w-4 h-4" />
            Fair Billing Guarantee
          </div>
          <h1 className="text-4xl font-extrabold text-slate-900 tracking-tight">Refund & Cancellation Policy</h1>
          <p className="text-sm text-slate-500">
            Last Updated: August 23, 2026 • Transparent & Fair Terms
          </p>
        </div>

        {/* Content Box */}
        <div className="bg-white border border-slate-200 rounded-2xl p-8 sm:p-12 shadow-sm space-y-8 text-slate-700 leading-relaxed">
          <section className="space-y-3">
            <h2 className="text-xl font-bold text-slate-900 flex items-center gap-2">
              <Clock className="w-5 h-5 text-sky-600" />
              1. 14-Day Free Trial
            </h2>
            <p>
              All new dental clinics receive a full 14-day unrestricted free trial. No charges occur during your trial period, and you can cancel anytime with zero penalty.
            </p>
          </section>

          <section className="space-y-3">
            <h2 className="text-xl font-bold text-slate-900 flex items-center gap-2">
              <CreditCard className="w-5 h-5 text-indigo-600" />
              2. Subscription Cancellation
            </h2>
            <p>
              You can cancel your subscription at any time directly through the Stripe Customer Portal in <strong>Dashboard -&gt; Billing</strong>. Upon cancellation, your account remains active until the end of your paid billing cycle with no subsequent renewal charges.
            </p>
          </section>

          <section className="space-y-3">
            <h2 className="text-xl font-bold text-slate-900 flex items-center gap-2">
              <ShieldCheck className="w-5 h-5 text-emerald-600" />
              3. Refund Eligibility
            </h2>
            <ul className="list-disc pl-6 space-y-2 text-sm">
              <li><strong>Monthly Subscriptions:</strong> Billed at the beginning of each billing month. If you experience an unresolved technical issue, contact support within 7 days of renewal for an evaluation.</li>
              <li><strong>Annual Subscriptions:</strong> Pro-rated refunds are available within 30 days of annual renewal upon written request to support.</li>
            </ul>
          </section>

          <div className="pt-6 border-t border-slate-100 flex items-center justify-between text-xs text-slate-500">
            <span>Questions about billing or refunds?</span>
            <Link href="/help/managing-subscriptions-billing" className="font-bold text-sky-600 hover:text-sky-700">
              Billing Help Guide
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}

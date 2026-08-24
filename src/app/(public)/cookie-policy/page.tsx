import Link from 'next/link';
import { Cookie, Shield, CheckCircle2 } from 'lucide-react';

export default function CookiePolicyPage() {
  return (
    <div className="min-h-screen bg-slate-50 py-16 px-4 sm:px-6 lg:px-8">
      <div className="max-w-4xl mx-auto space-y-10">
        {/* Header */}
        <div className="text-center space-y-3">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-amber-100 text-amber-800 text-xs font-bold uppercase">
            <Cookie className="w-4 h-4" />
            Cookie & Tracking Policy
          </div>
          <h1 className="text-4xl font-extrabold text-slate-900 tracking-tight">Cookie Policy</h1>
          <p className="text-sm text-slate-500">
            Last Updated: August 23, 2026 • Minimal & Privacy-Preserving Cookies
          </p>
        </div>

        {/* Content Box */}
        <div className="bg-white border border-slate-200 rounded-2xl p-8 sm:p-12 shadow-sm space-y-8 text-slate-700 leading-relaxed">
          <section className="space-y-3">
            <h2 className="text-xl font-bold text-slate-900 flex items-center gap-2">
              <Shield className="w-5 h-5 text-sky-600" />
              1. How We Use Cookies
            </h2>
            <p>
              Radiant Nobel uses only essential session cookies required for user authentication, security verification, and CSRF protection. We do NOT use invasive cross-site tracking cookies or sell your browsing history to third-party ad networks.
            </p>
          </section>

          <section className="space-y-3">
            <h2 className="text-xl font-bold text-slate-900">
              2. Categories of Cookies
            </h2>
            <div className="space-y-3 pt-2">
              <div className="p-4 bg-slate-50 rounded-xl border border-slate-100">
                <h4 className="font-bold text-slate-900 text-sm flex items-center gap-1.5 mb-1">
                  <CheckCircle2 className="w-4 h-4 text-emerald-600" /> Strictly Essential Cookies
                </h4>
                <p className="text-xs text-slate-600">
                  Required for user authentication sessions, role-based access control, and platform security tokens.
                </p>
              </div>

              <div className="p-4 bg-slate-50 rounded-xl border border-slate-100">
                <h4 className="font-bold text-slate-900 text-sm flex items-center gap-1.5 mb-1">
                  <CheckCircle2 className="w-4 h-4 text-sky-600" /> Functional Widget Cookies
                </h4>
                <p className="text-xs text-slate-600">
                  Used within the chat widget solely to remember active chat session state across page navigation on the clinic website.
                </p>
              </div>
            </div>
          </section>

          <section className="space-y-3">
            <h2 className="text-xl font-bold text-slate-900">
              3. Managing Your Cookies
            </h2>
            <p>
              You can control and disable cookies through your web browser settings. Disabling essential session cookies may prevent you from logging into your clinic dashboard.
            </p>
          </section>

          <div className="pt-6 border-t border-slate-100 flex items-center justify-between text-xs text-slate-500">
            <span>Learn more about our privacy safeguards</span>
            <Link href="/privacy" className="font-bold text-sky-600 hover:text-sky-700">
              Privacy Policy
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}

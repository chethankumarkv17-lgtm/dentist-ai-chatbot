import React from 'react';
import Link from 'next/link';
import { signup } from '@/app/actions/auth';
import { ArrowRight, ShieldCheck, CheckCircle2 } from 'lucide-react';
import { LiquidOrb } from '@/components/ui/LiquidOrb';

export default function SignupPage() {
  return (
    <div className="min-h-screen flex flex-col items-center justify-center p-4 py-12 relative overflow-hidden">
      {/* Background Liquid Atmosphere */}
      <div
        aria-hidden="true"
        className="absolute inset-0 pointer-events-none overflow-hidden select-none -z-10"
      >
        <div className="absolute top-1/4 right-1/3 w-[600px] h-[600px] bg-blue-500/10 rounded-full blur-3xl" />
        <div className="absolute bottom-1/4 left-1/4 w-[500px] h-[500px] bg-indigo-500/10 rounded-full blur-3xl" />
      </div>

      {/* Floating 3D Liquid Orb Above Card */}
      <div className="mb-4 relative z-10 flex flex-col items-center animate-fade-in">
        <LiquidOrb
          state="idle"
          size="md"
          showStateLabel={false}
          interactive={false}
        />
        <span className="text-[11px] font-black uppercase tracking-widest text-slate-400 mt-1">
          New Practice Setup
        </span>
      </div>

      <div className="max-w-md w-full liquid-glass-strong rounded-3xl shadow-2xl overflow-hidden border border-white/80 animate-fade-in relative z-10">
        {/* Header */}
        <div className="bg-slate-900/90 backdrop-blur-md p-6 text-center text-white border-b border-slate-800">
          <h1 className="text-xl font-black tracking-tight text-white">Create Practice Account</h1>
          <p className="text-xs text-slate-300 mt-1 font-medium">Start your 14-day free trial. No credit card required.</p>
        </div>

        <div className="p-8 space-y-6">
          {/* Trust points with Liquid Glass */}
          <div className="bg-blue-50/90 border border-blue-200/80 rounded-2xl p-3.5 space-y-2 text-xs text-blue-900 font-bold shadow-2xs">
            <div className="flex items-center gap-2">
              <CheckCircle2 className="w-3.5 h-3.5 text-blue-600 shrink-0" />
              <span>Full 24/7 AI Receptionist & Chatbot</span>
            </div>
            <div className="flex items-center gap-2">
              <CheckCircle2 className="w-3.5 h-3.5 text-blue-600 shrink-0" />
              <span>WhatsApp Business & Calendar Sync</span>
            </div>
          </div>

          <form action={signup} className="space-y-4">
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-xs font-black text-slate-800 mb-1">First Name</label>
                <input
                  name="first_name"
                  type="text"
                  required
                  placeholder="Dr. Rahul"
                  className="w-full px-3.5 py-2.5 liquid-glass-input rounded-xl text-sm focus:outline-none transition-all"
                />
              </div>
              <div>
                <label className="block text-xs font-black text-slate-800 mb-1">Last Name</label>
                <input
                  name="last_name"
                  type="text"
                  required
                  placeholder="Deshpande"
                  className="w-full px-3.5 py-2.5 liquid-glass-input rounded-xl text-sm focus:outline-none transition-all"
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-black text-slate-800 mb-1">Clinic Work Email</label>
              <input
                name="email"
                type="email"
                required
                placeholder="dentist@apexdental.com"
                className="w-full px-3.5 py-2.5 liquid-glass-input rounded-xl text-sm focus:outline-none transition-all"
              />
            </div>

            <div>
              <label className="block text-xs font-black text-slate-800 mb-1">Create Password</label>
              <input
                name="password"
                type="password"
                required
                placeholder="••••••••"
                className="w-full px-3.5 py-2.5 liquid-glass-input rounded-xl text-sm focus:outline-none transition-all"
              />
            </div>

            <button
              type="submit"
              className="w-full inline-flex items-center justify-center gap-2 py-3 px-4 rounded-xl bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white text-sm font-black shadow-md shadow-blue-500/25 transition-all group touch-target cursor-pointer"
            >
              <span>Create Practice & Onboard</span>
              <ArrowRight className="w-4 h-4 group-hover:translate-x-0.5 transition-transform" />
            </button>
          </form>

          <div className="pt-2 text-center text-xs text-slate-600 font-medium">
            Already have an account?{' '}
            <Link href="/login" className="text-blue-600 font-black hover:underline">
              Sign In to Practice
            </Link>
          </div>

          <div className="pt-2 border-t border-slate-200/60 flex items-center justify-center gap-1.5 text-[11px] text-slate-400 font-medium">
            <ShieldCheck className="w-3.5 h-3.5 text-emerald-500" />
            <span>Encrypted • HIPAA & Razorpay Compliant</span>
          </div>
        </div>
      </div>
    </div>
  );
}

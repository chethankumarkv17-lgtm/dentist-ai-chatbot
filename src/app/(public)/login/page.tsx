import React from 'react';
import Link from 'next/link';
import { login, quickDemoLogin } from '@/app/actions/auth';
import { Sparkles, ArrowRight, ShieldCheck, Stethoscope } from 'lucide-react';

export default function LoginPage() {
  return (
    <div className="min-h-screen flex items-center justify-center p-4 relative overflow-hidden">
      {/* Background Liquid Atmosphere */}
      <div
        aria-hidden="true"
        className="absolute inset-0 pointer-events-none overflow-hidden select-none -z-10"
      >
        <div className="absolute top-1/4 left-1/3 w-[600px] h-[600px] bg-blue-500/10 rounded-full blur-3xl" />
        <div className="absolute bottom-1/4 right-1/4 w-[500px] h-[500px] bg-indigo-500/10 rounded-full blur-3xl" />
      </div>

      <div className="max-w-md w-full liquid-glass-strong rounded-3xl shadow-2xl overflow-hidden border border-white/80 animate-fade-in relative z-10">
        {/* Header with Liquid Glass Gradient */}
        <div className="bg-slate-900/90 backdrop-blur-md p-6 text-center text-white border-b border-slate-800">
          <div className="inline-flex items-center justify-center w-12 h-12 rounded-2xl bg-gradient-to-br from-blue-600 to-indigo-600 mb-3 shadow-lg shadow-blue-500/30">
            <Stethoscope className="w-6 h-6 text-white" />
          </div>
          <h1 className="text-xl font-black tracking-tight text-white">Radiant Nobel</h1>
          <p className="text-xs text-slate-300 mt-1 font-medium">Autonomous 24/7 AI Receptionist Platform</p>
        </div>

        <div className="p-8 space-y-6">
          {/* Quick Demo Access */}
          <div className="bg-blue-50/90 border border-blue-200/80 rounded-2xl p-4 text-center shadow-2xs">
            <p className="text-xs font-bold text-blue-900 mb-2.5 flex items-center justify-center gap-1.5">
              <Sparkles className="w-4 h-4 text-blue-600 animate-pulse" />
              <span>Instant Interactive Demo Access</span>
            </p>
            <form action={quickDemoLogin}>
              <button
                type="submit"
                className="w-full bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white text-xs font-black py-3 px-4 rounded-xl transition-all shadow-md shadow-blue-500/20 flex items-center justify-center gap-2 group cursor-pointer"
              >
                <span>Enter Clinic Dashboard Directly</span>
                <ArrowRight className="w-3.5 h-3.5 group-hover:translate-x-0.5 transition-transform" />
              </button>
            </form>
          </div>

          <div className="relative flex items-center justify-center">
            <div className="border-t border-slate-200/80 w-full" />
            <span className="bg-white/90 px-3 text-xs text-slate-400 font-bold uppercase tracking-wider absolute">
              or sign in with email
            </span>
          </div>

          {/* Standard Form */}
          <form action={login} className="space-y-4">
            <div>
              <label className="block text-xs font-black text-slate-800 mb-1">Email Address</label>
              <input
                name="email"
                type="email"
                defaultValue="dr.smith@downtowndental.com"
                required
                placeholder="dentist@clinic.com"
                className="w-full px-4 py-2.5 liquid-glass-input rounded-xl text-sm focus:outline-none transition-all"
              />
            </div>

            <div>
              <div className="flex justify-between items-center mb-1">
                <label className="block text-xs font-black text-slate-800">Password</label>
                <Link href="/forgot-password" className="text-xs text-blue-600 font-bold hover:underline">
                  Forgot?
                </Link>
              </div>
              <input
                name="password"
                type="password"
                defaultValue="password123"
                required
                placeholder="••••••••"
                className="w-full px-4 py-2.5 liquid-glass-input rounded-xl text-sm focus:outline-none transition-all"
              />
            </div>

            <button
              type="submit"
              className="w-full bg-slate-900 hover:bg-slate-800 text-white text-sm font-black py-3 px-4 rounded-xl transition-all shadow-md cursor-pointer"
            >
              Sign In to Practice
            </button>
          </form>

          <div className="pt-2 text-center text-xs text-slate-600 font-medium">
            Don&apos;t have an account?{' '}
            <Link href="/signup" className="text-blue-600 font-black hover:underline">
              Create Clinic Practice
            </Link>
          </div>

          <div className="pt-2 border-t border-slate-200/60 flex items-center justify-center gap-1.5 text-[11px] text-slate-400 font-medium">
            <ShieldCheck className="w-3.5 h-3.5 text-emerald-500" />
            <span>End-to-end encrypted tenant isolation</span>
          </div>
        </div>
      </div>
    </div>
  );
}

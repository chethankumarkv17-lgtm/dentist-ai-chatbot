import React from 'react';
import Link from 'next/link';
import { login, quickDemoLogin } from '@/app/actions/auth';
import { Sparkles, ArrowRight, ShieldCheck, Stethoscope } from 'lucide-react';

export default function LoginPage() {
  return (
    <div className="min-h-screen bg-gradient-to-b from-slate-900 via-slate-800 to-slate-900 flex items-center justify-center p-4">
      <div className="max-w-md w-full bg-white rounded-2xl shadow-2xl overflow-hidden border border-slate-100">
        <div className="bg-slate-900 p-6 text-center text-white border-b border-slate-800">
          <div className="inline-flex items-center justify-center w-12 h-12 rounded-xl bg-blue-600 mb-3 shadow-lg shadow-blue-500/30">
            <Stethoscope className="w-6 h-6 text-white" />
          </div>
          <h1 className="text-xl font-bold tracking-tight">Radiant Nobel</h1>
          <p className="text-xs text-slate-400 mt-1">Autonomous AI Receptionist & Dental Practice Suite</p>
        </div>

        <div className="p-8 space-y-6">
          {/* Quick Demo Access */}
          <div className="bg-blue-50 border border-blue-200 rounded-xl p-4 text-center">
            <p className="text-xs font-semibold text-blue-900 mb-2.5 flex items-center justify-center gap-1.5">
              <Sparkles className="w-4 h-4 text-blue-600" />
              <span>Instant Local Development Access</span>
            </p>
            <form action={quickDemoLogin}>
              <button
                type="submit"
                className="w-full bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold py-2.5 px-4 rounded-lg transition-all shadow-sm flex items-center justify-center gap-2 group"
              >
                <span>Enter Clinic Dashboard Directly</span>
                <ArrowRight className="w-3.5 h-3.5 group-hover:translate-x-0.5 transition-transform" />
              </button>
            </form>
          </div>

          <div className="relative flex items-center justify-center">
            <div className="border-t border-slate-200 w-full" />
            <span className="bg-white px-3 text-xs text-slate-400 font-medium absolute">or sign in with credentials</span>
          </div>

          {/* Standard Form */}
          <form action={login} className="space-y-4">
            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">Email Address</label>
              <input
                name="email"
                type="email"
                defaultValue="dr.smith@downtowndental.com"
                required
                placeholder="dentist@clinic.com"
                className="w-full px-3.5 py-2.5 border border-slate-300 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 focus:outline-none transition-all"
              />
            </div>

            <div>
              <div className="flex justify-between items-center mb-1">
                <label className="block text-xs font-bold text-slate-700">Password</label>
                <Link href="/forgot-password" className="text-xs text-blue-600 hover:underline">
                  Forgot?
                </Link>
              </div>
              <input
                name="password"
                type="password"
                defaultValue="password123"
                required
                placeholder="••••••••"
                className="w-full px-3.5 py-2.5 border border-slate-300 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 focus:outline-none transition-all"
              />
            </div>

            <button
              type="submit"
              className="w-full bg-slate-900 hover:bg-slate-800 text-white text-sm font-bold py-2.5 px-4 rounded-lg transition-all shadow"
            >
              Sign In to Practice
            </button>
          </form>

          <div className="pt-2 text-center text-xs text-slate-500">
            Don&apos;t have an account?{' '}
            <Link href="/signup" className="text-blue-600 font-bold hover:underline">
              Create Clinic Practice
            </Link>
          </div>

          <div className="pt-2 border-t border-slate-100 flex items-center justify-center gap-1.5 text-[11px] text-slate-400">
            <ShieldCheck className="w-3.5 h-3.5 text-emerald-500" />
            <span>End-to-end encrypted tenant isolation</span>
          </div>
        </div>
      </div>
    </div>
  );
}

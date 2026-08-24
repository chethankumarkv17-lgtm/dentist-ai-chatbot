'use client';

import React, { useEffect, useState } from 'react';
import Link from 'next/link';
import { Sparkles, ArrowRight, CheckCircle2, ShieldCheck, Phone, MessageSquare } from 'lucide-react';

export function HeroTypographyMotion() {
  const [mounted, setMounted] = useState(false);
  const [reducedMotion, setReducedMotion] = useState(false);

  useEffect(() => {
    setMounted(true);
    if (typeof window !== 'undefined' && window.matchMedia) {
      setReducedMotion(window.matchMedia('(prefers-reduced-motion: reduce)').matches);
    }
  }, []);

  // Words breakdown for staggered headline reveal
  const line1Words = ['Autonomous'];
  const gradientWords = ['24/7', 'AI', 'Receptionist'];
  const line2Words = ['for', 'Modern', 'Dental', 'Practices'];

  let globalWordIndex = 0;

  return (
    <div className="relative z-10 max-w-5xl mx-auto text-center space-y-8">
      {/* 1. Pill Badge */}
      <div
        style={{
          transitionDelay: reducedMotion ? '0ms' : '0ms',
          transitionDuration: '500ms',
          transitionTimingFunction: 'cubic-bezier(0.16, 1, 0.3, 1)',
        }}
        className={`inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-blue-50/90 border border-blue-200/80 text-blue-700 text-xs font-bold shadow-2xs transition-all ${
          mounted || reducedMotion ? 'opacity-100 translate-y-0' : 'opacity-0 -translate-y-3'
        }`}
      >
        <Sparkles className="w-3.5 h-3.5 text-blue-600 animate-pulse" />
        <span className="tracking-wide uppercase text-[11px]">The Omnichannel Dental AI Suite • Website, WhatsApp & Voice</span>
      </div>

      {/* 2. Main Hero Headline with Word-by-Word Motion */}
      <h1 className="text-4xl sm:text-6xl md:text-7xl lg:text-[76px] font-black text-slate-900 tracking-[-0.035em] leading-[1.08] max-w-4xl mx-auto">
        {/* Line 1 standard word */}
        {line1Words.map((word) => {
          const idx = globalWordIndex++;
          return (
            <span
              key={word}
              style={{
                transitionDelay: reducedMotion ? '0ms' : `${idx * 45}ms`,
                transitionDuration: '550ms',
                transitionTimingFunction: 'cubic-bezier(0.16, 1, 0.3, 1)',
              }}
              className={`inline-block mr-3 transition-all ${
                mounted || reducedMotion ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-4'
              }`}
            >
              {word}
            </span>
          );
        })}{' '}
        {/* Gradient emphasized phrase */}
        <span className="inline-block bg-gradient-to-r from-blue-600 via-indigo-600 to-blue-700 bg-clip-text text-transparent drop-shadow-2xs">
          {gradientWords.map((word) => {
            const idx = globalWordIndex++;
            return (
              <span
                key={word}
                style={{
                  transitionDelay: reducedMotion ? '0ms' : `${idx * 45}ms`,
                  transitionDuration: '550ms',
                  transitionTimingFunction: 'cubic-bezier(0.16, 1, 0.3, 1)',
                }}
                className={`inline-block mr-2.5 transition-all ${
                  mounted || reducedMotion ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-4'
                }`}
              >
                {word}
              </span>
            );
          })}
        </span>
        <br className="hidden sm:inline" />
        {/* Line 2 words */}
        {line2Words.map((word) => {
          const idx = globalWordIndex++;
          return (
            <span
              key={word}
              style={{
                transitionDelay: reducedMotion ? '0ms' : `${idx * 45}ms`,
                transitionDuration: '550ms',
                transitionTimingFunction: 'cubic-bezier(0.16, 1, 0.3, 1)',
              }}
              className={`inline-block mr-2.5 transition-all ${
                mounted || reducedMotion ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-4'
              }`}
            >
              {word}
            </span>
          );
        })}
      </h1>

      {/* 3. Subheading with Delayed Smooth Fade */}
      <p
        style={{
          transitionDelay: reducedMotion ? '0ms' : '220ms',
          transitionDuration: '600ms',
          transitionTimingFunction: 'cubic-bezier(0.16, 1, 0.3, 1)',
        }}
        className={`text-base sm:text-lg md:text-xl text-slate-600 max-w-2xl mx-auto leading-relaxed font-normal tracking-[-0.01em] transition-all ${
          mounted || reducedMotion ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-4'
        }`}
      >
        Never miss a patient call or booking again. Autonomous conversational scheduling across{' '}
        <span className="font-semibold text-slate-900">Website</span>,{' '}
        <span className="font-semibold text-slate-900">WhatsApp</span>, and{' '}
        <span className="font-semibold text-slate-900">Voice Telephony</span> with real-time calendar synchronization.
      </p>

      {/* 4. Interactive Call to Actions with Staggered Entrance */}
      <div
        style={{
          transitionDelay: reducedMotion ? '0ms' : '320ms',
          transitionDuration: '600ms',
          transitionTimingFunction: 'cubic-bezier(0.16, 1, 0.3, 1)',
        }}
        className={`flex flex-col sm:flex-row items-center justify-center gap-3.5 pt-2 transition-all ${
          mounted || reducedMotion ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-4'
        }`}
      >
        <Link
          href="/signup"
          className="w-full sm:w-auto inline-flex items-center justify-center gap-2.5 px-8 py-4 rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-extrabold text-sm sm:text-base shadow-lg shadow-blue-500/25 hover:shadow-xl hover:shadow-blue-500/35 hover:-translate-y-0.5 active:translate-y-0 transition-all group touch-target"
        >
          <span>Start 14-Day Free Trial</span>
          <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
        </Link>
        <Link
          href="/login"
          className="w-full sm:w-auto inline-flex items-center justify-center px-8 py-4 rounded-xl bg-white hover:bg-slate-50 text-slate-800 font-bold text-sm sm:text-base border border-slate-200 shadow-2xs hover:border-slate-300 hover:-translate-y-0.5 active:translate-y-0 transition-all touch-target"
        >
          Enter Interactive Demo
        </Link>
      </div>

      {/* 5. Trust Badges Staggered Entrance */}
      <div
        style={{
          transitionDelay: reducedMotion ? '0ms' : '400ms',
          transitionDuration: '600ms',
          transitionTimingFunction: 'cubic-bezier(0.16, 1, 0.3, 1)',
        }}
        className={`pt-6 flex flex-wrap items-center justify-center gap-5 sm:gap-8 text-xs font-semibold text-slate-500 transition-all ${
          mounted || reducedMotion ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-3'
        }`}
      >
        <div className="flex items-center gap-1.5">
          <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
          <span>Zero Double-Booking Guarantee</span>
        </div>
        <div className="flex items-center gap-1.5">
          <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
          <span>Razorpay UPI & e-Mandate Ready</span>
        </div>
        <div className="flex items-center gap-1.5">
          <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
          <span>Official WhatsApp Cloud API</span>
        </div>
      </div>
    </div>
  );
}

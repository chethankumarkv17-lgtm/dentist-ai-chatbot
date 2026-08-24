'use client';

import React, { useEffect, useState } from 'react';
import Link from 'next/link';
import { Sparkles, ArrowRight, CheckCircle2 } from 'lucide-react';
import { DynamicTextSlider } from '@/components/home/DynamicTextSlider';

export function HeroTypographyMotion() {
  const [mounted, setMounted] = useState(false);
  const [reducedMotion, setReducedMotion] = useState(false);

  useEffect(() => {
    setMounted(true);
    if (typeof window !== 'undefined' && window.matchMedia) {
      setReducedMotion(window.matchMedia('(prefers-reduced-motion: reduce)').matches);
    }
  }, []);

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
          transitionDuration: '750ms',
          transitionTimingFunction: 'cubic-bezier(0.22, 1, 0.36, 1)',
        }}
        className={`inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-blue-50/90 border border-blue-200/80 text-blue-700 text-xs font-bold shadow-2xs transition-all ${
          mounted || reducedMotion ? 'opacity-100 translate-y-0' : 'opacity-0 -translate-y-4'
        }`}
      >
        <Sparkles className="w-3.5 h-3.5 text-blue-600 animate-pulse" />
        <span className="tracking-wide uppercase text-[11px]">The Omnichannel Dental AI Suite • Website, WhatsApp & Voice</span>
      </div>

      {/* 2. Main Hero Headline with Slow Staggered Reveal */}
      <div className="space-y-3">
        <h1 className="text-4xl sm:text-6xl md:text-7xl lg:text-[76px] font-black text-slate-900 tracking-[-0.035em] leading-[1.08] max-w-4xl mx-auto">
          {/* Line 1 standard word */}
          {line1Words.map((word) => {
            const idx = globalWordIndex++;
            return (
              <span
                key={word}
                style={{
                  transitionDelay: reducedMotion ? '0ms' : `${idx * 60}ms`,
                  transitionDuration: '750ms',
                  transitionTimingFunction: 'cubic-bezier(0.22, 1, 0.36, 1)',
                }}
                className={`inline-block mr-3 transition-all ${
                  mounted || reducedMotion ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-6'
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
                    transitionDelay: reducedMotion ? '0ms' : `${idx * 60}ms`,
                    transitionDuration: '750ms',
                    transitionTimingFunction: 'cubic-bezier(0.22, 1, 0.36, 1)',
                  }}
                  className={`inline-block mr-2.5 transition-all ${
                    mounted || reducedMotion ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-6'
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
                  transitionDelay: reducedMotion ? '0ms' : `${idx * 60}ms`,
                  transitionDuration: '750ms',
                  transitionTimingFunction: 'cubic-bezier(0.22, 1, 0.36, 1)',
                }}
                className={`inline-block mr-2.5 transition-all ${
                  mounted || reducedMotion ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-6'
                }`}
              >
                {word}
              </span>
            );
          })}
        </h1>

        {/* Dynamic Appearing Text Slider */}
        <div
          style={{
            transitionDelay: reducedMotion ? '0ms' : '220ms',
            transitionDuration: '750ms',
            transitionTimingFunction: 'cubic-bezier(0.22, 1, 0.36, 1)',
          }}
          className={`flex flex-wrap items-center justify-center gap-2 text-base sm:text-xl md:text-2xl font-bold text-slate-700 tracking-tight transition-all ${
            mounted || reducedMotion ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-4'
          }`}
        >
          <span>Automates your clinic &amp;</span>
          <DynamicTextSlider />
        </div>
      </div>

      {/* 3. Subheading with Delayed Smooth Slow Fade */}
      <p
        style={{
          transitionDelay: reducedMotion ? '0ms' : '320ms',
          transitionDuration: '850ms',
          transitionTimingFunction: 'cubic-bezier(0.22, 1, 0.36, 1)',
        }}
        className={`text-base sm:text-lg md:text-xl text-slate-600 max-w-2xl mx-auto leading-relaxed font-normal tracking-[-0.01em] transition-all ${
          mounted || reducedMotion ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-6'
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
          transitionDelay: reducedMotion ? '0ms' : '420ms',
          transitionDuration: '950ms',
          transitionTimingFunction: 'cubic-bezier(0.22, 1, 0.36, 1)',
        }}
        className={`flex flex-col sm:flex-row items-center justify-center gap-3.5 pt-2 transition-all ${
          mounted || reducedMotion ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-6'
        }`}
      >
        <Link
          href="/signup"
          className="w-full sm:w-auto inline-flex items-center justify-center gap-2.5 px-8 py-4 rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-extrabold text-sm sm:text-base shadow-lg shadow-blue-500/25 hover:shadow-xl hover:shadow-blue-500/35 hover:-translate-y-0.5 active:translate-y-0 transition-all duration-300 group touch-target"
        >
          <span>Start 14-Day Free Trial</span>
          <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform duration-300" />
        </Link>
        <Link
          href="/login"
          className="w-full sm:w-auto inline-flex items-center justify-center px-8 py-4 rounded-xl bg-white hover:bg-slate-50 text-slate-800 font-bold text-sm sm:text-base border border-slate-200 shadow-2xs hover:border-slate-300 hover:-translate-y-0.5 active:translate-y-0 transition-all duration-300 touch-target"
        >
          Enter Interactive Demo
        </Link>
      </div>

      {/* 5. Trust Badges Staggered Entrance */}
      <div
        style={{
          transitionDelay: reducedMotion ? '0ms' : '540ms',
          transitionDuration: '1000ms',
          transitionTimingFunction: 'cubic-bezier(0.22, 1, 0.36, 1)',
        }}
        className={`pt-6 flex flex-wrap items-center justify-center gap-5 sm:gap-8 text-xs font-semibold text-slate-500 transition-all ${
          mounted || reducedMotion ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-4'
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

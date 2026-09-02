'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { Sparkles, ArrowRight, CheckCircle2, ShieldCheck, PlayCircle } from 'lucide-react';
import { DynamicTextSlider } from '@/components/home/DynamicTextSlider';
import { LiquidOrb, AIOrbState } from '@/components/ui/LiquidOrb';
import { HeroProductPreview } from '@/components/home/HeroProductPreview';

export function HeroLiquidGlass() {
  const [mounted, setMounted] = useState(false);
  const [orbState, setOrbState] = useState<AIOrbState>('idle');
  const [reducedMotion, setReducedMotion] = useState(false);

  useEffect(() => {
    setMounted(true);
    if (typeof window !== 'undefined' && window.matchMedia) {
      setReducedMotion(window.matchMedia('(prefers-reduced-motion: reduce)').matches);
    }
  }, []);

  return (
    <div className="relative z-10 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-6 sm:pt-10 pb-16">
      {/* 2-Column Desktop Grid / 1-Column Responsive Mobile Flow */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-10 lg:gap-12 items-center">
        {/* Left Column: Premium Typography & CTAs (7 cols) */}
        <div className="lg:col-span-7 space-y-6 sm:space-y-8 text-center lg:text-left">
          {/* 1. Eyebrow Badge */}
          <div
            style={{
              transitionDelay: reducedMotion ? '0ms' : '0ms',
              transitionDuration: '750ms',
              transitionTimingFunction: 'cubic-bezier(0.22, 1, 0.36, 1)',
            }}
            className={`inline-flex items-center gap-2 px-4 py-1.5 rounded-full liquid-glass text-blue-700 text-xs font-black shadow-2xs transition-all ${
              mounted || reducedMotion ? 'opacity-100 translate-y-0' : 'opacity-0 -translate-y-4'
            }`}
          >
            <Sparkles className="w-3.5 h-3.5 text-blue-600 animate-pulse" />
            <span className="tracking-wide uppercase text-[11px]">
              AI RECEPTIONIST FOR DENTAL CLINICS
            </span>
          </div>

          {/* 2. Large Headline & Single-Line "24/7 AI Receptionist" */}
          <div className="space-y-4">
            <h1 className="text-4xl sm:text-6xl lg:text-[68px] font-black text-slate-900 tracking-[-0.035em] leading-[1.10]">
              <span>Your clinic&apos;s </span>
              <span className="whitespace-nowrap inline-block font-black bg-gradient-to-r from-blue-600 via-indigo-600 to-blue-700 bg-clip-text text-transparent [box-decoration-break:clone] [-webkit-box-decoration-break:clone] px-1">
                24/7 AI Receptionist.
              </span>
            </h1>

            {/* Dynamic Rotating Tagline */}
            <div
              style={{
                transitionDelay: reducedMotion ? '0ms' : '200ms',
                transitionDuration: '750ms',
                transitionTimingFunction: 'cubic-bezier(0.22, 1, 0.36, 1)',
              }}
              className={`text-base sm:text-xl font-bold text-slate-700 tracking-tight transition-all leading-snug sm:leading-relaxed ${
                mounted || reducedMotion ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-4'
              }`}
            >
              <span>Automates your clinic &amp; </span>
              <DynamicTextSlider />
            </div>
          </div>

          {/* 3. Subtitle Description */}
          <p
            style={{
              transitionDelay: reducedMotion ? '0ms' : '300ms',
              transitionDuration: '800ms',
              transitionTimingFunction: 'cubic-bezier(0.22, 1, 0.36, 1)',
            }}
            className={`text-base sm:text-lg text-slate-600 leading-relaxed font-normal max-w-xl mx-auto lg:mx-0 transition-all ${
              mounted || reducedMotion ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-6'
            }`}
          >
            Autonomous patient scheduling across <span className="font-bold text-slate-900">Website</span>,{' '}
            <span className="font-bold text-slate-900">WhatsApp</span>, and{' '}
            <span className="font-bold text-slate-900">Voice Calls</span> with real-time dentist calendar synchronization and zero double-booking.
          </p>

          {/* 4. Primary & Secondary CTAs */}
          <div
            style={{
              transitionDelay: reducedMotion ? '0ms' : '400ms',
              transitionDuration: '850ms',
              transitionTimingFunction: 'cubic-bezier(0.22, 1, 0.36, 1)',
            }}
            className={`flex flex-col sm:flex-row items-center justify-center lg:justify-start gap-3.5 pt-2 transition-all ${
              mounted || reducedMotion ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-6'
            }`}
          >
            <Link
              href="/signup"
              className="w-full sm:w-auto inline-flex items-center justify-center gap-2.5 px-8 py-4 rounded-xl bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white font-black text-sm sm:text-base shadow-lg shadow-blue-500/25 hover:shadow-xl hover:shadow-blue-500/35 hover:-translate-y-0.5 active:translate-y-0 transition-all duration-300 group touch-target cursor-pointer"
            >
              <span>Get Started</span>
              <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform duration-300" />
            </Link>
            <Link
              href="/how-it-works"
              className="w-full sm:w-auto inline-flex items-center justify-center gap-2 px-8 py-4 rounded-xl liquid-glass hover:liquid-glass-strong text-slate-800 font-bold text-sm sm:text-base border border-slate-200/80 shadow-2xs hover:border-slate-300 hover:-translate-y-0.5 active:translate-y-0 transition-all duration-300 touch-target cursor-pointer"
            >
              <PlayCircle className="w-4 h-4 text-blue-600" />
              <span>See how it works</span>
            </Link>
          </div>

          {/* 5. Trust Badges */}
          <div
            style={{
              transitionDelay: reducedMotion ? '0ms' : '500ms',
              transitionDuration: '900ms',
              transitionTimingFunction: 'cubic-bezier(0.22, 1, 0.36, 1)',
            }}
            className={`pt-2 flex flex-wrap items-center justify-center lg:justify-start gap-5 sm:gap-7 text-xs font-bold text-slate-500 transition-all ${
              mounted || reducedMotion ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-4'
            }`}
          >
            <div className="flex items-center gap-1.5">
              <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
              <span>Zero Double-Booking</span>
            </div>
            <div className="flex items-center gap-1.5">
              <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
              <span>Razorpay UPI Ready</span>
            </div>
            <div className="flex items-center gap-1.5">
              <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
              <span>WhatsApp Cloud API</span>
            </div>
          </div>
        </div>

        {/* Right Column: 3D Iridescent Liquid Orb & Live AI State Experience (5 cols) */}
        <div
          style={{
            transitionDelay: reducedMotion ? '0ms' : '250ms',
            transitionDuration: '950ms',
            transitionTimingFunction: 'cubic-bezier(0.22, 1, 0.36, 1)',
          }}
          className={`lg:col-span-5 flex flex-col items-center justify-center transition-all ${
            mounted || reducedMotion ? 'opacity-100 scale-100' : 'opacity-0 scale-95'
          }`}
        >
          <div className="relative w-full max-w-md mx-auto flex flex-col items-center">
            {/* Master 3D Liquid Orb */}
            <LiquidOrb
              state={orbState}
              size="hero"
              showStateLabel={true}
              interactive={true}
              onStateChange={setOrbState}
            />
          </div>
        </div>
      </div>

      {/* Floating Spatial Product Preview below the hero grid */}
      <HeroProductPreview />
    </div>
  );
}

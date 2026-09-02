'use client';

import React, { useState, useEffect } from 'react';
import Image from 'next/image';
import { Sparkles, Mic, Brain, MessageSquare } from 'lucide-react';

export type AIOrbState = 'idle' | 'listening' | 'thinking' | 'responding';
export type AIOrbSize = 'sm' | 'md' | 'lg' | 'hero';

export interface LiquidOrbProps {
  state?: AIOrbState;
  size?: AIOrbSize;
  showStateLabel?: boolean;
  interactive?: boolean;
  className?: string;
  onStateChange?: (state: AIOrbState) => void;
}

const stateConfig: Record<
  AIOrbState,
  {
    label: string;
    sublabel: string;
    glowClass: string;
    animationClass: string;
    icon: React.ComponentType<{ className?: string }>;
    accentColor: string;
    imageSrc: string;
  }
> = {
  idle: {
    label: 'AI Receptionist',
    sublabel: 'Autonomous 24/7 Practice Copilot',
    glowClass: 'from-blue-500/20 via-indigo-500/15 to-cyan-400/20',
    animationClass: 'animate-orb-float',
    icon: Sparkles,
    accentColor: 'text-blue-600',
    imageSrc: '/images/liquid-orb-2.png',
  },
  listening: {
    label: 'Listening...',
    sublabel: 'Processing patient voice & intent',
    glowClass: 'from-cyan-400/30 via-blue-500/25 to-emerald-400/25',
    animationClass: 'animate-orb-responding',
    icon: Mic,
    accentColor: 'text-cyan-500',
    imageSrc: '/images/liquid-orb-2.png',
  },
  thinking: {
    label: 'Thinking...',
    sublabel: 'Checking doctor slots & clinic policies',
    glowClass: 'from-purple-500/30 via-indigo-500/25 to-pink-500/20',
    animationClass: 'animate-orb-thinking',
    icon: Brain,
    accentColor: 'text-purple-600',
    imageSrc: '/images/liquid-orb-1.png',
  },
  responding: {
    label: 'Responding...',
    sublabel: 'Autonomous voice & WhatsApp confirmation',
    glowClass: 'from-emerald-400/30 via-teal-500/25 to-blue-500/25',
    animationClass: 'animate-orb-responding',
    icon: MessageSquare,
    accentColor: 'text-emerald-600',
    imageSrc: '/images/liquid-orb-2.png',
  },
};

const sizeStyles: Record<AIOrbSize, { container: string; imgSize: number }> = {
  sm: {
    container: 'w-10 h-10',
    imgSize: 40,
  },
  md: {
    container: 'w-20 h-20 sm:w-24 sm:h-24',
    imgSize: 96,
  },
  lg: {
    container: 'w-40 h-40 sm:w-48 sm:h-48',
    imgSize: 192,
  },
  hero: {
    container: 'w-64 h-64 sm:w-80 sm:h-80 md:w-96 md:h-96 lg:w-[420px] lg:h-[420px]',
    imgSize: 420,
  },
};

export function LiquidOrb({
  state: controlledState,
  size = 'hero',
  showStateLabel = true,
  interactive = false,
  className = '',
  onStateChange,
}: LiquidOrbProps) {
  const [internalState, setInternalState] = useState<AIOrbState>('idle');
  const [reducedMotion, setReducedMotion] = useState(false);

  useEffect(() => {
    if (typeof window !== 'undefined' && window.matchMedia) {
      setReducedMotion(window.matchMedia('(prefers-reduced-motion: reduce)').matches);
    }
  }, []);

  const currentState = controlledState || internalState;
  const currentConfig = stateConfig[currentState];
  const currentSize = sizeStyles[size];

  const handleStateClick = (nextState: AIOrbState) => {
    if (!controlledState) {
      setInternalState(nextState);
    }
    onStateChange?.(nextState);
  };

  const Icon = currentConfig.icon;

  return (
    <div className={`flex flex-col items-center select-none ${className}`}>
      {/* Orb Physics Frame */}
      <div className={`relative ${currentSize.container} flex items-center justify-center`}>
        {/* Multi-Chromatics Atmospheric Glow Aura */}
        <div
          aria-hidden="true"
          className={`absolute -inset-6 sm:-inset-10 rounded-full bg-gradient-to-tr ${currentConfig.glowClass} blur-3xl opacity-75 -z-10 transition-all duration-700 ${
            reducedMotion ? '' : 'animate-orb-aura'
          }`}
        />

        {/* 3D Iridescent Liquid Glass Orb Asset */}
        <div
          className={`relative w-full h-full flex items-center justify-center transition-all duration-700 ${
            reducedMotion ? '' : currentConfig.animationClass
          }`}
        >
          <Image
            src={currentConfig.imageSrc}
            alt="3D Liquid Glass AI Receptionist Orb"
            width={currentSize.imgSize}
            height={currentSize.imgSize}
            priority={size === 'hero'}
            className="w-full h-full object-contain drop-shadow-2xl mix-blend-screen pointer-events-none"
          />

          {/* Inner Specular Highlight Lens */}
          <div
            aria-hidden="true"
            className="absolute inset-4 rounded-full border border-white/20 pointer-events-none opacity-40 shadow-[inset_0_2px_12px_rgba(255,255,255,0.4)]"
          />
        </div>
      </div>

      {/* State Label & Controls */}
      {showStateLabel && (
        <div className="mt-4 sm:mt-6 flex flex-col items-center text-center space-y-2.5">
          <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full liquid-glass border border-white/80 shadow-xs">
            <Icon className={`w-3.5 h-3.5 ${currentConfig.accentColor} animate-pulse`} />
            <span className="text-xs font-black text-slate-900 tracking-tight">{currentConfig.label}</span>
          </div>
          {size === 'hero' && (
            <p className="text-[11px] font-medium text-slate-500 tracking-tight">{currentConfig.sublabel}</p>
          )}

          {/* Interactive State Switcher for Demos & Testing */}
          {interactive && (
            <div className="pt-2 flex flex-wrap items-center justify-center gap-1.5 sm:gap-2">
              {(['idle', 'listening', 'thinking', 'responding'] as AIOrbState[]).map((st) => {
                const isActive = currentState === st;
                return (
                  <button
                    key={st}
                    type="button"
                    onClick={() => handleStateClick(st)}
                    className={`px-2.5 py-1 rounded-lg text-[11px] font-bold capitalize transition-all duration-200 cursor-pointer ${
                      isActive
                        ? 'bg-slate-900 text-white shadow-xs scale-105'
                        : 'bg-white/80 hover:bg-white text-slate-600 border border-slate-200/80'
                    }`}
                  >
                    {st}
                  </button>
                );
              })}
            </div>
          )}
        </div>
      )}
    </div>
  );
}

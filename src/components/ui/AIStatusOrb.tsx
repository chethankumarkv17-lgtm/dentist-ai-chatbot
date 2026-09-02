'use client';

import React from 'react';
import Image from 'next/image';
import { AIOrbState } from './LiquidOrb';

export interface AIStatusOrbProps {
  state?: AIOrbState;
  showText?: boolean;
  className?: string;
}

export function AIStatusOrb({
  state = 'idle',
  showText = true,
  className = '',
}: AIStatusOrbProps) {
  const labels: Record<AIOrbState, string> = {
    idle: 'AI Receptionist Active',
    listening: 'Listening to Patient...',
    thinking: 'Checking Schedule...',
    responding: 'Sending Confirmation...',
  };

  const dotColors: Record<AIOrbState, string> = {
    idle: 'bg-emerald-500',
    listening: 'bg-cyan-500',
    thinking: 'bg-purple-500',
    responding: 'bg-blue-500',
  };

  return (
    <div className={`inline-flex items-center gap-2 px-3 py-1.5 rounded-full liquid-glass border border-white/80 shadow-2xs ${className}`}>
      {/* Mini Liquid Orb */}
      <div className="relative w-5 h-5 flex items-center justify-center shrink-0">
        <Image
          src="/images/liquid-orb-2.png"
          alt="AI Status Orb"
          width={20}
          height={20}
          className="w-full h-full object-contain mix-blend-screen"
        />
        <span
          className={`absolute -bottom-0.5 -right-0.5 w-2 h-2 rounded-full border border-white ${dotColors[state]} animate-pulse`}
        />
      </div>

      {showText && (
        <span className="text-[11px] font-bold text-slate-800 tracking-tight">
          {labels[state]}
        </span>
      )}
    </div>
  );
}

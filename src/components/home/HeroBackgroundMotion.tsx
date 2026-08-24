'use client';

import React from 'react';

export function HeroBackgroundMotion() {
  return (
    <div
      aria-hidden="true"
      className="absolute inset-0 pointer-events-none overflow-hidden select-none z-0"
    >
      {/* Subtle Precision Grid Backdrop */}
      <div
        className="absolute inset-0 opacity-[0.35]"
        style={{
          backgroundImage: `radial-gradient(circle at 1px 1px, #cbd5e1 1px, transparent 0)`,
          backgroundSize: '32px 32px',
        }}
      />

      {/* Top Ambient Glow Mesh (GPU-accelerated subtle breathing) */}
      <div
        style={{
          background:
            'radial-gradient(ellipse 60% 50% at 50% 0%, rgba(37, 99, 235, 0.12) 0%, rgba(99, 102, 241, 0.06) 50%, transparent 100%)',
        }}
        className="absolute top-0 left-1/2 -translate-x-1/2 w-[1200px] h-[650px] rounded-full blur-3xl animate-pulse-glow"
      />

      {/* Subtle Soft Cyan Accent Sphere */}
      <div
        style={{
          background: 'radial-gradient(circle, rgba(14, 165, 233, 0.08) 0%, transparent 70%)',
        }}
        className="absolute -top-24 right-1/4 w-[480px] h-[480px] rounded-full blur-2xl"
      />
    </div>
  );
}

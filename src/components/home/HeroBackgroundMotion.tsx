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

      {/* Top Ambient Glow Mesh (GPU-accelerated smooth slow 8s breathing) */}
      <div
        style={{
          background:
            'radial-gradient(ellipse 65% 55% at 50% 0%, rgba(37, 99, 235, 0.14) 0%, rgba(99, 102, 241, 0.07) 50%, transparent 100%)',
        }}
        className="absolute top-0 left-1/2 -translate-x-1/2 w-[1250px] h-[700px] rounded-full blur-3xl animate-pulse-glow-slow"
      />

      {/* Subtle Soft Cyan Accent Sphere with Slow Floating Motion */}
      <div
        style={{
          background: 'radial-gradient(circle, rgba(14, 165, 233, 0.09) 0%, transparent 70%)',
        }}
        className="absolute -top-20 right-1/4 w-[500px] h-[500px] rounded-full blur-2xl animate-float-slow"
      />
    </div>
  );
}

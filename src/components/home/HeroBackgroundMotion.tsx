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
        className="absolute inset-0 opacity-[0.30]"
        style={{
          backgroundImage: `radial-gradient(circle at 1px 1px, #cbd5e1 1px, transparent 0)`,
          backgroundSize: '32px 32px',
        }}
      />

      {/* Top Ambient Glow Mesh for Liquid Glass Highlights */}
      <div
        style={{
          background:
            'radial-gradient(ellipse 70% 60% at 50% -10%, rgba(37, 99, 235, 0.16) 0%, rgba(99, 102, 241, 0.08) 45%, transparent 100%)',
        }}
        className="absolute top-0 left-1/2 -translate-x-1/2 w-[1300px] h-[750px] rounded-full blur-3xl animate-pulse-glow-slow"
      />

      {/* Subtle Soft Cyan Accent Light */}
      <div
        style={{
          background: 'radial-gradient(circle, rgba(14, 165, 233, 0.10) 0%, transparent 70%)',
        }}
        className="absolute -top-24 right-1/4 w-[520px] h-[520px] rounded-full blur-2xl animate-float-slow"
      />
    </div>
  );
}

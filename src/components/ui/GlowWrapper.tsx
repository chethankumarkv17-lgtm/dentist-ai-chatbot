'use client';

import React from 'react';

export interface GlowWrapperProps extends React.HTMLAttributes<HTMLDivElement> {
  children: React.ReactNode;
  /** Color theme for the aurora halo: 'primary' (blue/indigo/violet) | 'secondary' (soft slate/blue) */
  variant?: 'primary' | 'secondary';
  /** Cycle duration in seconds (default: 3.5s) */
  durationSeconds?: number;
  /** Border radius class to match inner button (default: 'rounded-xl') */
  roundedClassName?: string;
  className?: string;
}

export function GlowWrapper({
  children,
  variant = 'primary',
  durationSeconds = 3.5,
  roundedClassName = 'rounded-xl',
  className = '',
  ...props
}: GlowWrapperProps) {
  const gradientClass =
    variant === 'primary'
      ? 'bg-[conic-gradient(from_var(--glow-angle,0deg)_at_50%_50%,#2563eb_0%,#4f46e5_25%,#8b5cf6_50%,#06b6d4_75%,#2563eb_100%)]'
      : 'bg-[conic-gradient(from_var(--glow-angle,0deg)_at_50%_50%,rgba(203,213,225,0.7)_0%,rgba(147,197,253,0.6)_25%,rgba(226,232,240,0.8)_50%,rgba(191,219,254,0.6)_75%,rgba(203,213,225,0.7)_100%)]';

  return (
    <div className={`relative inline-flex group ${className}`} {...props}>
      {/* 1. Animated Rotating Aurora Glow Halo */}
      <div
        aria-hidden="true"
        data-testid="rotating-glow-halo"
        className={`absolute -inset-[2.5px] ${roundedClassName} overflow-hidden pointer-events-none z-0 opacity-80 group-hover:opacity-100 transition-opacity duration-300`}
      >
        <div
          className={`absolute -inset-[120%] ${gradientClass} animate-spin-glow will-change-transform blur-[8px]`}
          style={{ animationDuration: `${durationSeconds}s` }}
        />
      </div>

      {/* 2. Precision Glowing Rim Border */}
      <div
        aria-hidden="true"
        className={`absolute -inset-[1px] ${roundedClassName} overflow-hidden pointer-events-none z-0 opacity-60 group-hover:opacity-90 transition-opacity duration-300`}
      >
        <div
          className={`absolute -inset-[120%] ${gradientClass} animate-spin-glow will-change-transform blur-[1.5px]`}
          style={{ animationDuration: `${durationSeconds}s` }}
        />
      </div>

      {/* 3. Button Content (Interactive Foreground) */}
      <div className="relative z-10 w-full sm:w-auto inline-flex">
        {children}
      </div>
    </div>
  );
}
'use client';

import React from 'react';

export interface GradientMeshBackgroundProps extends React.HTMLAttributes<HTMLDivElement> {
  /** Include the procedural SVG film grain / noise texture overlay (default: true) */
  showGrain?: boolean;
  /** Opacity of the noise grain overlay between 0.04 and 0.08 (default: 0.05) */
  grainOpacity?: number;
  /** Include subtle precision dot grid backdrop (default: true) */
  showGrid?: boolean;
  /** Include soft contrast scrim ensuring WCAG AA/AAA text legibility (default: true) */
  showScrim?: boolean;
  className?: string;
}

// Compact SVG fractal noise tile (pure procedural SVG - 0 HTTP requests, 0 JS runtime cost)
const NOISE_SVG_DATA_URI = `url("data:image/svg+xml,%3Csvg viewBox='0 0 200 200' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='noiseFilter'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.80' numOctaves='3' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23noiseFilter)' opacity='1'/%3E%3C/svg%3E")`;

export function GradientMeshBackground({
  showGrain = true,
  grainOpacity = 0.05,
  showGrid = true,
  showScrim = true,
  className = '',
  children,
  ...props
}: GradientMeshBackgroundProps) {
  return (
    <div
      aria-hidden="true"
      className={`absolute inset-0 pointer-events-none overflow-hidden select-none z-0 ${className}`}
      {...props}
    >
      {/* 1. Base Gradient Canvas (White/Slate-50 top blending into dark muted green/slate bottom) */}
      <div className="absolute inset-0 bg-gradient-to-b from-white via-slate-50/70 to-slate-900/[0.04]" />

      {/* 2. Optional Precision Dot Grid */}
      {showGrid && (
        <div
          data-testid="mesh-grid"
          className="absolute inset-0 opacity-[0.25]"
          style={{
            backgroundImage: 'radial-gradient(circle at 1px 1px, #cbd5e1 1px, transparent 0)',
            backgroundSize: '32px 32px',
          }}
        />
      )}

      {/* 3. Four Ambient Animated Mesh Blobs (GPU-accelerated CSS translate3d/scale) */}
      <div className="absolute inset-0 overflow-hidden">
        {/* Blob 1: Top/Center - Sapphire Blue (#2563eb) & Indigo (#4f46e5) */}
        <div
          className="absolute -top-16 left-1/2 -translate-x-1/2 w-[720px] sm:w-[980px] h-[520px] sm:h-[680px] rounded-full blur-[100px] sm:blur-[130px] animate-mesh-blob-1"
          style={{
            background:
              'radial-gradient(ellipse at center, rgba(37, 99, 235, 0.20) 0%, rgba(79, 70, 229, 0.12) 48%, transparent 72%)',
          }}
        />

        {/* Blob 2: Top-Right - Cyan (#06b6d4) & Light Blue (#3b82f6) */}
        <div
          className="absolute -top-24 -right-16 sm:right-[5%] w-[520px] sm:w-[740px] h-[520px] sm:h-[740px] rounded-full blur-[90px] sm:blur-[120px] animate-mesh-blob-2"
          style={{
            background:
              'radial-gradient(circle, rgba(6, 182, 212, 0.16) 0%, rgba(59, 130, 246, 0.08) 50%, transparent 70%)',
          }}
        />

        {/* Blob 3: Bottom-Left - Muted Emerald (#059669) & Teal */}
        <div
          className="absolute -bottom-28 -left-20 sm:left-[2%] w-[580px] sm:w-[820px] h-[420px] sm:h-[620px] rounded-full blur-[100px] sm:blur-[130px] animate-mesh-blob-3"
          style={{
            background:
              'radial-gradient(ellipse at bottom left, rgba(5, 150, 105, 0.15) 0%, rgba(16, 185, 129, 0.08) 45%, transparent 70%)',
          }}
        />

        {/* Blob 4: Bottom-Right Edge - Dark Muted Slate/Black (#0f172a / #090d16) */}
        <div
          className="absolute -bottom-24 right-0 sm:right-[8%] w-[540px] sm:w-[780px] h-[440px] sm:h-[620px] rounded-full blur-[90px] sm:blur-[120px] animate-mesh-blob-4"
          style={{
            background:
              'radial-gradient(ellipse at bottom right, rgba(15, 23, 42, 0.14) 0%, rgba(9, 13, 22, 0.08) 50%, transparent 72%)',
          }}
        />
      </div>

      {/* 4. Film Grain / Noise Texture Overlay (Tiled SVG turbulence rasterized once) */}
      {showGrain && (
        <div
          data-testid="mesh-grain"
          className="absolute inset-0 pointer-events-none mix-blend-overlay"
          style={{
            backgroundImage: NOISE_SVG_DATA_URI,
            backgroundRepeat: 'repeat',
            opacity: grainOpacity,
          }}
        />
      )}

      {/* 5. WCAG Text Contrast Scrim (Soft center radial light protecting dark typography) */}
      {showScrim && (
        <div
          data-testid="mesh-scrim"
          className="absolute inset-0 pointer-events-none"
          style={{
            background:
              'radial-gradient(ellipse 65% 55% at 50% 40%, rgba(255, 255, 255, 0.40) 0%, rgba(255, 255, 255, 0.12) 55%, transparent 100%)',
          }}
        />
      )}

      {children}
    </div>
  );
}
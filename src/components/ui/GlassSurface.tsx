'use client';

import React from 'react';

export interface GlassSurfaceProps extends React.HTMLAttributes<HTMLDivElement> {
  children: React.ReactNode;
  intensity?: 'subtle' | 'medium' | 'strong';
  variant?: 'surface' | 'card' | 'panel' | 'navbar';
  hoverEffect?: boolean;
  className?: string;
  as?: 'div' | 'section' | 'article' | 'nav' | 'header' | 'aside';
}

export function GlassSurface({
  children,
  intensity = 'medium',
  variant = 'surface',
  hoverEffect = false,
  className = '',
  as: Component = 'div',
  ...props
}: GlassSurfaceProps) {
  const intensityStyles = {
    subtle: 'liquid-glass-subtle',
    medium: 'liquid-glass',
    strong: 'liquid-glass-strong',
  };

  const variantStyles = {
    surface: 'rounded-2xl',
    card: 'liquid-glass-card',
    panel: 'rounded-3xl p-6 sm:p-8',
    navbar: 'liquid-glass-navbar rounded-2xl',
  };

  const hoverStyle = hoverEffect && variant !== 'card'
    ? 'hover:border-slate-300 hover:shadow-md hover:-translate-y-0.5 active:translate-y-0 transition-all duration-300'
    : '';

  return (
    <Component
      className={`${intensityStyles[intensity]} ${variantStyles[variant]} ${hoverStyle} ${className}`}
      {...props}
    >
      {children}
    </Component>
  );
}

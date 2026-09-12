'use client';

import React, { useEffect, useRef, useState } from 'react';

export type RevealVariant = 'fade-up' | 'fade-down' | 'fade-in' | 'slide-left' | 'slide-right' | 'scale-up';

interface RevealOnScrollProps {
  children: React.ReactNode;
  variant?: RevealVariant;
  delayMs?: number;
  durationMs?: number;
  className?: string;
  threshold?: number;
}

export function RevealOnScroll({
  children,
  variant = 'fade-up',
  delayMs = 0,
  durationMs = 850,
  className = '',
  threshold = 0.1,
}: RevealOnScrollProps) {
  const [isVisible, setIsVisible] = useState(() => {
    if (typeof window === 'undefined') return true;
    if (typeof IntersectionObserver === 'undefined') return true;
    if (typeof window.matchMedia === 'function' && window.matchMedia('(prefers-reduced-motion: reduce)').matches) {
      return true;
    }
    return false;
  });
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (isVisible) return;

    const currentRef = ref.current;
    if (!currentRef) return;

    try {
      const observer = new IntersectionObserver(
        ([entry]) => {
          if (entry && entry.isIntersecting) {
            setIsVisible(true);
            observer.unobserve(entry.target);
          }
        },
        {
          threshold,
          rootMargin: '0px 0px -30px 0px',
        }
      );

      observer.observe(currentRef);

      return () => {
        if (currentRef) observer.unobserve(currentRef);
      };
    } catch {
      const rafId = requestAnimationFrame(() => setIsVisible(true));
      return () => cancelAnimationFrame(rafId);
    }
  }, [threshold, isVisible]);

  const variantStyles: Record<string, { initial: string; visible: string }> = {
    'fade-up': {
      initial: 'opacity-0 translate-y-8',
      visible: 'opacity-100 translate-y-0',
    },
    'fade-down': {
      initial: 'opacity-0 -translate-y-8',
      visible: 'opacity-100 translate-y-0',
    },
    'fade-in': {
      initial: 'opacity-0',
      visible: 'opacity-100',
    },
    'slide-left': {
      initial: 'opacity-0 -translate-x-10',
      visible: 'opacity-100 translate-x-0',
    },
    'slide-right': {
      initial: 'opacity-0 translate-x-10',
      visible: 'opacity-100 translate-x-0',
    },
    'scale-up': {
      initial: 'opacity-0 scale-[0.96]',
      visible: 'opacity-100 scale-100',
    },
  };

  const selected = variantStyles[variant] || variantStyles['fade-up'];

  return (
    <div
      ref={ref}
      style={{
        transitionDuration: `${durationMs}ms`,
        transitionDelay: `${delayMs}ms`,
        transitionTimingFunction: 'cubic-bezier(0.22, 1, 0.36, 1)',
      }}
      className={`transition-all will-change-[opacity,transform] ${
        isVisible ? selected.visible : selected.initial
      } ${className}`}
    >
      {children}
    </div>
  );
}

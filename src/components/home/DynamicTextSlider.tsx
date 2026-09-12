'use client';

import React, { useState, useEffect, useRef } from 'react';

interface DynamicTextSliderProps {
  phrases?: string[];
  intervalMs?: number;
  className?: string;
}

type AnimationPhase = 'visible' | 'exiting' | 'entering';

export function DynamicTextSlider({
  phrases = [
    'answers patient phone calls 24/7',
    'schedules bookings on WhatsApp',
    'transfers emergency medical calls',
    'prevents calendar double-bookings',
    'sends automated 24h/2h reminders',
    'grows monthly clinic revenue',
  ],
  intervalMs = 3200,
  className = '',
}: DynamicTextSliderProps) {
  const [index, setIndex] = useState(0);
  const [phase, setPhase] = useState<AnimationPhase>('visible');
  const [reducedMotion, setReducedMotion] = useState(() => {
    if (typeof window !== 'undefined' && window.matchMedia) {
      return window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    }
    return false;
  });

  const mountedRef = useRef(true);
  const timeoutsRef = useRef<NodeJS.Timeout[]>([]);

  useEffect(() => {
    mountedRef.current = true;
    if (typeof window === 'undefined' || !window.matchMedia) return;

    const mediaQuery = window.matchMedia('(prefers-reduced-motion: reduce)');
    const handler = (e: MediaQueryListEvent) => setReducedMotion(e.matches);
    mediaQuery.addEventListener('change', handler);

    return () => {
      mountedRef.current = false;
      timeoutsRef.current.forEach(clearTimeout);
      mediaQuery.removeEventListener('change', handler);
    };
  }, []);

  useEffect(() => {
    if (phrases.length <= 1) return;

    const clearAllTimeouts = () => {
      timeoutsRef.current.forEach(clearTimeout);
      timeoutsRef.current = [];
    };

    const interval = setInterval(() => {
      if (!mountedRef.current) return;

      if (reducedMotion) {
        setIndex((prev) => (prev + 1) % phrases.length);
        return;
      }

      // Phase 1: Exiting (slide up & fade out)
      setPhase('exiting');

      const exitTimeout = setTimeout(() => {
        if (!mountedRef.current) return;

        // Phase 2: Switch index & prepare entering position (from below)
        setIndex((prev) => (prev + 1) % phrases.length);
        setPhase('entering');

        // Allow microtask tick for DOM to register entering state before animating to visible
        const enterTimeout = setTimeout(() => {
          if (!mountedRef.current) return;
          setPhase('visible');
        }, 40);

        timeoutsRef.current.push(enterTimeout);
      }, 320); // 320ms exit duration

      timeoutsRef.current.push(exitTimeout);
    }, intervalMs);

    return () => {
      clearInterval(interval);
      clearAllTimeouts();
    };
  }, [phrases.length, intervalMs, reducedMotion]);

  // Determine transition styles based on active phase
  const getPhaseStyles = () => {
    if (reducedMotion) {
      return 'opacity-100 translate-y-0';
    }

    switch (phase) {
      case 'exiting':
        return 'opacity-0 -translate-y-2 transition-all duration-300 ease-in';
      case 'entering':
        return 'opacity-0 translate-y-2 transition-none';
      case 'visible':
      default:
        return 'opacity-100 translate-y-0 transition-all duration-400 ease-out';
    }
  };

  return (
    <span
      className={`inline align-baseline relative ${className}`}
      aria-live="polite"
      aria-atomic="true"
    >
      <span
        style={{
          transitionTimingFunction: 'cubic-bezier(0.22, 1, 0.36, 1)',
        }}
        className={`inline font-black bg-gradient-to-r from-blue-600 via-indigo-600 to-blue-700 bg-clip-text text-transparent [box-decoration-break:clone] [-webkit-box-decoration-break:clone] px-1 py-0.5 transform will-change-[transform,opacity] ${getPhaseStyles()}`}
      >
        {phrases[index]}
      </span>
    </span>
  );
}

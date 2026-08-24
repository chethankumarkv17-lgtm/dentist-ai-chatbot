'use client';

import React, { useState, useEffect } from 'react';

interface DynamicTextSliderProps {
  phrases?: string[];
  intervalMs?: number;
  className?: string;
}

export function DynamicTextSlider({
  phrases = [
    'answers patient phone calls 24/7',
    'schedules bookings on WhatsApp',
    'prevents calendar double-bookings',
    'sends automated 24h/2h reminders',
    'transfers emergency medical calls',
    'grows monthly clinic revenue',
  ],
  intervalMs = 2800,
  className = '',
}: DynamicTextSliderProps) {
  const [index, setIndex] = useState(0);
  const [isAnimating, setIsAnimating] = useState(false);

  useEffect(() => {
    const interval = setInterval(() => {
      setIsAnimating(true);
      setTimeout(() => {
        setIndex((prev) => (prev + 1) % phrases.length);
        setIsAnimating(false);
      }, 350);
    }, intervalMs);

    return () => clearInterval(interval);
  }, [phrases.length, intervalMs]);

  return (
    <div className={`inline-flex items-center justify-center overflow-hidden h-[1.35em] align-middle ${className}`}>
      <span
        style={{
          transitionDuration: '400ms',
          transitionTimingFunction: 'cubic-bezier(0.22, 1, 0.36, 1)',
        }}
        className={`inline-block font-extrabold bg-gradient-to-r from-blue-600 via-indigo-600 to-blue-700 bg-clip-text text-transparent transition-all transform will-change-[transform,opacity] ${
          isAnimating ? 'opacity-0 translate-y-4 scale-95' : 'opacity-100 translate-y-0 scale-100'
        }`}
      >
        {phrases[index]}
      </span>
    </div>
  );
}

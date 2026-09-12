'use client';

import React, { useState, useEffect, useRef, useCallback } from 'react';

const DEFAULT_CHARS = '!@#$%^&*()_+-=[]{}|;:,.<>/?0123456789ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz';

export interface UseTextScrambleOptions {
  /** Total animation duration in ms (default: 450ms, recommended: 400-600ms) */
  durationMs?: number;
  /** Milliseconds between glyph scrambles (default: 35ms for optimal perceptual cadence) */
  stepIntervalMs?: number;
  /** Custom character glyph pool */
  characterPool?: string;
  /** Action on mouse leave: 'finish' lets decode resolve smoothly; 'snap' resets immediately */
  onLeaveBehavior?: 'finish' | 'snap';
}

export function useTextScramble(
  text: string,
  options: UseTextScrambleOptions = {}
) {
  const {
    durationMs = 450,
    stepIntervalMs = 35,
    characterPool = DEFAULT_CHARS,
    onLeaveBehavior = 'finish',
  } = options;

  const [displayText, setDisplayText] = useState(text);
  const [prevText, setPrevText] = useState(text);
  const [isScrambling, setIsScrambling] = useState(false);
  const [reducedMotion, setReducedMotion] = useState(() => {
    if (typeof window !== 'undefined' && window.matchMedia) {
      return window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    }
    return false;
  });

  if (text !== prevText) {
    setPrevText(text);
    setDisplayText(text);
  }

  const timerRef = useRef<NodeJS.Timeout | null>(null);
  const startTimeRef = useRef<number>(0);

  // Check for prefers-reduced-motion
  useEffect(() => {
    if (typeof window === 'undefined' || !window.matchMedia) return;
    const mediaQuery = window.matchMedia('(prefers-reduced-motion: reduce)');

    const handleChange = (e: MediaQueryListEvent) => {
      setReducedMotion(e.matches);
    };

    if (mediaQuery.addEventListener) {
      mediaQuery.addEventListener('change', handleChange);
      return () => mediaQuery.removeEventListener('change', handleChange);
    }
  }, []);

  // Clean up timer on unmount
  useEffect(() => {
    return () => {
      if (timerRef.current) {
        clearInterval(timerRef.current);
      }
    };
  }, []);

  const clearTimer = useCallback(() => {
    if (timerRef.current) {
      clearInterval(timerRef.current);
      timerRef.current = null;
    }
  }, []);

  const trigger = useCallback(() => {
    if (reducedMotion || !text) {
      setDisplayText(text);
      return;
    }

    clearTimer();
    setIsScrambling(true);
    startTimeRef.current = Date.now();

    timerRef.current = setInterval(() => {
      const elapsed = Date.now() - startTimeRef.current;
      const progress = Math.min(elapsed / durationMs, 1);
      // Progressively lock characters from left to right
      const lockedCount = Math.floor(progress * (text.length + 1));

      let output = '';
      for (let i = 0; i < text.length; i++) {
        const char = text[i];
        if (char === ' ') {
          // Strictly preserve spacing and layout
          output += ' ';
        } else if (i < lockedCount) {
          output += char;
        } else {
          output += characterPool[Math.floor(Math.random() * characterPool.length)];
        }
      }

      setDisplayText(output);

      if (progress >= 1) {
        clearTimer();
        setIsScrambling(false);
        setDisplayText(text);
      }
    }, stepIntervalMs);
  }, [text, durationMs, stepIntervalMs, characterPool, reducedMotion, clearTimer]);

  const handleLeave = useCallback(() => {
    if (onLeaveBehavior === 'snap') {
      clearTimer();
      setIsScrambling(false);
      setDisplayText(text);
    }
    // If 'finish', allow the ongoing progressive resolution to complete naturally
  }, [onLeaveBehavior, clearTimer, text]);

  return {
    displayText,
    isScrambling,
    trigger,
    handleLeave,
    hoverProps: {
      onMouseEnter: trigger,
      onMouseLeave: handleLeave,
      onFocus: trigger,
      onBlur: handleLeave,
    },
  };
}

export interface ScrambleTextProps extends React.HTMLAttributes<HTMLSpanElement> {
  text: string;
  durationMs?: number;
  triggerOnHover?: boolean;
  onLeaveBehavior?: 'finish' | 'snap';
}

export function ScrambleText({
  text,
  durationMs = 450,
  triggerOnHover = true,
  onLeaveBehavior = 'finish',
  className = '',
  ...props
}: ScrambleTextProps) {
  const { displayText, hoverProps } = useTextScramble(text, {
    durationMs,
    onLeaveBehavior,
  });

  const eventProps = triggerOnHover ? hoverProps : {};

  return (
    <span
      {...eventProps}
      {...props}
      className={`inline-block tabular-nums font-inherit ${className}`}
      aria-label={text}
    >
      <span aria-hidden="true">{displayText}</span>
      <span className="sr-only">{text}</span>
    </span>
  );
}
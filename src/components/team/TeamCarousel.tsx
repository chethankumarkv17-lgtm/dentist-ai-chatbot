'use client';

import React, { useState, useEffect, useRef, useCallback } from 'react';
import { ChevronLeft, ChevronRight } from 'lucide-react';
import { teamMembers, TeamMember } from '@/data/teamMembers';
import { TeamCard } from '@/components/team/TeamCard';

interface TeamCarouselProps {
  onSelectMember: (member: TeamMember) => void;
}

export function TeamCarousel({ onSelectMember }: TeamCarouselProps) {
  const [activeIndex, setActiveIndex] = useState(0);
  const [isPaused, setIsPaused] = useState(false);
  const [reducedMotion] = useState(() => {
    if (typeof window !== 'undefined' && window.matchMedia) {
      return window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    }
    return false;
  });
  const [hasEnteredView, setHasEnteredView] = useState(() => {
    if (typeof window !== 'undefined' && window.matchMedia) {
      return window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    }
    return false;
  });
  const containerRef = useRef<HTMLDivElement>(null);

  const trackRef = useRef<HTMLDivElement>(null);
  const offsetRef = useRef(0);
  const isAnimatingTransitionRef = useRef(false);
  const resumeTimerRef = useRef<NodeJS.Timeout | null>(null);

  const touchStartX = useRef<number | null>(null);
  const touchStartOffset = useRef<number>(0);

  // 4 identical sets (24 cards total) for infinite continuous translation
  const trackItems = [...teamMembers, ...teamMembers, ...teamMembers, ...teamMembers];

  const getStep = useCallback(() => {
    if (typeof window === 'undefined') return 344;
    return window.innerWidth < 640 ? 300 : 344; // 280+20 or 320+24
  }, []);

  // Initialize offset to -singleSetWidth (Start of Set 2)
  useEffect(() => {
    const step = getStep();
    const singleSetWidth = step * teamMembers.length;
    offsetRef.current = -singleSetWidth;

    if (trackRef.current) {
      trackRef.current.style.transform = `translate3d(${-singleSetWidth}px, 0, 0)`;
    }
  }, [getStep]);

  // Staggered entrance: observe when carousel scrolls into view (once)
  useEffect(() => {
    if (hasEnteredView) return;

    const el = containerRef.current;
    if (!el || typeof IntersectionObserver === 'undefined') {
      const rafId = requestAnimationFrame(() => setHasEnteredView(true));
      return () => cancelAnimationFrame(rafId);
    }
    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry?.isIntersecting) {
          setHasEnteredView(true);
          observer.disconnect();
        }
      },
      { threshold: 0.1, rootMargin: '0px 0px -30px 0px' }
    );
    observer.observe(el);
    return () => observer.disconnect();
  }, [hasEnteredView]);

  // Window resize handler to maintain alignment
  useEffect(() => {
    const handleResize = () => {
      const step = getStep();
      const singleSetWidth = step * teamMembers.length;
      offsetRef.current = -singleSetWidth - activeIndex * step;
      if (trackRef.current) {
        trackRef.current.style.transition = 'none';
        trackRef.current.style.transform = `translate3d(${offsetRef.current}px, 0, 0)`;
      }
    };

    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, [activeIndex, getStep]);

  // Continuous auto-scroll loop (60fps requestAnimationFrame)
  useEffect(() => {
    if (isPaused || reducedMotion) return;

    let animId: number;
    let lastTime = performance.now();

    const loop = (currentTime: number) => {
      const delta = currentTime - lastTime;
      lastTime = currentTime;

      if (!isAnimatingTransitionRef.current && trackRef.current) {
        const step = getStep();
        const singleSetWidth = step * teamMembers.length;

        // Fluid continuous fast speed: 95px per second (swift and smooth glide)
        offsetRef.current -= (95 * delta) / 1000;

        // Invisible wrap when Set 2 completes into Set 3
        if (offsetRef.current <= -2 * singleSetWidth) {
          offsetRef.current += singleSetWidth;
        } else if (offsetRef.current >= 0) {
          offsetRef.current -= singleSetWidth;
        }

        trackRef.current.style.transform = `translate3d(${offsetRef.current}px, 0, 0)`;

        // Update active dot
        const rel = -offsetRef.current - singleSetWidth;
        const currentIdx = Math.round(rel / step);
        const normalized = ((currentIdx % teamMembers.length) + teamMembers.length) % teamMembers.length;
        setActiveIndex(normalized);
      }

      animId = requestAnimationFrame(loop);
    };

    animId = requestAnimationFrame(loop);
    return () => cancelAnimationFrame(animId);
  }, [isPaused, reducedMotion, getStep]);

  // Helper to start resume timer
  const scheduleResume = useCallback(() => {
    if (resumeTimerRef.current) clearTimeout(resumeTimerRef.current);
    resumeTimerRef.current = setTimeout(() => {
      isAnimatingTransitionRef.current = false;
      setIsPaused(false);
    }, 2200);
  }, []);

  // Smoothly slide to a specific target offset with transition
  const slideToOffset = useCallback((targetOffset: number, newActiveIdx?: number) => {
    if (!trackRef.current) return;

    setIsPaused(true);
    isAnimatingTransitionRef.current = true;

    const step = getStep();
    const singleSetWidth = step * teamMembers.length;

    trackRef.current.style.transition = 'transform 350ms cubic-bezier(0.22, 1, 0.36, 1)';
    trackRef.current.style.transform = `translate3d(${targetOffset}px, 0, 0)`;
    offsetRef.current = targetOffset;

    if (typeof newActiveIdx === 'number') {
      setActiveIndex(((newActiveIdx % teamMembers.length) + teamMembers.length) % teamMembers.length);
    } else {
      const rel = -targetOffset - singleSetWidth;
      const currentIdx = Math.round(rel / step);
      const normalized = ((currentIdx % teamMembers.length) + teamMembers.length) % teamMembers.length;
      setActiveIndex(normalized);
    }

    setTimeout(() => {
      if (trackRef.current) {
        trackRef.current.style.transition = 'none';

        // Normalize offset into [-2 * singleSetWidth, -singleSetWidth]
        while (offsetRef.current < -2 * singleSetWidth) {
          offsetRef.current += singleSetWidth;
        }
        while (offsetRef.current > -singleSetWidth) {
          offsetRef.current -= singleSetWidth;
        }
        trackRef.current.style.transform = `translate3d(${offsetRef.current}px, 0, 0)`;
      }
      isAnimatingTransitionRef.current = false;
      scheduleResume();
    }, 370);
  }, [getStep, scheduleResume]);

  // Back / Previous Button Handler (Always shifts backwards by 1 card)
  const handlePrev = useCallback(() => {
    const step = getStep();
    const target = Math.round(offsetRef.current / step) * step + step;
    slideToOffset(target);
  }, [getStep, slideToOffset]);

  // Next Button Handler (Always shifts forward by 1 card)
  const handleNext = useCallback(() => {
    const step = getStep();
    const target = Math.round(offsetRef.current / step) * step - step;
    slideToOffset(target);
  }, [getStep, slideToOffset]);

  // Go to dot index
  const handleGoTo = useCallback((idx: number) => {
    const step = getStep();
    const singleSetWidth = step * teamMembers.length;
    const target = -singleSetWidth - idx * step;
    slideToOffset(target, idx);
  }, [getStep, slideToOffset]);

  // Mobile Touch Swipe Handling
  const handleTouchStart = (e: React.TouchEvent) => {
    touchStartX.current = e.touches[0].clientX;
    touchStartOffset.current = offsetRef.current;
    setIsPaused(true);
    isAnimatingTransitionRef.current = true;
    if (trackRef.current) {
      trackRef.current.style.transition = 'none';
    }
  };

  const handleTouchMove = (e: React.TouchEvent) => {
    if (touchStartX.current === null || !trackRef.current) return;
    const currentX = e.touches[0].clientX;
    const diff = currentX - touchStartX.current;
    offsetRef.current = touchStartOffset.current + diff;
    trackRef.current.style.transform = `translate3d(${offsetRef.current}px, 0, 0)`;
  };

  const handleTouchEnd = (e: React.TouchEvent) => {
    if (touchStartX.current === null) return;
    const endTouch = e.changedTouches?.[0] || e.touches?.[0];
    const endX = endTouch ? endTouch.clientX : touchStartX.current;
    const diff = endX - touchStartX.current;
    const step = getStep();

    touchStartX.current = null;

    if (diff > 45) {
      // Swiped Right -> Go Back
      handlePrev();
    } else if (diff < -45) {
      // Swiped Left -> Go Next
      handleNext();
    } else {
      // Snap to nearest
      const nearest = Math.round(offsetRef.current / step) * step;
      slideToOffset(nearest);
    }
  };

  return (
    <div
      ref={containerRef}
      className="relative w-full overflow-hidden select-none py-4 team-track-container"
      onMouseEnter={() => {
        if (resumeTimerRef.current) clearTimeout(resumeTimerRef.current);
        setIsPaused(true);
        isAnimatingTransitionRef.current = true;
      }}
      onMouseLeave={() => {
        if (resumeTimerRef.current) clearTimeout(resumeTimerRef.current);
        isAnimatingTransitionRef.current = false;
        setIsPaused(false);
      }}
      onTouchStart={handleTouchStart}
      onTouchMove={handleTouchMove}
      onTouchEnd={handleTouchEnd}
      aria-label="Team members carousel"
    >
      {/* Edge Fade Masks for Smooth In/Out Transition */}
      <div className="hidden sm:block absolute left-0 top-0 bottom-16 w-12 lg:w-20 bg-gradient-to-r from-white to-transparent z-10 pointer-events-none" />
      <div className="hidden sm:block absolute right-0 top-0 bottom-16 w-12 lg:w-20 bg-gradient-to-l from-white to-transparent z-10 pointer-events-none" />

      {/* 1. Hardware-Accelerated Continuous Transform Track */}
      <div className="w-full overflow-hidden px-2 sm:px-4">
        <div
          ref={trackRef}
          className="flex gap-5 sm:gap-6 pr-5 sm:pr-6 py-4 w-max shrink-0 will-change-transform"
        >
          {trackItems.map((member, idx) => {
            // Stagger delay based on position within a set (0-5), 100ms apart
            const setPosition = idx % teamMembers.length;
            const staggerDelay = setPosition * 100;

            return (
              <div
                key={`track-card-${member.id}-${idx}`}
                className={`w-[280px] sm:w-[320px] lg:w-[310px] xl:w-[330px] shrink-0 transition-all duration-700 ${
                  hasEnteredView
                    ? 'opacity-100 translate-y-0'
                    : 'opacity-0 translate-y-5'
                }`}
                style={{
                  transitionDelay: hasEnteredView ? `${staggerDelay}ms` : '0ms',
                  transitionTimingFunction: 'cubic-bezier(0.22, 1, 0.36, 1)',
                }}
              >
                <TeamCard
                  member={member}
                  onSelect={onSelectMember}
                  className="h-full"
                />
              </div>
            );
          })}
        </div>
      </div>

      {/* 2. Manual Carousel Navigation Buttons (Back / Next) */}
      <div className="flex items-center justify-between pointer-events-none absolute inset-y-0 left-0 right-0 px-2 sm:px-4 z-20">
        <button
          type="button"
          onClick={handlePrev}
          aria-label="Previous team member"
          title="Previous team member (Back)"
          className="pointer-events-auto p-2.5 sm:p-3 rounded-full bg-white/95 hover:bg-white text-slate-800 border border-slate-200/90 hover:border-blue-600 hover:text-blue-600 shadow-md hover:shadow-lg transition-all duration-200 -translate-x-1 sm:translate-x-0 cursor-pointer touch-target flex items-center justify-center group"
        >
          <ChevronLeft className="w-5 h-5 group-hover:-translate-x-0.5 transition-transform" />
        </button>

        <button
          type="button"
          onClick={handleNext}
          aria-label="Next team member"
          title="Next team member"
          className="pointer-events-auto p-2.5 sm:p-3 rounded-full bg-white/95 hover:bg-white text-slate-800 border border-slate-200/90 hover:border-blue-600 hover:text-blue-600 shadow-md hover:shadow-lg transition-all duration-200 translate-x-1 sm:translate-x-0 cursor-pointer touch-target flex items-center justify-center group"
        >
          <ChevronRight className="w-5 h-5 group-hover:translate-x-0.5 transition-transform" />
        </button>
      </div>

      {/* 3. Minimal Segmented Pagination Bars */}
      <div
        className="mt-8 flex items-center justify-center gap-2"
        role="tablist"
        aria-label="Carousel pagination"
      >
        {teamMembers.map((member, idx) => {
          const isActive = activeIndex === idx;
          return (
            <button
              key={`dot-${member.id}`}
              type="button"
              role="tab"
              aria-selected={isActive}
              aria-label={`Go to slide ${idx + 1}: ${member.name}`}
              onClick={() => handleGoTo(idx)}
              className="group py-2 px-1 cursor-pointer focus:outline-none"
            >
              <span
                className={`block h-1 rounded-full transition-all duration-300 ${
                  isActive
                    ? 'w-10 sm:w-12 bg-blue-600 shadow-xs'
                    : 'w-6 sm:w-8 bg-slate-200 group-hover:bg-slate-300'
                }`}
              />
            </button>
          );
        })}
      </div>
    </div>
  );
}


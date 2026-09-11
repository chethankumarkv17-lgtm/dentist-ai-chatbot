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
  const [reducedMotion, setReducedMotion] = useState(false);

  const scrollWrapperRef = useRef<HTMLDivElement>(null);
  const isInteractingRef = useRef(false);
  const resumeTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const touchStartX = useRef<number | null>(null);
  const touchStartY = useRef<number | null>(null);

  // Quadruple items to allow infinite seamless bidirectional scrolling (24 cards)
  const trackItems = [...teamMembers, ...teamMembers, ...teamMembers, ...teamMembers];

  // Helper to get card width + gap dynamically
  const getCardStep = useCallback(() => {
    if (typeof window === 'undefined') return 344;
    return window.innerWidth < 640 ? 300 : 344; // 280px + 20px or 320px + 24px
  }, []);

  // Initialize scroll position to center set (Set 2)
  useEffect(() => {
    if (typeof window !== 'undefined' && window.matchMedia) {
      setReducedMotion(window.matchMedia('(prefers-reduced-motion: reduce)').matches);
    }

    const container = scrollWrapperRef.current;
    if (container) {
      const step = getCardStep();
      const singleSetWidth = step * teamMembers.length;
      container.scrollLeft = singleSetWidth;
    }
  }, [getCardStep]);

  // Wrap boundary check for seamless infinite looping
  const handleScroll = useCallback(() => {
    const container = scrollWrapperRef.current;
    if (!container) return;

    const step = getCardStep();
    const singleSetWidth = step * teamMembers.length;

    if (singleSetWidth <= 0) return;

    // Left boundary wrap
    if (container.scrollLeft < singleSetWidth * 0.4) {
      container.scrollLeft += singleSetWidth;
    }
    // Right boundary wrap
    else if (container.scrollLeft >= singleSetWidth * 2.6) {
      container.scrollLeft -= singleSetWidth;
    }

    // Calculate current visible card index
    const offsetInSet = (container.scrollLeft - singleSetWidth) % singleSetWidth;
    const computedIndex = Math.round(offsetInSet / step);
    const normalized = ((computedIndex % teamMembers.length) + teamMembers.length) % teamMembers.length;
    setActiveIndex(normalized);
  }, [getCardStep]);

  // Continuous auto-scroll animation loop (smooth 60fps)
  useEffect(() => {
    if (isPaused || reducedMotion) return;

    let animationFrameId: number;
    let lastTime = performance.now();

    const animate = (currentTime: number) => {
      const delta = currentTime - lastTime;
      lastTime = currentTime;

      const container = scrollWrapperRef.current;
      if (container && !isInteractingRef.current) {
        // Continuous gentle scroll (approx 35px per second)
        container.scrollLeft += (35 * delta) / 1000;
        handleScroll();
      }

      animationFrameId = requestAnimationFrame(animate);
    };

    animationFrameId = requestAnimationFrame(animate);

    return () => cancelAnimationFrame(animationFrameId);
  }, [isPaused, reducedMotion, handleScroll]);

  const triggerResumeTimer = () => {
    if (resumeTimeoutRef.current) clearTimeout(resumeTimeoutRef.current);
    resumeTimeoutRef.current = setTimeout(() => {
      isInteractingRef.current = false;
      setIsPaused(false);
    }, 2800);
  };

  // Back / Previous Button Handler (Moves backwards by 1 card)
  const handlePrev = () => {
    const container = scrollWrapperRef.current;
    if (!container) return;

    setIsPaused(true);
    isInteractingRef.current = true;
    const step = getCardStep();

    if (typeof container.scrollBy === 'function') {
      container.scrollBy({ left: -step, behavior: 'smooth' });
    } else {
      container.scrollLeft -= step;
    }
    triggerResumeTimer();
  };

  // Next Button Handler (Moves forward by 1 card)
  const handleNext = () => {
    const container = scrollWrapperRef.current;
    if (!container) return;

    setIsPaused(true);
    isInteractingRef.current = true;
    const step = getCardStep();

    if (typeof container.scrollBy === 'function') {
      container.scrollBy({ left: step, behavior: 'smooth' });
    } else {
      container.scrollLeft += step;
    }
    triggerResumeTimer();
  };

  // Pagination Dot Click
  const handleGoTo = (index: number) => {
    const container = scrollWrapperRef.current;
    if (!container) return;

    setIsPaused(true);
    isInteractingRef.current = true;
    const step = getCardStep();
    const singleSetWidth = step * teamMembers.length;

    if (typeof container.scrollTo === 'function') {
      container.scrollTo({
        left: singleSetWidth + index * step,
        behavior: 'smooth',
      });
    } else {
      container.scrollLeft = singleSetWidth + index * step;
    }

    triggerResumeTimer();
  };

  // Mobile Touch Gestures
  const handleTouchStart = (e: React.TouchEvent) => {
    touchStartX.current = e.touches[0].clientX;
    touchStartY.current = e.touches[0].clientY;
    setIsPaused(true);
    isInteractingRef.current = true;
  };

  const handleTouchEnd = () => {
    touchStartX.current = null;
    touchStartY.current = null;
    triggerResumeTimer();
  };

  return (
    <div
      className="relative w-full overflow-hidden select-none py-4 team-track-container"
      onMouseEnter={() => {
        setIsPaused(true);
        isInteractingRef.current = true;
      }}
      onMouseLeave={() => {
        triggerResumeTimer();
      }}
      onTouchStart={handleTouchStart}
      onTouchEnd={handleTouchEnd}
      aria-label="Team members carousel"
    >
      {/* Edge Fade Masks for Smooth In/Out Transition */}
      <div className="hidden sm:block absolute left-0 top-0 bottom-16 w-12 lg:w-20 bg-gradient-to-r from-white to-transparent z-10 pointer-events-none" />
      <div className="hidden sm:block absolute right-0 top-0 bottom-16 w-12 lg:w-20 bg-gradient-to-l from-white to-transparent z-10 pointer-events-none" />

      {/* 1. Seamless Smooth Scrollable Track */}
      <div
        ref={scrollWrapperRef}
        onScroll={handleScroll}
        className="w-full overflow-x-auto overflow-y-visible px-2 sm:px-4 [scrollbar-width:none] [-ms-overflow-style:none] [&::-webkit-scrollbar]:hidden scroll-smooth"
      >
        <div className="flex gap-5 sm:gap-6 pr-5 sm:pr-6 py-4 w-max shrink-0">
          {trackItems.map((member, idx) => (
            <div
              key={`track-card-${member.id}-${idx}`}
              className="w-[280px] sm:w-[320px] lg:w-[310px] xl:w-[330px] shrink-0 transition-transform duration-300"
            >
              <TeamCard
                member={member}
                onSelect={onSelectMember}
                className="h-full"
              />
            </div>
          ))}
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

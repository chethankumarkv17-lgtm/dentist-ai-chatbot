'use client';

import React, { useState, useEffect, useRef } from 'react';
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
  const touchStartX = useRef<number | null>(null);
  const touchStartY = useRef<number | null>(null);

  useEffect(() => {
    if (typeof window !== 'undefined' && window.matchMedia) {
      setReducedMotion(window.matchMedia('(prefers-reduced-motion: reduce)').matches);
    }
  }, []);

  // Update active pagination indicator in sync with the loop
  useEffect(() => {
    if (isPaused || reducedMotion) return;

    const interval = setInterval(() => {
      setActiveIndex((prev) => (prev + 1) % teamMembers.length);
    }, 5500);

    return () => clearInterval(interval);
  }, [isPaused, reducedMotion]);

  const handlePrev = () => {
    setActiveIndex((prev) => (prev - 1 + teamMembers.length) % teamMembers.length);
    if (scrollWrapperRef.current && typeof scrollWrapperRef.current.scrollBy === 'function') {
      scrollWrapperRef.current.scrollBy({ left: -320, behavior: 'smooth' });
    }
  };

  const handleNext = () => {
    setActiveIndex((prev) => (prev + 1) % teamMembers.length);
    if (scrollWrapperRef.current && typeof scrollWrapperRef.current.scrollBy === 'function') {
      scrollWrapperRef.current.scrollBy({ left: 320, behavior: 'smooth' });
    }
  };

  const handleTouchStart = (e: React.TouchEvent) => {
    touchStartX.current = e.touches[0].clientX;
    touchStartY.current = e.touches[0].clientY;
    setIsPaused(true);
  };

  const handleTouchMove = (e: React.TouchEvent) => {
    if (touchStartX.current === null || touchStartY.current === null) return;
    const diffX = touchStartX.current - e.touches[0].clientX;
    const diffY = touchStartY.current - e.touches[0].clientY;

    // Only handle horizontal swipes if horizontal movement exceeds vertical
    if (Math.abs(diffX) > Math.abs(diffY) && Math.abs(diffX) > 35) {
      if (diffX > 0) {
        handleNext();
      } else {
        handlePrev();
      }
      touchStartX.current = null;
      touchStartY.current = null;
    }
  };

  const handleTouchEnd = () => {
    touchStartX.current = null;
    touchStartY.current = null;
    setTimeout(() => setIsPaused(false), 2500);
  };

  return (
    <div
      className="relative w-full overflow-hidden select-none py-4 team-track-container"
      onMouseEnter={() => setIsPaused(true)}
      onMouseLeave={() => setIsPaused(false)}
      onTouchStart={handleTouchStart}
      onTouchMove={handleTouchMove}
      onTouchEnd={handleTouchEnd}
      aria-label="Team members carousel"
    >
      {/* Edge Fade Masks for Smooth In/Out Transition */}
      <div className="hidden sm:block absolute left-0 top-0 bottom-16 w-12 lg:w-20 bg-gradient-to-r from-white to-transparent z-10 pointer-events-none" />
      <div className="hidden sm:block absolute right-0 top-0 bottom-16 w-12 lg:w-20 bg-gradient-to-l from-white to-transparent z-10 pointer-events-none" />

      {/* 1. Twin-Track 100% Seamless Infinite Loop */}
      <div
        ref={scrollWrapperRef}
        className="w-full overflow-x-hidden overflow-y-visible px-2 sm:px-4"
      >
        <div className="flex w-max">
          {/* Primary Track (Set 1) */}
          <div
            className={`flex gap-5 sm:gap-6 pr-5 sm:pr-6 py-4 shrink-0 ${
              reducedMotion ? 'overflow-x-auto scrollbar-none' : 'animate-team-infinite'
            }`}
            style={isPaused ? { animationPlayState: 'paused' } : undefined}
          >
            {teamMembers.map((member) => (
              <div
                key={`primary-${member.id}`}
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

          {/* Secondary Clone Track (Set 2 - Exact duplicate for zero-glitch continuous loop) */}
          <div
            aria-hidden="true"
            className={`flex gap-5 sm:gap-6 pr-5 sm:pr-6 py-4 shrink-0 ${
              reducedMotion ? 'hidden' : 'animate-team-infinite'
            }`}
            style={isPaused ? { animationPlayState: 'paused' } : undefined}
          >
            {teamMembers.map((member) => (
              <div
                key={`clone-${member.id}`}
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
      </div>

      {/* 2. Manual Carousel Navigation Buttons (Left / Right) */}
      <div className="flex items-center justify-between pointer-events-none absolute inset-y-0 left-0 right-0 px-2 sm:px-4 z-20">
        <button
          type="button"
          onClick={handlePrev}
          aria-label="Previous team member"
          className="pointer-events-auto p-2.5 sm:p-3 rounded-full bg-white/95 hover:bg-white text-slate-800 border border-slate-200/90 hover:border-blue-600 hover:text-blue-600 shadow-md hover:shadow-lg transition-all duration-200 -translate-x-1 sm:translate-x-0 cursor-pointer touch-target flex items-center justify-center group"
        >
          <ChevronLeft className="w-5 h-5 group-hover:-translate-x-0.5 transition-transform" />
        </button>

        <button
          type="button"
          onClick={handleNext}
          aria-label="Next team member"
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
              onClick={() => setActiveIndex(idx)}
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

'use client';

import React, { useState } from 'react';
import { teamMembers, TeamMember } from '@/data/teamMembers';
import { TeamCarousel } from '@/components/team/TeamCarousel';
import { TeamModal } from '@/components/team/TeamModal';
import { RevealOnScroll } from '@/components/ui/RevealOnScroll';

export function TeamSection() {
  const [selectedMember, setSelectedMember] = useState<TeamMember | null>(null);

  return (
    <section
      id="team"
      className="scroll-mt-32 sm:scroll-mt-36 bg-white dark:bg-slate-950 text-slate-900 dark:text-slate-100 border-y border-slate-200/80 dark:border-slate-800 pt-16 sm:pt-24 pb-20 sm:pb-28 relative overflow-hidden transition-colors duration-200"
    >
      {/* Subtle Warm Minimal Ambient Glow */}
      <div
        aria-hidden="true"
        className="absolute top-1/3 left-1/2 -translate-x-1/2 w-[800px] h-[350px] bg-blue-50/60 dark:bg-blue-950/20 rounded-full blur-[120px] pointer-events-none -z-10"
      />

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* 1. Asymmetric Editorial Header */}
        <RevealOnScroll variant="fade-up" durationMs={650}>
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 lg:gap-12 items-start pb-10 sm:pb-14 border-b border-slate-200/80 dark:border-slate-800">
            {/* Left: Section Label & Large Display Heading */}
            <div className="lg:col-span-7 space-y-4">
              <div className="flex items-center gap-2.5">
                <span className="font-mono text-xs font-bold px-2.5 py-0.5 rounded-sm bg-blue-50 dark:bg-blue-950/80 text-blue-700 dark:text-blue-300 border border-blue-200/80 dark:border-blue-900/60 uppercase tracking-widest">
                  01 / TEAM
                </span>
                <div className="h-[1.5px] w-10 bg-blue-600" />
              </div>

              <h2 className="text-3xl sm:text-5xl lg:text-[58px] font-black text-slate-900 dark:text-white tracking-[-0.04em] leading-[1.06]">
                <span>Meet the minds behind the project</span>
                <span
                  aria-hidden="true"
                  className="inline-block w-2.5 h-2.5 rounded-full bg-blue-600 ml-1.5 align-baseline shadow-xs"
                />
              </h2>
            </div>

            {/* Right: Technical Subtitle, Vertical Divider & Mission Statement */}
            <div className="lg:col-span-5 lg:border-l lg:border-slate-200/90 dark:lg:border-slate-800 lg:pl-8 space-y-3.5 pt-1 lg:pt-3">
              <div className="flex items-center gap-2">
                <span className="w-2 h-2 rounded-full bg-blue-600 animate-pulse" />
                <span className="font-mono text-xs uppercase tracking-widest text-slate-900 dark:text-white font-bold">
                  TECH TITAN
                </span>
                <span className="text-slate-300 dark:text-slate-700">•</span>
                <span className="text-[11px] font-mono uppercase text-slate-500 dark:text-slate-400 tracking-wider">
                  Core Engineering
                </span>
              </div>

              <p className="text-slate-600 dark:text-slate-400 text-sm sm:text-base leading-relaxed font-normal">
                A multidisciplinary team building practical technology solutions with a focus on innovation, usability and real-world impact.
              </p>
            </div>
          </div>
        </RevealOnScroll>

        {/* 2. Continuous Horizontal Carousel */}
        <div className="pt-8 sm:pt-12">
          <RevealOnScroll variant="fade-up" delayMs={150} durationMs={700}>
            <TeamCarousel onSelectMember={(m) => setSelectedMember(m)} />
          </RevealOnScroll>
        </div>

        {/* 3. Section Footer Technical Metadata */}
        <RevealOnScroll variant="fade-up" delayMs={300} durationMs={600}>
          <div className="mt-12 sm:mt-16 pt-6 border-t border-slate-100 flex flex-col sm:flex-row items-center justify-between gap-3 text-xs font-mono text-slate-400">
            <div className="flex items-center gap-2">
              <span className="w-1.5 h-1.5 rounded-full bg-blue-600" />
              <span>RADIANT NOBEL CLINICAL AI LABS</span>
            </div>
            <span>ALL RIGHTS RESERVED • {teamMembers.length} CORE MEMBERS</span>
          </div>
        </RevealOnScroll>
      </div>

      {/* Expanded Profile Modal */}
      <TeamModal
        member={selectedMember}
        onClose={() => setSelectedMember(null)}
      />
    </section>
  );
}

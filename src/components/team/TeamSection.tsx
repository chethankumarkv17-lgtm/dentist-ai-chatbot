'use client';

import React, { useState } from 'react';
import { teamMembers, TeamMember } from '@/data/teamMembers';
import { TeamCard } from '@/components/team/TeamCard';
import { TeamModal } from '@/components/team/TeamModal';
import { RevealOnScroll } from '@/components/ui/RevealOnScroll';

export function TeamSection() {
  const [selectedMember, setSelectedMember] = useState<TeamMember | null>(null);

  return (
    <section
      id="team"
      className="scroll-mt-24 sm:scroll-mt-28 bg-[#050505] text-white border-y border-white/10 py-20 sm:py-28 relative overflow-hidden"
    >
      {/* Subtle Technical Ambient Glow in deep dark background */}
      <div
        aria-hidden="true"
        className="absolute top-1/4 left-1/2 -translate-x-1/2 w-[700px] h-[350px] bg-[#B7FF4A]/5 rounded-full blur-[140px] pointer-events-none -z-10"
      />

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* 1. Editorial Header */}
        <RevealOnScroll variant="fade-up" durationMs={650}>
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start pb-8 border-b border-white/10">
            {/* Left: Small green index label */}
            <div className="lg:col-span-3 space-y-2">
              <span className="font-mono text-xs font-bold text-[#B7FF4A] tracking-widest uppercase inline-block">
                01 / TEAM
              </span>
              <div className="h-[1px] w-12 bg-[#B7FF4A]/60" />
            </div>

            {/* Right: Large Editorial Heading, Subtitle & Mission */}
            <div className="lg:col-span-9 space-y-4">
              <h2 className="text-3xl sm:text-5xl lg:text-[56px] font-black text-white tracking-[-0.035em] leading-[1.08]">
                Meet the minds behind the project.
              </h2>

              <div className="flex flex-col sm:flex-row sm:items-center gap-2 sm:gap-4 pt-1">
                <span className="font-mono text-xs uppercase tracking-widest text-[#B7FF4A] font-bold">
                  TECH TITAN
                </span>
                <span className="hidden sm:inline-block text-neutral-600">•</span>
                <span className="text-xs font-mono uppercase text-neutral-400 tracking-wider">
                  Engineering &amp; AI Research
                </span>
              </div>

              <p className="text-neutral-400 text-sm sm:text-base max-w-2xl leading-relaxed font-normal pt-1">
                A multidisciplinary team building practical technology solutions with a focus on innovation, usability and real-world impact.
              </p>
            </div>
          </div>
        </RevealOnScroll>

        {/* 2. Responsive Team Member Grid */}
        <div className="pt-12 sm:pt-16 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 sm:gap-8">
          {teamMembers.map((member, idx) => (
            <RevealOnScroll
              key={member.id}
              variant="fade-up"
              delayMs={idx * 90}
              durationMs={600}
            >
              <TeamCard
                member={member}
                onSelect={(m) => setSelectedMember(m)}
              />
            </RevealOnScroll>
          ))}
        </div>

        {/* 3. Section Footer Technical Metadata */}
        <RevealOnScroll variant="fade-up" delayMs={350} durationMs={600}>
          <div className="mt-14 sm:mt-20 pt-6 border-t border-white/10 flex flex-col sm:flex-row items-center justify-between gap-4 text-xs font-mono text-neutral-500">
            <div className="flex items-center gap-2">
              <span className="w-2 h-2 rounded-full bg-[#B7FF4A] animate-pulse" />
              <span>RADIANT NOBEL CORE TEAM</span>
            </div>
            <span>ALL RIGHTS RESERVED • {teamMembers.length} MEMBERS</span>
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

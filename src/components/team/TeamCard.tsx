'use client';

import React, { useState } from 'react';
import Image from 'next/image';
import { ArrowUpRight, User } from 'lucide-react';
import { TeamMember } from '@/data/teamMembers';

interface TeamCardProps {
  member: TeamMember;
  onSelect: (member: TeamMember) => void;
}

export function TeamCard({ member, onSelect }: TeamCardProps) {
  const [imageError, setImageError] = useState(false);

  const initials = member.name
    .split(' ')
    .filter(Boolean)
    .map((n) => n[0])
    .slice(0, 2)
    .join('')
    .toUpperCase();

  return (
    <article
      onClick={() => onSelect(member)}
      className="group relative flex flex-col justify-between bg-[#080808] border border-white/15 hover:border-[#B7FF4A]/70 rounded-xs overflow-hidden transition-all duration-300 hover:-translate-y-1.5 cursor-pointer select-none"
    >
      {/* 1. 4:5 Aspect Ratio Monochrome Photo Area */}
      <div className="relative w-full aspect-[4/5] bg-neutral-900 border-b border-white/10 overflow-hidden">
        {!imageError ? (
          <Image
            src={member.image}
            alt={`${member.name}, ${member.role}`}
            fill
            sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 25vw"
            className="object-cover grayscale transition-all duration-500 group-hover:grayscale-[0.35] group-hover:scale-[1.02]"
            onError={() => setImageError(true)}
          />
        ) : (
          <div className="w-full h-full flex flex-col items-center justify-center bg-gradient-to-b from-neutral-800 to-neutral-950 text-neutral-400 p-6 text-center">
            <div className="w-16 h-16 rounded-xs border border-white/15 flex items-center justify-center mb-3 bg-neutral-900 text-white font-mono text-xl font-bold tracking-widest group-hover:border-[#B7FF4A]/60 transition-colors">
              {initials}
            </div>
            <User className="w-6 h-6 text-[#B7FF4A] opacity-70 mb-2" />
            <span className="text-[10px] font-mono uppercase tracking-widest text-neutral-500">
              {member.role}
            </span>
          </div>
        )}

        {/* Subtle dark vignette overlay */}
        <div className="absolute inset-0 bg-gradient-to-t from-[#080808]/80 via-transparent to-transparent opacity-60 group-hover:opacity-30 transition-opacity duration-300 pointer-events-none" />

        {/* Top-Right Expand Prompt */}
        <div className="absolute top-3 right-3 opacity-0 group-hover:opacity-100 transition-opacity duration-200">
          <span className="text-[10px] font-mono uppercase tracking-wider bg-black/80 text-[#B7FF4A] border border-[#B7FF4A]/40 px-2 py-0.5 rounded-xs">
            View Profile
          </span>
        </div>
      </div>

      {/* 2. Editorial Info Section */}
      <div className="p-5 sm:p-6 flex flex-col justify-between flex-1 space-y-4">
        <div className="space-y-3">
          {/* Index in Technical Monospace */}
          <div className="flex items-center justify-between">
            <span className="font-mono text-xs font-bold text-[#B7FF4A] tracking-wider">
              {member.index}
            </span>
            <span className="text-[10px] font-mono text-neutral-600 uppercase tracking-widest">
              TECH TITAN
            </span>
          </div>

          {/* Member Name */}
          <h3 className="text-xl sm:text-2xl font-black text-white tracking-tight group-hover:text-white transition-colors">
            {member.name}
          </h3>

          {/* Role */}
          <p className="text-xs font-mono uppercase text-[#B7FF4A] tracking-wider font-semibold">
            {member.role}
          </p>

          {/* Description */}
          <p className="text-xs sm:text-sm text-neutral-400 font-normal leading-relaxed line-clamp-3">
            {member.description}
          </p>
        </div>

        {/* 3. Footer with LinkedIn Link */}
        <div className="pt-4 border-t border-white/10 flex items-center justify-between">
          <a
            href={member.linkedin}
            target="_blank"
            rel="noopener noreferrer"
            onClick={(e) => e.stopPropagation()}
            aria-label={`Open ${member.name} LinkedIn profile in a new tab`}
            className="inline-flex items-center gap-1.5 text-xs font-mono font-bold text-neutral-400 hover:text-[#B7FF4A] transition-colors group/link uppercase tracking-wider touch-target"
          >
            <span>LinkedIn</span>
            <ArrowUpRight className="w-3.5 h-3.5 group-hover/link:translate-x-0.5 group-hover/link:-translate-y-0.5 transition-transform duration-200" />
          </a>

          <span className="text-[11px] font-mono text-neutral-500 group-hover:text-neutral-300 transition-colors">
            Details →
          </span>
        </div>
      </div>

      {/* 4. Bottom Green Accent Line (20% default -> 100% on hover) */}
      <div
        aria-hidden="true"
        className="absolute bottom-0 left-0 h-[2px] bg-[#B7FF4A] w-[20%] group-hover:w-full transition-all duration-400 ease-out"
      />
    </article>
  );
}

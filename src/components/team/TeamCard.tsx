'use client';

import React, { useState } from 'react';
import Image from 'next/image';
import { ArrowUpRight, User } from 'lucide-react';
import { TeamMember } from '@/data/teamMembers';

interface TeamCardProps {
  member: TeamMember;
  onSelect?: (member: TeamMember) => void;
  className?: string;
}

export function TeamCard({ member, onSelect, className = '' }: TeamCardProps) {
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
      onClick={() => onSelect?.(member)}
      className={`group relative flex flex-col justify-between bg-white border border-slate-200/80 hover:border-slate-400/80 rounded-xl overflow-hidden shadow-xs hover:shadow-md transition-all duration-300 hover:-translate-y-1 select-none ${
        onSelect ? 'cursor-pointer' : ''
      } ${className}`}
    >
      {/* 1. 4:3 Aspect Ratio Grayscale Photo Area */}
      <div className="relative w-full aspect-[4/3] bg-slate-100 border-b border-slate-200/80 overflow-hidden">
        {!imageError ? (
          <Image
            src={member.image}
            alt={`${member.name} — ${member.role}`}
            fill
            sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 320px"
            className="object-cover grayscale transition-all duration-500 group-hover:grayscale-[0.6] group-hover:scale-[1.02]"
            onError={() => setImageError(true)}
          />
        ) : (
          <div className="w-full h-full flex flex-col items-center justify-center bg-gradient-to-b from-slate-50 to-slate-100 text-slate-400 p-6 text-center">
            <div className="w-14 h-14 rounded-lg border border-slate-300 flex items-center justify-center mb-2 bg-white text-slate-800 font-mono text-lg font-bold tracking-widest shadow-2xs group-hover:border-emerald-600 transition-colors">
              {initials}
            </div>
            <User className="w-5 h-5 text-slate-400 mb-1" />
            <span className="text-[10px] font-mono uppercase tracking-widest text-slate-500">
              {member.role}
            </span>
          </div>
        )}

        {/* Top-Right Expand Badge */}
        {onSelect && (
          <div className="absolute top-3 right-3 opacity-0 group-hover:opacity-100 transition-opacity duration-200">
            <span className="text-[10px] font-mono uppercase tracking-wider bg-white/90 backdrop-blur-xs text-slate-900 border border-slate-200 px-2 py-0.5 rounded-md shadow-2xs font-bold">
              View Bio
            </span>
          </div>
        )}
      </div>

      {/* 2. Editorial Info Section */}
      <div className="p-5 sm:p-6 flex flex-col justify-between flex-1 space-y-4">
        <div className="space-y-3">
          {/* Index in Technical Monospace + Muted Tag */}
          <div className="flex items-center justify-between">
            <span className="font-mono text-xs font-bold px-2 py-0.5 rounded-sm bg-[#B7FF3C]/25 text-slate-900 border border-[#B7FF3C]/40">
              {member.index}
            </span>
            <span className="text-[10px] font-mono text-slate-400 uppercase tracking-widest font-semibold">
              TECH TITAN
            </span>
          </div>

          {/* Member Name */}
          <h3 className="text-lg sm:text-xl font-bold text-slate-900 tracking-tight group-hover:text-blue-900 transition-colors">
            {member.name}
          </h3>

          {/* Role */}
          <p className="text-xs font-mono uppercase font-bold tracking-wider text-emerald-800">
            {member.role}
          </p>

          {/* Description */}
          <p className="text-xs sm:text-sm text-slate-600 font-normal leading-relaxed line-clamp-3">
            {member.description}
          </p>
        </div>

        {/* 3. Footer with LinkedIn Link */}
        <div className="pt-4 border-t border-slate-100 flex items-center justify-between">
          <a
            href={member.linkedin}
            target="_blank"
            rel="noopener noreferrer"
            onClick={(e) => e.stopPropagation()}
            aria-label={`LinkedIn profile of ${member.name}`}
            className="inline-flex items-center gap-1.5 text-xs font-mono font-bold text-slate-700 hover:text-slate-900 transition-colors group/link uppercase tracking-wider touch-target"
          >
            <span>LinkedIn</span>
            <ArrowUpRight className="w-3.5 h-3.5 group-hover/link:translate-x-0.5 group-hover/link:-translate-y-0.5 transition-transform duration-200" />
          </a>

          {onSelect && (
            <span className="text-[11px] font-mono text-slate-400 group-hover:text-slate-700 transition-colors">
              Details →
            </span>
          )}
        </div>
      </div>

      {/* 4. Bottom Lime Accent Line (20% default -> 100% on hover) */}
      <div
        aria-hidden="true"
        className="absolute bottom-0 left-0 h-[2.5px] bg-[#B7FF3C] w-[20%] group-hover:w-full transition-all duration-400 ease-out"
      />
    </article>
  );
}

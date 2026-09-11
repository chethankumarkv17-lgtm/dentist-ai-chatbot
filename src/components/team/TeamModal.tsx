'use client';

import React, { useEffect, useState } from 'react';
import Image from 'next/image';
import { X, ArrowUpRight, CheckCircle2, User } from 'lucide-react';
import { TeamMember } from '@/data/teamMembers';

interface TeamModalProps {
  member: TeamMember | null;
  onClose: () => void;
}

export function TeamModal({ member, onClose }: TeamModalProps) {
  const [imageError, setImageError] = useState(false);

  useEffect(() => {
    setImageError(false);
  }, [member]);

  useEffect(() => {
    if (!member) return;

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        onClose();
      }
    };

    document.body.style.overflow = 'hidden';
    window.addEventListener('keydown', handleKeyDown);

    return () => {
      document.body.style.overflow = 'unset';
      window.removeEventListener('keydown', handleKeyDown);
    };
  }, [member, onClose]);

  if (!member) return null;

  const initials = member.name
    .split(' ')
    .filter(Boolean)
    .map((n) => n[0])
    .slice(0, 2)
    .join('')
    .toUpperCase();

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-labelledby="modal-member-name"
      className="fixed inset-0 z-50 flex items-center justify-center p-4 sm:p-6 bg-black/80 backdrop-blur-md animate-fade-in"
      onClick={onClose}
    >
      <div
        className="relative w-full max-w-2xl bg-[#080808] border border-white/15 rounded-xs p-6 sm:p-8 text-white shadow-2xl space-y-6 max-h-[90vh] overflow-y-auto"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Top Accent Line */}
        <div className="absolute top-0 left-0 right-0 h-[2px] bg-[#B7FF4A]" />

        {/* Header with Close button */}
        <div className="flex items-start justify-between gap-4">
          <div className="flex items-center gap-3">
            <span className="font-mono text-xs text-[#B7FF4A] tracking-wider uppercase">
              {member.index} / PROFILE
            </span>
          </div>

          <button
            type="button"
            onClick={onClose}
            aria-label="Close profile details"
            className="p-2 text-slate-400 hover:text-white hover:bg-white/10 transition-colors rounded-xs cursor-pointer touch-target"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content Body: Image + Bio */}
        <div className="grid grid-cols-1 sm:grid-cols-12 gap-6 items-start">
          {/* Left: 4:5 Photo */}
          <div className="sm:col-span-5 relative aspect-[4/5] bg-neutral-900 border border-white/10 rounded-xs overflow-hidden">
            {!imageError ? (
              <Image
                src={member.image}
                alt={`${member.name}, ${member.role}`}
                fill
                sizes="(max-width: 640px) 100vw, 240px"
                className="object-cover grayscale"
                onError={() => setImageError(true)}
              />
            ) : (
              <div className="w-full h-full flex flex-col items-center justify-center bg-gradient-to-b from-neutral-800 to-neutral-950 text-neutral-400 p-4 text-center">
                <div className="w-16 h-16 rounded-xs border border-white/15 flex items-center justify-center mb-3 bg-neutral-900 text-white font-mono text-xl font-bold tracking-widest">
                  {initials}
                </div>
                <User className="w-6 h-6 text-[#B7FF4A] opacity-80 mb-1" />
                <span className="text-[10px] font-mono uppercase tracking-widest text-neutral-500">
                  {member.role}
                </span>
              </div>
            )}
          </div>

          {/* Right: Info, Bio & Skills */}
          <div className="sm:col-span-7 space-y-4">
            <div>
              <h3 id="modal-member-name" className="text-2xl sm:text-3xl font-black text-white tracking-tight">
                {member.name}
              </h3>
              <p className="text-xs font-mono uppercase text-[#B7FF4A] tracking-wider mt-1">
                {member.role}
              </p>
            </div>

            <div className="pt-2 border-t border-white/10 space-y-2">
              <span className="text-[11px] font-mono text-neutral-500 uppercase tracking-widest block">
                Overview
              </span>
              <p className="text-sm text-neutral-300 leading-relaxed font-normal">
                {member.bio || member.description}
              </p>
            </div>

            {/* Skills */}
            {member.skills && member.skills.length > 0 && (
              <div className="pt-2 border-t border-white/10 space-y-2">
                <span className="text-[11px] font-mono text-neutral-500 uppercase tracking-widest block">
                  Core Technologies &amp; Architecture
                </span>
                <div className="flex flex-wrap gap-1.5">
                  {member.skills.map((skill) => (
                    <span
                      key={skill}
                      className="text-xs font-mono px-2.5 py-1 bg-white/5 border border-white/10 text-neutral-200 rounded-xs flex items-center gap-1.5"
                    >
                      <CheckCircle2 className="w-3 h-3 text-[#B7FF4A] shrink-0" />
                      <span>{skill}</span>
                    </span>
                  ))}
                </div>
              </div>
            )}

            {/* LinkedIn CTA */}
            <div className="pt-4 border-t border-white/10">
              <a
                href={member.linkedin}
                target="_blank"
                rel="noopener noreferrer"
                aria-label={`Open ${member.name} LinkedIn profile in a new tab`}
                className="inline-flex items-center gap-2 px-4 py-2.5 bg-white/10 hover:bg-[#B7FF4A] hover:text-black text-white text-xs font-mono font-bold tracking-wider uppercase border border-white/15 hover:border-[#B7FF4A] transition-all duration-300 rounded-xs group"
              >
                <span>Connect on LinkedIn</span>
                <ArrowUpRight className="w-4 h-4 group-hover:translate-x-0.5 group-hover:-translate-y-0.5 transition-transform" />
              </a>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

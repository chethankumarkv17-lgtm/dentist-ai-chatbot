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
      className="fixed inset-0 z-50 flex items-center justify-center p-4 sm:p-6 bg-slate-900/60 backdrop-blur-sm animate-fade-in"
      onClick={onClose}
    >
      <div
        className="relative w-full max-w-2xl bg-white border border-slate-200/90 rounded-2xl p-6 sm:p-8 text-slate-900 shadow-2xl space-y-6 max-h-[90vh] overflow-y-auto"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Top Blue Accent Line */}
        <div className="absolute top-0 left-0 right-0 h-[3px] bg-gradient-to-r from-blue-600 to-indigo-600" />

        {/* Header with Close button */}
        <div className="flex items-start justify-between gap-4">
          <div className="flex items-center gap-2">
            <span className="font-mono text-xs font-bold px-2.5 py-0.5 rounded-sm bg-blue-50 text-blue-700 border border-blue-200/80 uppercase tracking-wider">
              {member.index} / PROFILE
            </span>
            <span className="text-[11px] font-mono text-slate-400 uppercase tracking-widest font-semibold">
              TECH TITAN
            </span>
          </div>

          <button
            type="button"
            onClick={onClose}
            aria-label="Close profile details"
            className="p-2 text-slate-400 hover:text-slate-900 hover:bg-slate-100 transition-colors rounded-xl cursor-pointer touch-target"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content Body: Image + Bio */}
        <div className="grid grid-cols-1 sm:grid-cols-12 gap-6 items-start">
          {/* Left: 4:3 Photo */}
          <div className="sm:col-span-5 relative aspect-[4/3] bg-slate-100 border border-slate-200 rounded-xl overflow-hidden shadow-2xs">
            {!imageError ? (
              <Image
                src={member.image}
                alt={`${member.name} — ${member.role}`}
                fill
                sizes="(max-width: 640px) 100vw, 240px"
                className="object-cover grayscale"
                onError={() => setImageError(true)}
              />
            ) : (
              <div className="w-full h-full flex flex-col items-center justify-center bg-gradient-to-b from-slate-50 to-slate-100 text-slate-400 p-4 text-center">
                <div className="w-14 h-14 rounded-lg border border-slate-300 flex items-center justify-center mb-2 bg-white text-slate-900 font-mono text-lg font-bold tracking-widest shadow-2xs">
                  {initials}
                </div>
                <User className="w-5 h-5 text-slate-400 mb-1" />
                <span className="text-[10px] font-mono uppercase tracking-widest text-slate-500">
                  {member.role}
                </span>
              </div>
            )}
          </div>

          {/* Right: Info, Bio & Skills */}
          <div className="sm:col-span-7 space-y-4">
            <div>
              <h3 id="modal-member-name" className="text-2xl sm:text-3xl font-black text-slate-900 tracking-tight">
                {member.name}
              </h3>
              <p className="text-xs font-mono uppercase text-blue-600 font-bold tracking-wider mt-1">
                {member.role}
              </p>
            </div>

            <div className="pt-2 border-t border-slate-100 space-y-1.5">
              <span className="text-[11px] font-mono text-slate-400 uppercase tracking-widest font-semibold block">
                Overview &amp; Focus
              </span>
              <p className="text-sm text-slate-600 leading-relaxed font-normal">
                {member.bio || member.description}
              </p>
            </div>

            {/* Skills */}
            {member.skills && member.skills.length > 0 && (
              <div className="pt-2 border-t border-slate-100 space-y-2">
                <span className="text-[11px] font-mono text-slate-400 uppercase tracking-widest font-semibold block">
                  Core Technologies &amp; Architecture
                </span>
                <div className="flex flex-wrap gap-1.5">
                  {member.skills.map((skill) => (
                    <span
                      key={skill}
                      className="text-xs font-mono px-2.5 py-1 bg-blue-50/70 border border-blue-100 text-slate-700 rounded-md flex items-center gap-1.5"
                    >
                      <CheckCircle2 className="w-3.5 h-3.5 text-blue-600 shrink-0" />
                      <span>{skill}</span>
                    </span>
                  ))}
                </div>
              </div>
            )}

            {/* LinkedIn CTA */}
            <div className="pt-4 border-t border-slate-100">
              <a
                href={member.linkedin}
                target="_blank"
                rel="noopener noreferrer"
                aria-label={`Open ${member.name} LinkedIn profile in a new tab`}
                className="inline-flex items-center gap-2 px-5 py-2.5 bg-slate-900 hover:bg-slate-800 text-white text-xs font-mono font-bold tracking-wider uppercase rounded-xl transition-all duration-300 shadow-sm group touch-target"
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

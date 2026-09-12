'use client';

import React, { useEffect, useState } from 'react';
import Image from 'next/image';
import { X, ArrowUpRight, CheckCircle2, User, Mail } from 'lucide-react';
import { TeamMember } from '@/data/teamMembers';

interface TeamModalProps {
  member: TeamMember | null;
  onClose: () => void;
}

export function TeamModal({ member, onClose }: TeamModalProps) {
  const currentMemberId = member ? member.id : null;
  const [prevMemberId, setPrevMemberId] = useState<string | null>(currentMemberId);
  const [imageState, setImageState] = useState<'loading' | 'loaded' | 'error'>('loading');

  if (currentMemberId !== prevMemberId) {
    setPrevMemberId(currentMemberId);
    setImageState('loading');
  }

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
        className="relative w-full max-w-2xl bg-white dark:bg-slate-900 border border-slate-200/90 dark:border-slate-800 rounded-2xl p-6 sm:p-8 text-slate-900 dark:text-slate-100 shadow-2xl space-y-6 max-h-[90vh] overflow-y-auto transition-colors duration-200"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Top Blue Accent Line */}
        <div className="absolute top-0 left-0 right-0 h-[3px] bg-gradient-to-r from-blue-600 to-indigo-600" />

        {/* Header with Back & Close button */}
        <div className="flex items-start justify-between gap-4">
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={onClose}
              aria-label="Back to team overview"
              className="inline-flex items-center gap-1.5 px-3 py-1 bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-200 text-xs font-mono font-bold rounded-lg transition-colors cursor-pointer mr-1"
            >
              <span>← Back</span>
            </button>
            <span className="font-mono text-xs font-bold px-2.5 py-0.5 rounded-sm bg-blue-50 dark:bg-blue-950/80 text-blue-700 dark:text-blue-300 border border-blue-200/80 dark:border-blue-900/60 uppercase tracking-wider">
              {member.index} / PROFILE
            </span>
            <span className="text-[11px] font-mono text-slate-400 uppercase tracking-widest font-semibold hidden sm:inline">
              TECH TITAN
            </span>
          </div>

          <button
            type="button"
            onClick={onClose}
            aria-label="Close profile details"
            className="p-2 text-slate-400 hover:text-slate-900 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors rounded-xl cursor-pointer touch-target"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content Body: Image + Bio */}
        <div className="grid grid-cols-1 sm:grid-cols-12 gap-6 items-start">
          {/* Left: 4:5 Photo */}
          <div className="sm:col-span-5 relative aspect-[4/5] bg-slate-100 border border-slate-200 rounded-xl overflow-hidden shadow-2xs">
            {/* Loading Skeleton */}
            {imageState === 'loading' && (
              <div className="absolute inset-0 z-10 bg-slate-100 animate-pulse">
                <div className="w-full h-full flex flex-col items-center justify-center gap-3">
                  <div className="w-14 h-14 rounded-full bg-slate-200" />
                  <div className="w-20 h-3 rounded bg-slate-200" />
                  <div className="w-14 h-2.5 rounded bg-slate-200" />
                </div>
              </div>
            )}

            {imageState !== 'error' && (
              <Image
                src={member.image}
                alt={`${member.name} — ${member.role}`}
                fill
                sizes="(max-width: 640px) 100vw, 240px"
                className={`object-cover object-center grayscale transition-all duration-500 hover:grayscale-[0.5] ${
                  imageState === 'loading' ? 'opacity-0' : 'opacity-100'
                }`}
                onLoad={() => setImageState('loaded')}
                onError={() => {
                  console.warn(
                    `[TeamModal] Image failed to load for "${member.name}" (${member.id}): ${member.image}`
                  );
                  setImageState('error');
                }}
              />
            )}

            {imageState === 'error' && (
              <div className="w-full h-full flex flex-col items-center justify-center bg-gradient-to-b from-slate-50 to-slate-100 text-slate-400 p-4 text-center">
                <div className="w-14 h-14 rounded-lg border border-slate-300 flex items-center justify-center mb-2 bg-white text-slate-900 font-mono text-lg font-bold tracking-widest shadow-2xs">
                  {initials}
                </div>
                <User className="w-5 h-5 text-slate-400 mb-1" />
                <span className="text-[10px] font-mono uppercase tracking-widest text-slate-500">
                  {member.role}
                </span>
                <span className="mt-2 text-[9px] font-mono text-slate-400/80 italic">
                  Photo unavailable
                </span>
              </div>
            )}
          </div>

          {/* Right: Info, Bio & Skills */}
          <div className="sm:col-span-7 space-y-4">
            <div>
              <h3 id="modal-member-name" className="text-2xl sm:text-3xl font-black text-slate-900 dark:text-white tracking-tight">
                {member.name}
              </h3>
              <p className="text-xs font-mono uppercase text-blue-600 dark:text-blue-400 font-bold tracking-wider mt-1">
                {member.role}
              </p>

              {member.email && (
                <div className="mt-2.5">
                  <a
                    href={`mailto:${member.email}`}
                    className="inline-flex items-center gap-1.5 text-xs font-mono text-slate-700 dark:text-slate-200 hover:text-blue-600 dark:hover:text-blue-400 bg-slate-50 dark:bg-slate-800 hover:bg-blue-50/80 dark:hover:bg-slate-700 border border-slate-200 dark:border-slate-700 px-2.5 py-1 rounded-md transition-colors"
                  >
                    <Mail className="w-3.5 h-3.5 text-blue-600 dark:text-blue-400" />
                    <span>{member.email}</span>
                  </a>
                </div>
              )}
            </div>

            <div className="pt-2 border-t border-slate-100 dark:border-slate-800 space-y-1.5">
              <span className="text-[11px] font-mono text-slate-400 uppercase tracking-widest font-semibold block">
                Overview &amp; Focus
              </span>
              <p className="text-sm text-slate-600 dark:text-slate-300 leading-relaxed font-normal">
                {member.bio || member.description}
              </p>
            </div>

            {/* Skills */}
            {member.skills && member.skills.length > 0 && (
              <div className="pt-2 border-t border-slate-100 dark:border-slate-800 space-y-2">
                <span className="text-[11px] font-mono text-slate-400 uppercase tracking-widest font-semibold block">
                  Core Technologies &amp; Architecture
                </span>
                <div className="flex flex-wrap gap-1.5">
                  {member.skills.map((skill) => (
                    <span
                      key={skill}
                      className="text-xs font-mono px-2.5 py-1 bg-blue-50/70 dark:bg-blue-950/60 border border-blue-100 dark:border-blue-900/60 text-slate-700 dark:text-slate-200 rounded-md flex items-center gap-1.5"
                    >
                      <CheckCircle2 className="w-3.5 h-3.5 text-blue-600 dark:text-blue-400 shrink-0" />
                      <span>{skill}</span>
                    </span>
                  ))}
                </div>
              </div>
            )}

            {/* Action CTAs: LinkedIn + Email */}
            <div className="pt-4 border-t border-slate-100 dark:border-slate-800 flex flex-wrap items-center gap-3">
              <a
                href={member.linkedin}
                target="_blank"
                rel="noopener noreferrer"
                aria-label={`Open ${member.name} LinkedIn profile in a new tab`}
                className="inline-flex items-center gap-2 px-4 py-2 bg-slate-900 dark:bg-white hover:bg-slate-800 dark:hover:bg-slate-100 text-white dark:text-slate-950 text-xs font-mono font-bold tracking-wider uppercase rounded-xl transition-all duration-300 shadow-sm group touch-target"
              >
                <span>LinkedIn</span>
                <ArrowUpRight className="w-4 h-4 group-hover:translate-x-0.5 group-hover:-translate-y-0.5 transition-transform" />
              </a>

              {member.email && (
                <a
                  href={`mailto:${member.email}`}
                  aria-label={`Send email to ${member.name}`}
                  className="inline-flex items-center gap-2 px-4 py-2 bg-blue-50 dark:bg-blue-950/60 hover:bg-blue-100/80 dark:hover:bg-blue-900/60 text-blue-700 dark:text-blue-300 border border-blue-200/80 dark:border-blue-900/60 text-xs font-mono font-bold tracking-wider uppercase rounded-xl transition-all duration-300 shadow-2xs touch-target"
                >
                  <Mail className="w-4 h-4 text-blue-600 dark:text-blue-400" />
                  <span>Send Email</span>
                </a>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}


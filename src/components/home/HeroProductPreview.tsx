'use client';

import React, { useState } from 'react';
import {
  Sparkles,
  CheckCircle2,
  Calendar,
  Clock,
  MessageSquare,
  Phone,
  ShieldCheck,
  User,
  Bot,
  Zap,
} from 'lucide-react';

export function HeroProductPreview() {
  const [selectedSlot, setSelectedSlot] = useState('2:30 PM');

  const slots = ['10:30 AM', '2:30 PM', '4:15 PM'];

  return (
    <div className="relative max-w-3xl mx-auto mt-12 sm:mt-16 select-none animate-fade-in">
      {/* Ambient Glow behind the spatial card */}
      <div
        aria-hidden="true"
        className="absolute -inset-4 bg-gradient-to-r from-blue-600/20 via-indigo-600/15 to-cyan-500/20 rounded-[2.5rem] blur-2xl -z-10 opacity-70"
      />

      {/* Main Layered Spatial Glass Surface */}
      <div className="liquid-glass-strong rounded-3xl p-5 sm:p-7 border border-white/80 shadow-2xl space-y-6 text-left relative overflow-hidden backdrop-blur-2xl">
        {/* Spatial Card Header */}
        <div className="flex items-center justify-between pb-4 border-b border-slate-200/70">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-gradient-to-br from-blue-600 to-indigo-600 flex items-center justify-center text-white shadow-md shadow-blue-500/30">
              <Bot className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="font-extrabold text-sm sm:text-base text-slate-900 tracking-tight">
                  Apex Dental AI Receptionist
                </span>
                <span className="text-[10px] font-extrabold px-2 py-0.5 rounded-full bg-blue-100/90 text-blue-700 border border-blue-200">
                  Omnichannel
                </span>
              </div>
              <p className="text-[11px] font-medium text-slate-500">Connected to Practice Google Calendar</p>
            </div>
          </div>

          <div className="flex items-center gap-2 px-3 py-1.5 rounded-full bg-emerald-50/90 border border-emerald-200 text-emerald-700 text-xs font-bold shadow-2xs">
            <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
            <span className="hidden sm:inline">● Live 24/7 Scheduling</span>
            <span className="sm:hidden">Live</span>
          </div>
        </div>

        {/* Live Conversation Stream */}
        <div className="space-y-4">
          {/* Patient Message */}
          <div className="flex items-start gap-2.5 justify-end">
            <div className="max-w-[85%] sm:max-w-[75%] rounded-2xl rounded-tr-none px-4 py-3 bg-gradient-to-r from-blue-600 to-indigo-600 text-white text-xs sm:text-sm font-medium shadow-md shadow-blue-500/20 leading-relaxed">
              Hi, do you have an opening for teeth whitening or dental cleaning tomorrow afternoon?
            </div>
            <div className="w-7 h-7 rounded-xl bg-slate-200 text-slate-700 flex items-center justify-center shrink-0 mt-1">
              <User className="w-4 h-4" />
            </div>
          </div>

          {/* AI Receptionist Response */}
          <div className="flex items-start gap-2.5 justify-start">
            <div className="w-7 h-7 rounded-xl bg-blue-600 text-white flex items-center justify-center shrink-0 mt-1 shadow-xs">
              <Bot className="w-4 h-4" />
            </div>
            <div className="max-w-[90%] sm:max-w-[80%] rounded-2xl rounded-tl-none p-4 bg-white/95 border border-slate-200/90 text-slate-900 shadow-sm space-y-3">
              <p className="text-xs sm:text-sm leading-relaxed">
                Hello! Yes, <span className="font-bold text-blue-600">Dr. Sarah Jenkins</span> has 3 slots available
                tomorrow for <span className="font-bold">Teeth Cleaning & Whitening</span> (₹2,499):
              </p>

              {/* Interactive Time Slot Picker Chips */}
              <div className="flex flex-wrap items-center gap-2 pt-1">
                {slots.map((slot) => {
                  const isSelected = selectedSlot === slot;
                  return (
                    <button
                      key={slot}
                      type="button"
                      onClick={() => setSelectedSlot(slot)}
                      className={`px-3.5 py-1.5 rounded-xl text-xs font-bold transition-all duration-200 cursor-pointer flex items-center gap-1.5 ${
                        isSelected
                          ? 'bg-blue-600 text-white shadow-md shadow-blue-500/30 scale-105'
                          : 'bg-slate-100/90 text-slate-700 hover:bg-slate-200 border border-slate-200/60'
                      }`}
                    >
                      <Clock className="w-3.5 h-3.5" />
                      <span>{slot}</span>
                      {isSelected && <CheckCircle2 className="w-3.5 h-3.5 ml-0.5" />}
                    </button>
                  );
                })}
              </div>

              {/* Instant Calendar Sync Confirmation */}
              <div className="flex items-center gap-2 p-2.5 rounded-xl bg-emerald-50/90 border border-emerald-200 text-emerald-800 text-[11px] font-bold">
                <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
                <span>
                  Slot reserved for {selectedSlot} • Confirmed & WhatsApp 24h reminder active.
                </span>
              </div>
            </div>
          </div>
        </div>

        {/* Spatial Footer Telemetry Bar */}
        <div className="pt-3 border-t border-slate-200/70 flex flex-wrap items-center justify-between gap-3 text-[11px] font-bold text-slate-500">
          <div className="flex items-center gap-2">
            <Zap className="w-3.5 h-3.5 text-amber-500" />
            <span>Two-Way Calendar Sync in 0.4s</span>
          </div>
          <div className="flex items-center gap-2">
            <ShieldCheck className="w-3.5 h-3.5 text-blue-600" />
            <span>Zero Double-Booking Guarantee</span>
          </div>
        </div>
      </div>
    </div>
  );
}

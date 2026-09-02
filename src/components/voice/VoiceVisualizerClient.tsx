'use client';

import React, { useState } from 'react';
import { PhoneCall, PhoneOff, AlertCircle, Mic, MicOff, Volume2, Sparkles } from 'lucide-react';
import { Badge } from '@/components/ui/Badge';

export type VoiceState = 'idle' | 'connecting' | 'listening' | 'thinking' | 'speaking' | 'ended';

export function VoiceVisualizerClient({ clinicName = 'Radiant Dental Clinic' }: { clinicName?: string }) {
  const [state, setState] = useState<VoiceState>('idle');
  const [transcript, setTranscript] = useState<string>('Press start to simulate an inbound patient call.');

  const handleStartCall = () => {
    setState('connecting');
    setTranscript('Connecting to telephony carrier...');

    setTimeout(() => {
      setState('listening');
      setTranscript('Caller: "Hi, I have tooth pain and need an appointment with Dr. Deshpande tomorrow morning."');
    }, 1800);

    setTimeout(() => {
      setState('thinking');
      setTranscript('AI Receptionist is checking real-time availability in calendar database...');
    }, 4500);

    setTimeout(() => {
      setState('speaking');
      setTranscript('Sarah (AI): "I can book you for 10:30 AM tomorrow with Dr. Deshpande. May I have your full name?"');
    }, 7000);

    setTimeout(() => {
      setState('idle');
      setTranscript('Call completed. Appointment reservation confirmed & WhatsApp confirmation sent.');
    }, 11000);
  };

  const handleEndCall = () => {
    setState('idle');
    setTranscript('Call ended.');
  };

  return (
    <div className="liquid-glass-strong rounded-3xl p-6 sm:p-8 border border-white/80 shadow-2xl space-y-6 text-slate-900">
      <div className="flex items-center justify-between">
        <div>
          <span className="text-xs font-black uppercase tracking-wider text-purple-600">Live Voice Engine</span>
          <h3 className="text-lg font-black text-slate-900 mt-0.5 tracking-tight">Interactive Voice Receptionist Simulator</h3>
        </div>
        <Badge variant="voice" size="sm">
          {state.toUpperCase()}
        </Badge>
      </div>

      {/* Clean Voice Visualizer Sphere with Glowing Acoustic Rings */}
      <div className="flex flex-col items-center justify-center py-6 space-y-4">
        <div className="relative flex items-center justify-center">
          {state !== 'idle' && (
            <>
              <div className="absolute w-28 h-28 rounded-full bg-purple-500/20 animate-ping" />
              <div className="absolute w-24 h-24 rounded-full bg-blue-500/30 animate-pulse" />
            </>
          )}

          <div
            className={`w-20 h-20 rounded-2xl flex items-center justify-center transition-all duration-300 shadow-md ${
              state === 'idle'
                ? 'bg-slate-100 text-slate-400 border border-slate-200'
                : state === 'listening'
                ? 'bg-emerald-600 text-white shadow-emerald-500/30'
                : state === 'thinking'
                ? 'bg-amber-600 text-white shadow-amber-500/30'
                : state === 'speaking'
                ? 'bg-purple-600 text-white shadow-purple-500/40'
                : 'bg-blue-600 text-white shadow-blue-500/30'
            }`}
          >
            {state === 'idle' && <MicOff className="w-8 h-8" />}
            {state === 'connecting' && <PhoneCall className="w-8 h-8 animate-bounce" />}
            {state === 'listening' && <Mic className="w-8 h-8" />}
            {state === 'thinking' && <Sparkles className="w-8 h-8 animate-spin" />}
            {state === 'speaking' && <Volume2 className="w-8 h-8" />}
          </div>
        </div>

        {/* State Label */}
        <p className="text-xs font-black tracking-wider uppercase text-slate-600">
          {state === 'idle' && 'AI Receptionist Standby'}
          {state === 'connecting' && 'Connecting Inbound Call...'}
          {state === 'listening' && 'Listening to Patient Speech...'}
          {state === 'thinking' && 'Processing Calendar Tools & Guardrails...'}
          {state === 'speaking' && 'Speaking Natural Voice Audio...'}
        </p>

        {/* Live Audio Transcript Box */}
        <div className="w-full liquid-glass rounded-2xl p-4 border border-slate-200/80 min-h-[64px] flex items-center justify-center text-center shadow-2xs">
          <p className="text-xs text-slate-700 font-medium italic leading-relaxed">{transcript}</p>
        </div>
      </div>

      {/* Interactive Controls */}
      <div className="flex flex-col sm:flex-row items-center justify-center gap-3 pt-2">
        {state === 'idle' ? (
          <button
            type="button"
            onClick={handleStartCall}
            className="w-full sm:w-auto inline-flex items-center justify-center gap-2 px-6 py-3 rounded-xl bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-700 hover:to-indigo-700 text-white font-black text-xs shadow-md shadow-purple-500/25 transition-all cursor-pointer"
          >
            <PhoneCall className="w-4 h-4" />
            <span>Simulate Inbound Patient Call</span>
          </button>
        ) : (
          <button
            type="button"
            onClick={handleEndCall}
            className="w-full sm:w-auto inline-flex items-center justify-center gap-2 px-6 py-3 rounded-xl bg-red-600 hover:bg-red-700 text-white font-black text-xs shadow-md shadow-red-500/25 transition-all cursor-pointer"
          >
            <PhoneOff className="w-4 h-4" />
            <span>End Call Simulation</span>
          </button>
        )}
      </div>

      <div className="pt-2 border-t border-slate-200/60 flex items-center justify-between text-[11px] text-slate-500 font-bold">
        <div className="flex items-center gap-1.5">
          <AlertCircle className="w-3.5 h-3.5 text-purple-600" />
          <span>Indian English & Bilingual Speech Engine</span>
        </div>
        <span>{clinicName}</span>
      </div>
    </div>
  );
}

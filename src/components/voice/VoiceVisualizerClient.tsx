'use client';

import React, { useState, useEffect } from 'react';
import { Mic, MicOff, Volume2, PhoneCall, PhoneOff, Sparkles, AlertCircle } from 'lucide-react';
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
    }, 6500);

    setTimeout(() => {
      setState('idle');
      setTranscript('Call completed. Appointment reservation confirmed.');
    }, 10000);
  };

  const handleEndCall = () => {
    setState('idle');
    setTranscript('Call ended.');
  };

  return (
    <div className="bg-slate-900 text-white rounded-2xl p-6 sm:p-8 border border-slate-800 shadow-xl space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <span className="text-xs font-bold uppercase tracking-wider text-purple-400">Live Voice Engine</span>
          <h3 className="text-lg font-extrabold text-white mt-0.5">Interactive Voice Receptionist Simulator</h3>
        </div>
        <Badge variant="voice" size="sm">
          {state.toUpperCase()}
        </Badge>
      </div>

      {/* Visualizer Sphere */}
      <div className="flex flex-col items-center justify-center py-6 space-y-4">
        <div className="relative flex items-center justify-center">
          {/* Animated Glow Rings */}
          {state !== 'idle' && (
            <>
              <div className="absolute w-28 h-28 rounded-full bg-purple-600/30 animate-ping" />
              <div className="absolute w-24 h-24 rounded-full bg-blue-600/40 animate-pulse" />
            </>
          )}

          <div
            className={`w-20 h-20 rounded-full flex items-center justify-center transition-all duration-300 ${
              state === 'idle'
                ? 'bg-slate-800 text-slate-400 border border-slate-700'
                : state === 'listening'
                ? 'bg-emerald-600 text-white shadow-lg shadow-emerald-500/30'
                : state === 'thinking'
                ? 'bg-amber-600 text-white shadow-lg shadow-amber-500/30'
                : state === 'speaking'
                ? 'bg-purple-600 text-white shadow-lg shadow-purple-500/40'
                : 'bg-blue-600 text-white shadow-lg shadow-blue-500/30'
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
        <p className="text-xs font-bold tracking-wider uppercase text-slate-300">
          {state === 'idle' && 'Receptionist Standby'}
          {state === 'connecting' && 'Connecting Inbound Call...'}
          {state === 'listening' && 'Listening to Patient Speech...'}
          {state === 'thinking' && 'Processing Calendar Tools & Guardrails...'}
          {state === 'speaking' && 'Speaking Natural Voice Audio...'}
        </p>

        {/* Live Audio Transcript Box */}
        <div className="w-full bg-slate-800/80 rounded-xl p-4 border border-slate-700/80 min-h-[60px] flex items-center justify-center text-center">
          <p className="text-xs text-slate-300 font-mono italic">{transcript}</p>
        </div>
      </div>

      {/* Simulator Actions */}
      <div className="flex items-center justify-center gap-3 pt-2">
        {state === 'idle' ? (
          <button
            onClick={handleStartCall}
            className="inline-flex items-center gap-2 px-6 py-2.5 rounded-xl bg-purple-600 hover:bg-purple-700 text-white text-xs font-bold shadow-lg shadow-purple-500/25 transition-all touch-target"
          >
            <PhoneCall className="w-4 h-4" />
            <span>Simulate Inbound Patient Call</span>
          </button>
        ) : (
          <button
            onClick={handleEndCall}
            className="inline-flex items-center gap-2 px-6 py-2.5 rounded-xl bg-red-600 hover:bg-red-700 text-white text-xs font-bold transition-all touch-target"
          >
            <PhoneOff className="w-4 h-4" />
            <span>End Simulator Turn</span>
          </button>
        )}
      </div>
    </div>
  );
}

'use client';

import React, { useState, useEffect, useRef, Suspense } from 'react';
import { useSearchParams } from 'next/navigation';
import { MessageCircle, X, Send, RotateCcw, Calendar, Clock, Sparkles } from 'lucide-react';

interface Message {
  id: string;
  role: 'user' | 'assistant';
  content: string;
}

function WidgetContent() {
  const searchParams = useSearchParams();
  const clinicId = searchParams.get('id');

  const [isOpen, setIsOpen] = useState(false);
  const [config, setConfig] = useState<{ clinicName?: string; themeColor?: string; greeting?: string } | null>(null);
  const [messages, setMessages] = useState<Message[]>([]);
  const [inputValue, setInputValue] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const messagesEndRef = useRef<HTMLDivElement>(null);

  const quickPrompts = [
    '📅 Book Teeth Cleaning',
    '⏰ Clinic Hours Today',
    '💰 Treatment Pricing',
    '👨‍⚕️ Available Dentists',
  ];

  useEffect(() => {
    window.parent.postMessage(
      {
        type: 'DENTALAI_WIDGET_RESIZE',
        status: isOpen ? 'open' : 'closed',
      },
      '*'
    );
  }, [isOpen]);

  useEffect(() => {
    if (!clinicId) return;

    fetch(`/api/widget/config?id=${clinicId}`)
      .then((res) => res.json())
      .then((data) => {
        setConfig(data);
        const history = localStorage.getItem(`dentalai_chat_${clinicId}`);
        if (history) {
          setMessages(JSON.parse(history));
        } else {
          setMessages([
            {
              id: 'welcome',
              role: 'assistant',
              content:
                data.greeting ||
                'Hello! Welcome to our dental clinic. How can I assist you with appointment scheduling or treatments today?',
            },
          ]);
        }
      })
      .catch(() => setError('Failed to load clinic configuration.'));
  }, [clinicId]);

  useEffect(() => {
    if (messages.length > 0 && clinicId) {
      localStorage.setItem(`dentalai_chat_${clinicId}`, JSON.stringify(messages));
      messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    }
  }, [messages, clinicId]);

  const sendQuery = async (text: string) => {
    if (!text.trim() || isLoading) return;

    const userMessage: Message = { id: Date.now().toString(), role: 'user', content: text.trim() };
    setMessages((prev) => [...prev, userMessage]);
    setInputValue('');
    setIsLoading(true);
    setError(null);

    try {
      const res = await fetch('/api/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          widgetId: clinicId,
          message: userMessage.content,
          history: messages.slice(-5),
        }),
      });

      if (!res.ok) throw new Error('Network response was not ok');
      const data = await res.json();

      setMessages((prev) => [
        ...prev,
        { id: Date.now().toString(), role: 'assistant', content: data.reply },
      ]);
    } catch {
      setError('Connection lost. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleSend = async (e?: React.FormEvent) => {
    e?.preventDefault();
    await sendQuery(inputValue);
  };

  const handleReset = () => {
    if (!clinicId) return;
    localStorage.removeItem(`dentalai_chat_${clinicId}`);
    setMessages([
      {
        id: 'welcome',
        role: 'assistant',
        content: config?.greeting || 'Hello! How can I assist you with scheduling today?',
      },
    ]);
    setError(null);
  };

  if (!clinicId) return null;

  if (!isOpen) {
    return (
      <button
        onClick={() => setIsOpen(true)}
        className="w-full h-full rounded-full text-white flex items-center justify-center shadow-xl hover:scale-105 active:scale-95 transition-all duration-300 touch-target cursor-pointer"
        style={{ backgroundColor: config?.themeColor || '#2563eb' }}
        aria-label="Open chat assistant"
      >
        <MessageCircle className="w-8 h-8" />
      </button>
    );
  }

  return (
    <div className="flex flex-col h-full w-full bg-white/95 backdrop-blur-xl sm:rounded-3xl shadow-2xl overflow-hidden border border-slate-200/80 animate-fade-in font-sans">
      {/* Liquid Glass Header */}
      <div
        className="flex items-center justify-between px-5 py-3.5 text-white shadow-xs"
        style={{ backgroundColor: config?.themeColor || '#2563eb' }}
      >
        <div className="flex flex-col">
          <span className="font-extrabold text-sm sm:text-base tracking-tight leading-tight">
            {config?.clinicName || 'AI Clinic Receptionist'}
          </span>
          <span className="text-[11px] opacity-95 font-semibold flex items-center gap-1 mt-0.5">
            <span className="w-1.5 h-1.5 rounded-full bg-emerald-300 animate-pulse" />
            24/7 Live Scheduling
          </span>
        </div>
        <div className="flex items-center gap-1.5">
          <button
            onClick={handleReset}
            className="p-1.5 hover:bg-white/20 rounded-xl transition-colors touch-target flex items-center justify-center cursor-pointer"
            title="Restart Conversation"
            aria-label="Restart Conversation"
          >
            <RotateCcw className="w-4 h-4" />
          </button>
          <button
            onClick={() => setIsOpen(false)}
            className="p-1.5 hover:bg-white/20 rounded-xl transition-colors touch-target flex items-center justify-center cursor-pointer"
            aria-label="Close chat"
          >
            <X className="w-5 h-5" />
          </button>
        </div>
      </div>

      {/* Chat Messages */}
      <div className="flex-1 overflow-y-auto p-4 space-y-3.5 bg-slate-50/70 relative">
        {messages.map((msg) => (
          <div key={msg.id} className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}>
            <div
              className={`max-w-[85%] rounded-2xl px-4 py-2.5 text-xs sm:text-sm leading-relaxed ${
                msg.role === 'user'
                  ? 'bg-blue-600 text-white rounded-br-none shadow-md shadow-blue-500/20'
                  : 'bg-white/95 border border-slate-200/80 text-slate-900 rounded-bl-none shadow-2xs'
              }`}
              style={msg.role === 'user' ? { backgroundColor: config?.themeColor || '#2563eb' } : {}}
            >
              {msg.content}
            </div>
          </div>
        ))}

        {isLoading && (
          <div className="flex justify-start">
            <div className="bg-white/95 border border-slate-200/80 rounded-2xl rounded-bl-none px-4 py-3 shadow-2xs flex gap-1.5 items-center">
              <span className="w-2 h-2 bg-blue-600 rounded-full animate-bounce" />
              <span className="w-2 h-2 bg-blue-600 rounded-full animate-bounce [animation-delay:150ms]" />
              <span className="w-2 h-2 bg-blue-600 rounded-full animate-bounce [animation-delay:300ms]" />
            </div>
          </div>
        )}
        <div ref={messagesEndRef} />
      </div>

      {/* Quick Action Chips with Liquid Glass */}
      <div className="px-3 py-2 bg-white/90 backdrop-blur-md border-t border-slate-100 flex items-center gap-1.5 overflow-x-auto whitespace-nowrap scrollbar-none">
        {quickPrompts.map((prompt) => (
          <button
            key={prompt}
            onClick={() => sendQuery(prompt.replace(/^[^\s]+ /, ''))}
            disabled={isLoading}
            className="px-3 py-1 rounded-full bg-slate-100/90 hover:bg-slate-200 text-[11px] font-bold text-slate-700 border border-slate-200/60 shadow-2xs transition-all shrink-0 disabled:opacity-50 cursor-pointer"
          >
            {prompt}
          </button>
        ))}
      </div>

      {/* Error Bar */}
      {error && (
        <div className="bg-rose-50/90 backdrop-blur-sm p-2 text-center text-xs text-rose-700 border-t border-rose-200 font-medium">
          {error}
        </div>
      )}

      {/* Liquid Glass Input Box */}
      <form onSubmit={handleSend} className="p-3 bg-white/90 backdrop-blur-md border-t border-slate-200/80 flex gap-2">
        <input
          type="text"
          value={inputValue}
          onChange={(e) => setInputValue(e.target.value)}
          placeholder="Ask a question or book a slot..."
          className="flex-1 liquid-glass-input rounded-full px-4 py-2.5 text-xs sm:text-sm text-slate-900 outline-none transition-all"
          disabled={isLoading}
        />
        <button
          type="submit"
          disabled={!inputValue.trim() || isLoading}
          className="text-white p-2.5 rounded-full shadow-md shadow-blue-500/20 disabled:opacity-40 transition-all flex items-center justify-center w-10 h-10 shrink-0 touch-target cursor-pointer"
          style={{ backgroundColor: inputValue.trim() ? config?.themeColor || '#2563eb' : '#94a3b8' }}
          aria-label="Send message"
        >
          <Send className="w-4 h-4 ml-0.5" />
        </button>
      </form>
    </div>
  );
}

export default function WidgetPage() {
  return (
    <Suspense fallback={null}>
      <WidgetContent />
    </Suspense>
  );
}

'use client';

import React, { useState, useEffect, useRef, Suspense } from 'react';
import { useSearchParams } from 'next/navigation';
import { MessageCircle, X, Send, RotateCcw } from 'lucide-react';

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

  useEffect(() => {
    // Notify parent to resize
    window.parent.postMessage({
      type: 'DENTALAI_WIDGET_RESIZE',
      status: isOpen ? 'open' : 'closed'
    }, '*');
  }, [isOpen]);

  useEffect(() => {
    if (!clinicId) return;

    // Fetch public config
    fetch(`/api/widget/config?id=${clinicId}`)
      .then(res => res.json())
      .then(data => {
        setConfig(data);
        // Load history or initialize
        const history = localStorage.getItem(`dentalai_chat_${clinicId}`);
        if (history) {
          setMessages(JSON.parse(history));
        } else {
          setMessages([{
            id: 'welcome',
            role: 'assistant',
            content: data.greeting || 'Hello! How can I help you today?'
          }]);
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

  const handleSend = async (e?: React.FormEvent) => {
    e?.preventDefault();
    if (!inputValue.trim() || isLoading) return;

    const userMessage: Message = { id: Date.now().toString(), role: 'user', content: inputValue.trim() };
    setMessages(prev => [...prev, userMessage]);
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
          history: messages.slice(-5) // Send last 5 for context
        })
      });

      if (!res.ok) throw new Error('Network response was not ok');
      const data = await res.json();

      setMessages(prev => [...prev, { id: Date.now().toString(), role: 'assistant', content: data.reply }]);
    } catch {
      setError('Connection lost. Please try again.');
      // Remove the user message so they can retry, or just keep it and show error.
    } finally {
      setIsLoading(false);
    }
  };

  const handleReset = () => {
    if (!clinicId) return;
    localStorage.removeItem(`dentalai_chat_${clinicId}`);
    setMessages([{
      id: 'welcome',
      role: 'assistant',
      content: config?.greeting || 'Hello! How can I help you today?'
    }]);
    setError(null);
  };

  if (!clinicId) return null;

  if (!isOpen) {
    return (
      <button 
        onClick={() => setIsOpen(true)}
        className="w-full h-full rounded-full bg-blue-600 text-white flex items-center justify-center shadow-lg hover:scale-105 transition-transform"
        style={{ backgroundColor: config?.themeColor || '#2563eb' }}
        aria-label="Open chat assistant"
      >
        <MessageCircle className="w-8 h-8" />
      </button>
    );
  }

  return (
    <div className="flex flex-col h-full w-full bg-white sm:rounded-2xl shadow-xl overflow-hidden border border-slate-200">
      {/* Header */}
      <div 
        className="flex items-center justify-between px-4 py-3 text-white"
        style={{ backgroundColor: config?.themeColor || '#2563eb' }}
      >
        <div className="flex flex-col">
          <span className="font-semibold text-sm sm:text-base">{config?.clinicName || 'Clinic Assistant'}</span>
          <span className="text-xs opacity-90">Usually responds instantly</span>
        </div>
        <div className="flex items-center gap-2">
          <button onClick={handleReset} className="p-1 hover:bg-white/20 rounded" title="Restart Conversation">
            <RotateCcw className="w-4 h-4" />
          </button>
          <button onClick={() => setIsOpen(false)} className="p-1 hover:bg-white/20 rounded" aria-label="Close chat">
            <X className="w-5 h-5" />
          </button>
        </div>
      </div>

      {/* Chat Area */}
      <div className="flex-1 overflow-y-auto p-4 space-y-4 bg-slate-50 relative">
        {messages.map(msg => (
          <div key={msg.id} className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}>
            <div 
              className={`max-w-[85%] rounded-2xl px-4 py-2 text-sm ${
                msg.role === 'user' 
                  ? 'bg-blue-600 text-white rounded-br-none' 
                  : 'bg-white border border-slate-200 text-slate-800 rounded-bl-none shadow-sm'
              }`}
              style={msg.role === 'user' ? { backgroundColor: config?.themeColor || '#2563eb' } : {}}
            >
              {msg.content}
            </div>
          </div>
        ))}
        {isLoading && (
          <div className="flex justify-start">
             <div className="bg-white border border-slate-200 rounded-2xl rounded-bl-none px-4 py-3 shadow-sm flex gap-1 items-center">
                <span className="w-2 h-2 bg-slate-400 rounded-full animate-bounce"></span>
                <span className="w-2 h-2 bg-slate-400 rounded-full animate-bounce delay-75"></span>
                <span className="w-2 h-2 bg-slate-400 rounded-full animate-bounce delay-150"></span>
             </div>
          </div>
        )}
        <div ref={messagesEndRef} />
      </div>

      {/* Error Bar */}
      {error && (
        <div className="bg-red-50 p-2 text-center text-xs text-red-600 border-t border-red-100">
          {error}
        </div>
      )}

      {/* Input Area */}
      <form onSubmit={handleSend} className="p-3 bg-white border-t border-slate-200 flex gap-2">
        <input 
          type="text" 
          value={inputValue}
          onChange={(e) => setInputValue(e.target.value)}
          placeholder="Type your message..."
          className="flex-1 bg-slate-100 border-transparent focus:bg-white focus:border-blue-500 rounded-full px-4 py-2 text-sm outline-none transition-all"
          disabled={isLoading}
        />
        <button 
          type="submit" 
          disabled={!inputValue.trim() || isLoading}
          className="bg-blue-600 text-white p-2 rounded-full disabled:opacity-50 hover:bg-blue-700 transition-colors flex items-center justify-center w-10 h-10 flex-shrink-0"
          style={{ backgroundColor: inputValue.trim() ? (config?.themeColor || '#2563eb') : '#94a3b8' }}
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

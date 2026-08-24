import React from 'react';

export default function ModernTemplate({ content, theme }: { content: Record<string, string>, theme: Record<string, string> }) {
  const color = theme?.primary_color || '#2563eb';
  return (
    <div className="font-sans antialiased text-slate-800 bg-slate-50 min-h-screen">
      <header className="px-8 py-6 flex justify-between items-center bg-white shadow-sm">
        <h1 className="text-2xl font-bold" style={{ color }}>{content?.clinicName || 'My Dental Clinic'}</h1>
        <nav className="space-x-4 hidden md:block">
          <a href="#services" className="hover:text-blue-600 transition">Services</a>
          <a href="#team" className="hover:text-blue-600 transition">Our Team</a>
        </nav>
      </header>

      <section className="py-20 px-8 text-center bg-white">
        <h2 className="text-5xl font-extrabold tracking-tight text-slate-900 mb-6">Modern Dental Care</h2>
        <p className="max-w-2xl mx-auto text-xl text-slate-600 mb-10">
          {content?.description || 'Providing exceptional dental services for the whole family in a state-of-the-art facility.'}
        </p>
      </section>

      <section id="services" className="py-16 px-8 max-w-5xl mx-auto">
        <h3 className="text-3xl font-bold mb-8 text-center">Our Services</h3>
        <div className="bg-white p-8 rounded-2xl shadow-sm border border-slate-100">
          <p className="whitespace-pre-wrap">{content?.services || 'General Dentistry\nTeeth Whitening\nImplants'}</p>
        </div>
      </section>
      
      {/* Required Chatbot Anchor for testing */}
      <div id="dentalai-chat-trigger" className="hidden"></div>
    </div>
  );
}

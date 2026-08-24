import React from 'react';

export default function ClassicTemplate({ content, theme }: { content: Record<string, string>, theme: Record<string, string> }) {
  const color = theme?.primary_color || '#1e3a8a';
  return (
    <div className="font-serif antialiased text-stone-800 bg-[#f9f8f6] min-h-screen">
      <header className="px-10 py-8 border-b-4" style={{ borderColor: color, backgroundColor: '#ffffff' }}>
        <h1 className="text-3xl font-bold uppercase tracking-widest text-center" style={{ color }}>
          {content?.clinicName || 'Classic Dental Care'}
        </h1>
      </header>

      <div className="max-w-4xl mx-auto py-12 px-6">
        <section className="text-center mb-16">
          <h2 className="text-4xl italic mb-6">A Tradition of Excellence</h2>
          <p className="text-lg leading-relaxed text-stone-600">
            {content?.description || 'Serving our community with trusted, compassionate dental care for decades.'}
          </p>
        </section>

        <section id="services" className="mb-12">
          <h3 className="text-2xl font-bold uppercase border-b-2 mb-4 pb-2" style={{ borderColor: color }}>
            Treatments & Services
          </h3>
          <div className="p-6 bg-white border border-stone-200">
            <p className="whitespace-pre-wrap">{content?.services || 'Comprehensive Exams\nRestorative Dentistry\nCosmetic Dentistry'}</p>
          </div>
        </section>
      </div>
    </div>
  );
}

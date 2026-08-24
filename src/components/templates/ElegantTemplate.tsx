import React from 'react';

export default function ElegantTemplate({ content, theme }: { content: Record<string, string>, theme: Record<string, string> }) {
  const color = theme?.primary_color || '#d4af37'; // Gold
  return (
    <div className="font-sans antialiased text-gray-200 bg-gray-900 min-h-screen">
      <header className="px-12 py-8 flex justify-between items-center border-b border-gray-800">
        <h1 className="text-2xl font-light tracking-[0.2em]" style={{ color }}>
          {content?.clinicName || 'ELEGANT SMILES'}
        </h1>
      </header>

      <main className="max-w-5xl mx-auto py-24 px-8">
        <section className="text-center space-y-8 mb-24">
          <h2 className="text-5xl font-light tracking-wide text-white">The Art of Dentistry</h2>
          <div className="w-24 h-px mx-auto" style={{ backgroundColor: color }}></div>
          <p className="max-w-2xl mx-auto text-lg text-gray-400 font-light leading-relaxed">
            {content?.description || 'Experience bespoke dental treatments in a serene, luxurious environment.'}
          </p>
        </section>

        <section id="services" className="grid md:grid-cols-2 gap-12">
          <div>
            <h3 className="text-xl tracking-widest uppercase mb-6" style={{ color }}>Premium Services</h3>
            <div className="p-8 bg-gray-800 rounded-sm">
              <p className="whitespace-pre-wrap font-light leading-loose">{content?.services || 'Veneers\nInvisalign\nSmile Makeovers'}</p>
            </div>
          </div>
        </section>
      </main>
    </div>
  );
}

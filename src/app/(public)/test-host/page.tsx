'use client';

import Script from 'next/script';

export default function TestHostPage() {
  return (
    <div className="min-h-screen bg-amber-50">
      {/* Intentionally awful CSS to test isolation */}
      <style>{`
        body { font-family: 'Comic Sans MS', cursive, sans-serif; }
        div { border: 2px dashed red; margin: 10px; padding: 10px; }
        button { background: purple !important; color: yellow !important; font-size: 24px !important; }
        iframe { border: 10px solid green !important; } /* The widget js explicitly sets iframe inline styles to override this */
      `}</style>
      
      <div className="max-w-2xl mx-auto mt-20 p-8 bg-white shadow-xl">
        <h1 className="text-4xl font-bold mb-4">Sample Dentist Website</h1>
        <p className="mb-4 text-xl">
          This is a simulated external website. It has terrible CSS conflicts injected (like targeting all divs, buttons, and iframes) to prove the widget&apos;s isolation.
        </p>
        <button onClick={() => alert('Host website button clicked')}>Host Button</button>
        
        <p className="mt-8">
          The widget should appear in the bottom right corner automatically.
        </p>
      </div>

      {/* Widget Snippet */}
      <Script 
        src="/widget.js" 
        strategy="lazyOnload" 
        data-widget-id="test-clinic-123"
      />
    </div>
  );
}

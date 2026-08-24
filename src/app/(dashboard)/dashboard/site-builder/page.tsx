'use client';

import React, { useState, useTransition } from 'react';
import { saveSiteBuilderData, setSiteStatus } from '@/app/actions/site-builder';

export default function SiteBuilder() {
  const clinicId = 'mock-clinic-id'; // In a real app, this comes from user context
  const [isPending, startTransition] = useTransition();
  const [status, setStatus] = useState<'draft' | 'published'>('draft');
  const [message, setMessage] = useState('');
  
  const [template, setTemplate] = useState('modern');
  const [color, setColor] = useState('#2563eb');
  
  const handleSave = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setMessage('');
    const formData = new FormData(e.currentTarget);
    const data = {
      template_id: template,
      content: {
        description: formData.get('description') as string,
        services: formData.get('services') as string,
        dentists: formData.get('dentists') as string,
        hours: formData.get('hours') as string,
      },
      theme_settings: {
        primary_color: color,
      }
    };

    startTransition(async () => {
      const res = await saveSiteBuilderData(clinicId, data);
      if (res.success) {
        setMessage('Draft saved successfully!');
      } else {
        setMessage('Error saving draft: ' + res.error);
      }
    });
  };

  const handleTogglePublish = () => {
    const newStatus = status === 'draft' ? 'published' : 'draft';
    startTransition(async () => {
      const res = await setSiteStatus(clinicId, newStatus);
      if (res.success) {
        setStatus(newStatus);
        setMessage(`Site ${newStatus === 'published' ? 'published to live URL!' : 'unpublished and hidden.'}`);
      }
    });
  };

  return (
    <div className="max-w-5xl mx-auto">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-bold text-slate-900">Website Builder</h1>
        <div className="flex gap-3 items-center">
          <span className={`text-sm font-medium px-3 py-1 rounded-full ${status === 'published' ? 'bg-green-100 text-green-700' : 'bg-amber-100 text-amber-700'}`}>
            {status === 'published' ? 'Live' : 'Draft'}
          </span>
          <a 
            href={`/site/${clinicId}?preview=true`} 
            target="_blank" 
            rel="noopener noreferrer"
            className="text-blue-600 hover:underline text-sm font-medium"
          >
            Preview Site ↗
          </a>
          <button 
            onClick={handleTogglePublish}
            disabled={isPending}
            className="bg-slate-900 text-white px-4 py-2 rounded text-sm hover:bg-slate-800 disabled:opacity-50"
          >
            {status === 'draft' ? 'Publish Site' : 'Unpublish Site'}
          </button>
        </div>
      </div>

      {message && (
        <div className="mb-4 p-3 bg-blue-50 text-blue-700 rounded border border-blue-100">
          {message}
        </div>
      )}

      <form onSubmit={handleSave} className="grid md:grid-cols-3 gap-6">
        <div className="md:col-span-2 space-y-6">
          <div className="bg-white p-6 rounded-lg shadow-sm border">
            <h2 className="font-semibold mb-4 text-lg">Website Content</h2>
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium mb-1">Clinic Description</label>
                <textarea name="description" rows={3} className="w-full border p-2 rounded" placeholder="Welcome to our clinic..." defaultValue="Providing exceptional dental services." />
              </div>
              <div>
                <label className="block text-sm font-medium mb-1">Services</label>
                <textarea name="services" rows={3} className="w-full border p-2 rounded" placeholder="General Dentistry, Whitening..." defaultValue={"General Dentistry\nTeeth Whitening"} />
              </div>
              <div>
                <label className="block text-sm font-medium mb-1">Our Dentists</label>
                <textarea name="dentists" rows={2} className="w-full border p-2 rounded" placeholder="Dr. Smith, Dr. Jones..." />
              </div>
              <div>
                <label className="block text-sm font-medium mb-1">Opening Hours</label>
                <input name="hours" type="text" className="w-full border p-2 rounded" placeholder="Mon-Fri 9am-5pm" />
              </div>
            </div>
          </div>
          
          <button 
            type="submit" 
            disabled={isPending}
            className="bg-blue-600 text-white px-6 py-3 rounded font-medium hover:bg-blue-700 disabled:opacity-50"
          >
            {isPending ? 'Saving...' : 'Save Draft'}
          </button>
        </div>

        <div className="space-y-6">
          <div className="bg-white p-6 rounded-lg shadow-sm border">
            <h2 className="font-semibold mb-4 text-lg">Appearance</h2>
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium mb-2">Template</label>
                <select 
                  value={template} 
                  onChange={(e) => setTemplate(e.target.value)}
                  className="w-full border p-2 rounded"
                >
                  <option value="modern">Modern</option>
                  <option value="classic">Classic</option>
                  <option value="elegant">Elegant</option>
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium mb-2">Primary Color</label>
                <div className="flex items-center gap-3">
                  <input 
                    type="color" 
                    value={color} 
                    onChange={(e) => setColor(e.target.value)}
                    className="w-10 h-10 p-0 border-0 rounded cursor-pointer"
                  />
                  <span className="text-slate-600 uppercase text-sm font-mono">{color}</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </form>
    </div>
  );
}

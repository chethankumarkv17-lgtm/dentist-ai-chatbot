'use client';

import React, { useState, useTransition } from 'react';
import { saveSiteBuilderData, setSiteStatus } from '@/app/actions/site-builder';
import {
  Globe,
  Palette,
  Layout,
  Eye,
  Check,
  Smartphone,
  Tablet,
  Monitor,
  ExternalLink,
  Sparkles,
  Save,
  Send,
} from 'lucide-react';
import { Badge } from '@/components/ui/Badge';

export default function SiteBuilder() {
  const clinicId = 'mock-clinic-id';
  const [isPending, startTransition] = useTransition();
  const [status, setStatus] = useState<'draft' | 'published'>('draft');
  const [message, setMessage] = useState('');
  const [viewDevice, setViewDevice] = useState<'desktop' | 'tablet' | 'mobile'>('desktop');
  const [activeTab, setActiveTab] = useState<'content' | 'branding' | 'sections'>('content');

  const [template, setTemplate] = useState('modern');
  const [primaryColor, setPrimaryColor] = useState('#2563eb');
  const [clinicName, setClinicName] = useState('Apex Dental & Implant Centre');
  const [tagline, setTagline] = useState('Compassionate, modern dental care in Bangalore');
  const [phone, setPhone] = useState('+91 80 4719 2831');
  const [address, setAddress] = useState('12th Main, Indiranagar, Bangalore, Karnataka');

  const handleSave = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setMessage('');
    const formData = new FormData(e.currentTarget);
    const data = {
      template_id: template,
      content: {
        clinic_name: clinicName,
        description: formData.get('description') as string,
        services: formData.get('services') as string,
        dentists: formData.get('dentists') as string,
        hours: formData.get('hours') as string,
        phone,
        address,
      },
      theme_settings: {
        primary_color: primaryColor,
      },
    };

    startTransition(async () => {
      const res = await saveSiteBuilderData(clinicId, data);
      if (res.success) {
        setMessage('Website saved successfully!');
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
        setMessage(
          `Site ${newStatus === 'published' ? 'published with automatic SSL certificate!' : 'unpublished.'}`
        );
      }
    });
  };

  return (
    <div className="space-y-6 animate-fade-in">
      {/* Top Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-900 tracking-tight">Website Builder</h1>
            <Badge variant={status === 'published' ? 'success' : 'warning'} size="sm">
              {status.toUpperCase()}
            </Badge>
          </div>
          <p className="text-xs sm:text-sm text-slate-500 mt-1">
            Custom drag-and-drop clinic microsite with automatic SSL and integrated AI booking.
          </p>
        </div>

        <div className="flex items-center gap-2.5">
          <a
            href={`/site/${clinicId}?preview=true`}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl border border-slate-200 bg-white hover:bg-slate-50 text-slate-700 text-xs font-bold transition-all shadow-2xs"
          >
            <span>Live Site</span>
            <ExternalLink className="w-3.5 h-3.5" />
          </a>
          <button
            onClick={handleTogglePublish}
            disabled={isPending}
            className={`inline-flex items-center gap-1.5 px-4 py-2 rounded-xl text-xs font-bold text-white transition-all shadow-sm ${
              status === 'draft'
                ? 'bg-blue-600 hover:bg-blue-700 shadow-blue-500/20'
                : 'bg-slate-800 hover:bg-slate-900'
            }`}
          >
            <Send className="w-3.5 h-3.5" />
            <span>{status === 'draft' ? 'Publish Microsite' : 'Unpublish'}</span>
          </button>
        </div>
      </div>

      {message && (
        <div className="p-3.5 bg-blue-50 border border-blue-200 text-blue-800 text-xs font-semibold rounded-xl flex items-center gap-2">
          <Sparkles className="w-4 h-4 text-blue-600 shrink-0" />
          <span>{message}</span>
        </div>
      )}

      {/* Dual Pane Layout (Controls Left, Live Responsive Preview Right) */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        {/* Left Pane: Controls (5 Cols) */}
        <div className="lg:col-span-5 bg-white rounded-2xl border border-slate-200/80 shadow-xs p-6 space-y-6">
          {/* Tabs */}
          <div className="flex rounded-xl bg-slate-100 p-1">
            {(['content', 'branding', 'sections'] as const).map((tab) => (
              <button
                key={tab}
                onClick={() => setActiveTab(tab)}
                className={`flex-1 py-1.5 rounded-lg text-xs font-bold capitalize transition-all ${
                  activeTab === tab
                    ? 'bg-white text-slate-900 shadow-xs'
                    : 'text-slate-500 hover:text-slate-900'
                }`}
              >
                {tab}
              </button>
            ))}
          </div>

          <form onSubmit={handleSave} className="space-y-4">
            {activeTab === 'content' && (
              <div className="space-y-4 text-xs">
                <div>
                  <label className="block font-bold text-slate-700 mb-1">Clinic Name</label>
                  <input
                    type="text"
                    value={clinicName}
                    onChange={(e) => setClinicName(e.target.value)}
                    className="w-full px-3 py-2 rounded-lg border border-slate-200 focus:outline-none focus:ring-2 focus:ring-blue-600"
                  />
                </div>

                <div>
                  <label className="block font-bold text-slate-700 mb-1">Tagline</label>
                  <input
                    type="text"
                    value={tagline}
                    onChange={(e) => setTagline(e.target.value)}
                    className="w-full px-3 py-2 rounded-lg border border-slate-200 focus:outline-none focus:ring-2 focus:ring-blue-600"
                  />
                </div>

                <div>
                  <label className="block font-bold text-slate-700 mb-1">Description</label>
                  <textarea
                    name="description"
                    rows={3}
                    defaultValue="Providing world-class painless dentistry, dental implants, and smile makeovers with state-of-the-art technology."
                    className="w-full px-3 py-2 rounded-lg border border-slate-200 focus:outline-none focus:ring-2 focus:ring-blue-600"
                  />
                </div>

                <div>
                  <label className="block font-bold text-slate-700 mb-1">Services List</label>
                  <textarea
                    name="services"
                    rows={2}
                    defaultValue={"Teeth Whitening, Dental Implants, Root Canal, Orthodontics"}
                    className="w-full px-3 py-2 rounded-lg border border-slate-200 focus:outline-none focus:ring-2 focus:ring-blue-600"
                  />
                </div>

                <div>
                  <label className="block font-bold text-slate-700 mb-1">Hours</label>
                  <input
                    type="text"
                    name="hours"
                    defaultValue="Mon - Sat: 9:00 AM - 7:00 PM"
                    className="w-full px-3 py-2 rounded-lg border border-slate-200 focus:outline-none focus:ring-2 focus:ring-blue-600"
                  />
                </div>
              </div>
            )}

            {activeTab === 'branding' && (
              <div className="space-y-4 text-xs">
                <div>
                  <label className="block font-bold text-slate-700 mb-1.5">Primary Accent Color</label>
                  <div className="flex items-center gap-3">
                    <input
                      type="color"
                      value={primaryColor}
                      onChange={(e) => setPrimaryColor(e.target.value)}
                      className="w-10 h-10 rounded-lg cursor-pointer border-0 p-0"
                    />
                    <span className="font-mono text-slate-600 font-bold">{primaryColor}</span>
                  </div>
                </div>

                <div>
                  <label className="block font-bold text-slate-700 mb-1.5">Website Layout Template</label>
                  <div className="grid grid-cols-2 gap-2">
                    {['modern', 'minimal', 'classic', 'luxury'].map((t) => (
                      <button
                        type="button"
                        key={t}
                        onClick={() => setTemplate(t)}
                        className={`p-3 rounded-xl border text-left font-bold capitalize transition-all ${
                          template === t
                            ? 'border-blue-600 bg-blue-50/50 text-blue-700'
                            : 'border-slate-200 text-slate-700 hover:bg-slate-50'
                        }`}
                      >
                        {t}
                      </button>
                    ))}
                  </div>
                </div>
              </div>
            )}

            {activeTab === 'sections' && (
              <div className="space-y-2 text-xs">
                <p className="text-slate-500">Enable or disable website sections:</p>
                {['Hero & AI Booking', 'Services & Prices', 'Meet the Dentists', 'Patient Reviews', 'Clinic Location & Map'].map(
                  (sec) => (
                    <div key={sec} className="flex items-center justify-between p-3 rounded-xl border border-slate-100 bg-slate-50">
                      <span className="font-bold text-slate-800">{sec}</span>
                      <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-emerald-100 text-emerald-800">
                        Visible
                      </span>
                    </div>
                  )
                )}
              </div>
            )}

            <button
              type="submit"
              disabled={isPending}
              className="w-full inline-flex items-center justify-center gap-2 py-2.5 rounded-xl bg-slate-900 hover:bg-slate-800 text-white font-bold text-xs transition-all shadow-sm touch-target"
            >
              <Save className="w-4 h-4" />
              <span>Save Website Changes</span>
            </button>
          </form>
        </div>

        {/* Right Pane: Live Device Preview (7 Cols) */}
        <div className="lg:col-span-7 space-y-3">
          {/* Viewport Selector */}
          <div className="flex items-center justify-between bg-white px-4 py-2.5 rounded-xl border border-slate-200/80 shadow-xs">
            <span className="text-xs font-bold text-slate-600">Responsive Live Preview</span>
            <div className="flex items-center gap-1 bg-slate-100 p-0.5 rounded-lg">
              <button
                type="button"
                onClick={() => setViewDevice('desktop')}
                className={`p-1.5 rounded-md text-xs font-semibold flex items-center gap-1 transition-colors ${
                  viewDevice === 'desktop' ? 'bg-white text-blue-600 shadow-2xs' : 'text-slate-500'
                }`}
                title="Desktop View"
              >
                <Monitor className="w-3.5 h-3.5" />
              </button>
              <button
                type="button"
                onClick={() => setViewDevice('tablet')}
                className={`p-1.5 rounded-md text-xs font-semibold flex items-center gap-1 transition-colors ${
                  viewDevice === 'tablet' ? 'bg-white text-blue-600 shadow-2xs' : 'text-slate-500'
                }`}
                title="Tablet View"
              >
                <Tablet className="w-3.5 h-3.5" />
              </button>
              <button
                type="button"
                onClick={() => setViewDevice('mobile')}
                className={`p-1.5 rounded-md text-xs font-semibold flex items-center gap-1 transition-colors ${
                  viewDevice === 'mobile' ? 'bg-white text-blue-600 shadow-2xs' : 'text-slate-500'
                }`}
                title="Mobile View"
              >
                <Smartphone className="w-3.5 h-3.5" />
              </button>
            </div>
          </div>

          {/* Interactive Simulated Preview Container */}
          <div className="flex justify-center bg-slate-200/60 p-4 rounded-2xl border border-slate-300/60 min-h-[460px] overflow-hidden">
            <div
              className={`bg-white rounded-2xl shadow-xl border border-slate-200 overflow-hidden transition-all duration-300 flex flex-col ${
                viewDevice === 'desktop'
                  ? 'w-full'
                  : viewDevice === 'tablet'
                  ? 'w-[520px]'
                  : 'w-[320px]'
              }`}
            >
              {/* Browser Mockup Bar */}
              <div className="bg-slate-100 border-b border-slate-200 px-3 py-2 flex items-center gap-2">
                <div className="flex items-center gap-1">
                  <span className="w-2 h-2 rounded-full bg-red-400" />
                  <span className="w-2 h-2 rounded-full bg-amber-400" />
                  <span className="w-2 h-2 rounded-full bg-green-400" />
                </div>
                <div className="flex-1 bg-white px-2 py-0.5 rounded text-[10px] text-slate-500 font-mono text-center truncate">
                  https://apexdental.radiantnobel.com
                </div>
              </div>

              {/* Rendered Microsite Hero Preview */}
              <div className="p-6 text-center space-y-4 my-auto">
                <span
                  style={{ backgroundColor: `${primaryColor}15`, color: primaryColor }}
                  className="inline-block text-[10px] font-extrabold px-2.5 py-1 rounded-full uppercase tracking-wider"
                >
                  Premier Dental Care
                </span>
                <h2 className="text-xl sm:text-2xl font-black text-slate-900 tracking-tight">
                  {clinicName}
                </h2>
                <p className="text-xs text-slate-600 max-w-sm mx-auto">{tagline}</p>
                <div className="pt-2">
                  <button
                    type="button"
                    style={{ backgroundColor: primaryColor }}
                    className="px-5 py-2.5 rounded-xl text-white text-xs font-bold shadow-md"
                  >
                    Book Appointment Online
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

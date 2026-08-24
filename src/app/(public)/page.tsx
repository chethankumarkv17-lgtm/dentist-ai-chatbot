import React from 'react';
import Link from 'next/link';
import {
  Stethoscope,
  Sparkles,
  ArrowRight,
  ShieldCheck,
  Phone,
  MessageSquare,
  Globe,
  Calendar,
  Clock,
  CheckCircle2,
  Zap,
  Bot,
  Users,
  ChevronRight,
  Star,
} from 'lucide-react';
import { Badge } from '@/components/ui/Badge';
import { Card } from '@/components/ui/Card';

export default function LandingPage() {
  const channelCards = [
    {
      title: '24/7 Web Chatbot Widget',
      tag: 'Included All Plans',
      icon: MessageSquare,
      color: 'text-blue-600 bg-blue-50 border-blue-100',
      description: 'Embeds into WordPress, Webflow, Squarespace, or custom HTML in 60 seconds with zero coding.',
      highlights: ['Natural language Q&A', 'Real-time slot availability', 'Instant calendar sync'],
    },
    {
      title: 'Official WhatsApp Business',
      tag: 'Growth & Pro',
      icon: Globe,
      color: 'text-green-600 bg-green-50 border-green-100',
      description: 'Engage patients on India’s #1 messaging platform with autonomous booking and automated 24h/2h reminders.',
      highlights: ['Meta Cloud API verified', '24h/2h reminder templates', 'Human staff takeover'],
    },
    {
      title: 'AI Voice Phone Receptionist',
      tag: 'Pro Enterprise',
      icon: Phone,
      color: 'text-purple-600 bg-purple-50 border-purple-100',
      description: 'Answers phone calls in under 2 rings with natural conversational speech, schedule verification, and front desk bridging.',
      highlights: ['500 mins/mo included', 'Zero double-booking', 'Emergency medical transfer'],
    },
  ];

  const features = [
    {
      icon: Bot,
      title: 'Healthcare AI Guardrails',
      desc: 'Strict non-diagnostic boundaries prevent medical hallucination, enforce pricing transparency, and protect clinical compliance.',
    },
    {
      icon: Calendar,
      title: 'Deterministic Availability Engine',
      desc: 'Direct two-way PostgreSQL transaction locking prevents double-booking across Google Calendar and Microsoft Outlook.',
    },
    {
      icon: ShieldCheck,
      title: 'Enterprise Multi-Tenancy & RLS',
      desc: 'Row-Level Security guarantees Clinic A can never access or view Clinic B records, patient data, or AI configurations.',
    },
    {
      icon: Zap,
      title: 'Instant Drag & Drop Site Builder',
      desc: 'Launch a high-converting clinic microsite in minutes with automatic SSL, SEO optimization, and custom domain mapping.',
    },
  ];

  const faqs = [
    {
      q: 'How does the AI prevent double bookings across different channels?',
      a: 'All 3 channels (Website Widget, WhatsApp, and Voice Phone) route through a single centralized availability engine with serializable database transactions and real-time calendar syncing.',
    },
    {
      q: 'Can the AI Voice Receptionist transfer urgent calls to human staff?',
      a: 'Yes. The voice agent recognizes emergency symptoms and patient transfer requests, bridging the call immediately to your front desk or emergency clinic phone.',
    },
    {
      q: 'Does it support Indian payment methods and UPI?',
      a: 'Yes. Radiant Nobel integrates Razorpay with full support for UPI Intent (GPay, PhonePe, Paytm), Dynamic QR codes, Netbanking, and recurring e-mandates.',
    },
    {
      q: 'Is our patient booking data secure and HIPAA-compliant?',
      a: 'Yes. All data is isolated by tenant with PostgreSQL Row-Level Security, end-to-end encryption in transit, and strict data retention controls.',
    },
  ];

  return (
    <div className="space-y-24 sm:space-y-32 pb-20">
      {/* 1. HERO SECTION */}
      <section className="relative overflow-hidden pt-12 sm:pt-20 pb-16 bg-gradient-to-b from-slate-50 via-white to-slate-50 border-b border-slate-100">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center space-y-8">
          <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-blue-50 border border-blue-200/80 text-blue-700 text-xs font-bold shadow-2xs animate-fade-in">
            <Sparkles className="w-4 h-4 text-blue-600" />
            <span>The Omnichannel Dental AI Suite • Website, WhatsApp & Voice</span>
          </div>

          <h1 className="text-4xl sm:text-6xl lg:text-7xl font-extrabold text-slate-900 tracking-tight max-w-4xl mx-auto leading-[1.1] animate-fade-in">
            Autonomous <span className="text-blue-600">24/7 AI Receptionist</span> for Dental Practices
          </h1>

          <p className="text-base sm:text-xl text-slate-600 max-w-2xl mx-auto leading-relaxed animate-fade-in">
            Never miss a patient call or inquiry again. Automate appointment bookings, verify dentist availability in real-time, and send automated WhatsApp reminders with zero double bookings.
          </p>

          {/* Action CTAs */}
          <div className="flex flex-col sm:flex-row items-center justify-center gap-3.5 pt-2 animate-fade-in">
            <Link
              href="/signup"
              className="w-full sm:w-auto inline-flex items-center justify-center gap-2 px-8 py-4 rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-bold text-base shadow-lg shadow-blue-500/25 hover:shadow-xl hover:shadow-blue-500/30 transition-all group touch-target"
            >
              <span>Start 14-Day Free Trial</span>
              <ArrowRight className="w-5 h-5 group-hover:translate-x-1 transition-transform" />
            </Link>
            <Link
              href="/login"
              className="w-full sm:w-auto inline-flex items-center justify-center px-8 py-4 rounded-xl bg-white hover:bg-slate-50 text-slate-800 font-bold text-base border border-slate-200 shadow-2xs hover:border-slate-300 transition-all touch-target"
            >
              Enter Interactive Demo
            </Link>
          </div>

          {/* Trust Badges */}
          <div className="pt-8 flex flex-wrap items-center justify-center gap-6 sm:gap-10 text-xs font-semibold text-slate-500">
            <div className="flex items-center gap-1.5">
              <CheckCircle2 className="w-4 h-4 text-emerald-600" />
              <span>Zero Double-Booking Guarantee</span>
            </div>
            <div className="flex items-center gap-1.5">
              <CheckCircle2 className="w-4 h-4 text-emerald-600" />
              <span>Razorpay UPI & e-Mandate Ready</span>
            </div>
            <div className="flex items-center gap-1.5">
              <CheckCircle2 className="w-4 h-4 text-emerald-600" />
              <span>24/7 Inbound Voice & WhatsApp</span>
            </div>
          </div>
        </div>
      </section>

      {/* 2. OMNICHANNEL CHANNELS */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center max-w-3xl mx-auto space-y-4 mb-16">
          <Badge variant="pro" size="md">Unified Omnichannel AI</Badge>
          <h2 className="text-3xl sm:text-4xl font-extrabold text-slate-900 tracking-tight">
            One Core Brain. Three Seamless Patient Channels.
          </h2>
          <p className="text-slate-600 text-base">
            Patients connect from their preferred communication channel. The unified AI orchestrator handles scheduling with single-source database truth.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          {channelCards.map((ch) => {
            const Icon = ch.icon;
            return (
              <Card key={ch.title} className="p-6 sm:p-8 flex flex-col justify-between" hoverable>
                <div>
                  <div className="flex items-center justify-between mb-4">
                    <div className={`w-12 h-12 rounded-2xl border flex items-center justify-center ${ch.color}`}>
                      <Icon className="w-6 h-6" />
                    </div>
                    <span className="text-[11px] font-bold px-2.5 py-1 rounded-full bg-slate-100 text-slate-700">
                      {ch.tag}
                    </span>
                  </div>

                  <h3 className="text-xl font-bold text-slate-900 mb-2">{ch.title}</h3>
                  <p className="text-slate-600 text-sm leading-relaxed mb-6">{ch.description}</p>
                </div>

                <div className="space-y-2.5 pt-4 border-t border-slate-100">
                  {ch.highlights.map((item) => (
                    <div key={item} className="flex items-center gap-2 text-xs font-semibold text-slate-700">
                      <CheckCircle2 className="w-3.5 h-3.5 text-blue-600 shrink-0" />
                      <span>{item}</span>
                    </div>
                  ))}
                </div>
              </Card>
            );
          })}
        </div>
      </section>

      {/* 3. CORE ARCHITECTURAL PILLARS */}
      <section className="bg-slate-900 text-white py-20 rounded-3xl mx-4 sm:mx-6 lg:mx-8 px-6 sm:px-12">
        <div className="max-w-7xl mx-auto">
          <div className="text-center max-w-3xl mx-auto space-y-4 mb-16">
            <span className="text-xs font-bold uppercase tracking-wider text-blue-400">Enterprise Engineering</span>
            <h2 className="text-3xl sm:text-4xl font-extrabold text-white tracking-tight">
              Engineered Specifically for High-Trust Healthcare
            </h2>
            <p className="text-slate-400 text-sm sm:text-base">
              Built with zero-trust tenant isolation, deterministic availability, and strict medical guardrails.
            </p>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
            {features.map((feat) => {
              const Icon = feat.icon;
              return (
                <div
                  key={feat.title}
                  className="bg-slate-800/80 rounded-2xl p-6 border border-slate-700/80 space-y-3 hover:border-blue-500/50 transition-colors"
                >
                  <div className="w-10 h-10 rounded-xl bg-blue-600/20 border border-blue-500/30 flex items-center justify-center text-blue-400">
                    <Icon className="w-5 h-5" />
                  </div>
                  <h3 className="font-bold text-base text-white">{feat.title}</h3>
                  <p className="text-xs text-slate-400 leading-relaxed">{feat.desc}</p>
                </div>
              );
            })}
          </div>
        </div>
      </section>

      {/* 4. FREQUENTLY ASKED QUESTIONS */}
      <section className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 space-y-8">
        <div className="text-center space-y-3">
          <Badge variant="neutral">Clear Answers</Badge>
          <h2 className="text-3xl font-extrabold text-slate-900">Frequently Asked Questions</h2>
        </div>

        <div className="space-y-4">
          {faqs.map((faq) => (
            <Card key={faq.q} className="p-6">
              <h3 className="font-bold text-base text-slate-900 mb-2">{faq.q}</h3>
              <p className="text-slate-600 text-sm leading-relaxed">{faq.a}</p>
            </Card>
          ))}
        </div>
      </section>

      {/* 5. BOTTOM CTA BANNER */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="bg-gradient-to-r from-blue-600 to-indigo-700 rounded-3xl p-8 sm:p-14 text-center text-white shadow-xl shadow-blue-500/20 space-y-6">
          <h2 className="text-3xl sm:text-5xl font-extrabold tracking-tight max-w-2xl mx-auto">
            Ready to Automate Inbound Dental Scheduling?
          </h2>
          <p className="text-blue-100 text-base sm:text-lg max-w-xl mx-auto leading-relaxed">
            Join hundreds of modern clinics saving 15+ hours every week on front-desk call handling and appointment scheduling.
          </p>
          <div className="pt-2">
            <Link
              href="/signup"
              className="inline-flex items-center justify-center gap-2 px-8 py-4 rounded-xl bg-white hover:bg-slate-100 text-blue-700 font-extrabold text-base shadow-lg transition-all touch-target"
            >
              <span>Get Started Free — 14-Day Trial</span>
              <ArrowRight className="w-5 h-5" />
            </Link>
          </div>
        </div>
      </section>
    </div>
  );
}

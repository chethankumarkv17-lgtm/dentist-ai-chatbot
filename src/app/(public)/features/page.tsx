import React from 'react';
import Link from 'next/link';
import {
  Bot,
  Calendar,
  MessageSquare,
  Phone,
  Globe,
  ShieldCheck,
  Zap,
  Clock,
  Sparkles,
  ArrowRight,
  CheckCircle2,
} from 'lucide-react';
import { Badge } from '@/components/ui/Badge';
import { Card } from '@/components/ui/Card';
import { RevealOnScroll } from '@/components/ui/RevealOnScroll';

export default function FeaturesPage() {
  const featureSections = [
    {
      title: '24/7 AI Receptionist & Chatbot Widget',
      subtitle: 'Autonomous booking and clinic inquiries around the clock',
      icon: MessageSquare,
      color: 'bg-blue-50 text-blue-600 border-blue-100',
      points: [
        'Embeds easily on WordPress, Webflow, Squarespace, or custom HTML',
        'Answers clinic hours, dentist credentials, and treatment pricing',
        'Verifies patient intent and schedules appointments directly into the database',
        'Strict healthcare guardrails: Never hallucinates medical diagnoses or drug prescriptions',
      ],
    },
    {
      title: 'Official WhatsApp Business Cloud API',
      subtitle: 'India’s most trusted patient communication channel',
      icon: Globe,
      color: 'bg-green-50 text-green-600 border-green-100',
      points: [
        'Autonomous conversational booking via official WhatsApp Business number',
        'Automated 24-hour and 2-hour pre-appointment reminder templates',
        'Intelligent human handoff with instant staff takeover capabilities',
        'Multi-lingual support with bilingual English and Hindi comprehension',
      ],
    },
    {
      title: '24/7 AI Voice Phone Receptionist',
      subtitle: 'Answers clinic calls in under 2 rings with natural speech',
      icon: Phone,
      color: 'bg-purple-50 text-purple-600 border-purple-100',
      points: [
        '500 minutes per month included on the Pro Enterprise plan',
        'Natural speech synthesis powered by Amazon Polly and Anthropic Claude',
        'Instant caller identity verification before cancellations or rescheduling',
        'Emergency medical escalation with immediate bridge to front desk phone',
      ],
    },
    {
      title: 'Deterministic Availability & Calendar Sync',
      subtitle: 'Zero double-booking guarantee across all channels',
      icon: Calendar,
      color: 'bg-amber-50 text-amber-600 border-amber-100',
      points: [
        'PostgreSQL serializable transactions prevent race conditions',
        'Two-way sync with Google Calendar and Microsoft Outlook 365',
        'Custom dentist working hours, buffer times, and holiday overrides',
        'Automated cancellation and rescheduling engine with instant slot release',
      ],
    },
  ];

  return (
    <div className="py-16 sm:py-24 space-y-20 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 overflow-hidden">
      {/* Header */}
      <RevealOnScroll variant="fade-up" durationMs={500}>
        <div className="text-center max-w-3xl mx-auto space-y-4">
          <Badge variant="pro" size="md">Complete Feature Suite</Badge>
          <h1 className="text-4xl sm:text-5xl font-extrabold text-slate-900 tracking-tight">
            Everything You Need to Run an Autonomous Dental Front Desk
          </h1>
          <p className="text-slate-600 text-base sm:text-lg">
            Replace manual scheduling bottlenecks with intelligent 24/7 patient booking across Web, WhatsApp, and Voice.
          </p>
        </div>
      </RevealOnScroll>

      {/* Feature Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
        {featureSections.map((sec, idx) => {
          const Icon = sec.icon;
          return (
            <RevealOnScroll key={sec.title} variant="fade-up" delayMs={idx * 150} durationMs={600}>
              <Card className="p-8 space-y-6 flex flex-col justify-between h-full" hoverable>
                <div className="space-y-4">
                  <div className={`w-12 h-12 rounded-2xl border flex items-center justify-center ${sec.color}`}>
                    <Icon className="w-6 h-6" />
                  </div>
                  <div>
                    <h3 className="text-xl font-bold text-slate-900">{sec.title}</h3>
                    <p className="text-xs text-slate-500 mt-1">{sec.subtitle}</p>
                  </div>

                  <div className="space-y-3 pt-2">
                    {sec.points.map((pt) => (
                      <div key={pt} className="flex items-start gap-2.5 text-xs text-slate-700 font-medium">
                        <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0 mt-0.5" />
                        <span>{pt}</span>
                      </div>
                    ))}
                  </div>
                </div>
              </Card>
            </RevealOnScroll>
          );
        })}
      </div>

      {/* CTA Box */}
      <RevealOnScroll variant="scale-up" durationMs={550}>
        <div className="bg-slate-900 text-white rounded-3xl p-8 sm:p-12 text-center space-y-6">
          <h2 className="text-2xl sm:text-3xl font-bold">Experience the Future of Dental Scheduling</h2>
          <p className="text-slate-400 text-sm max-w-xl mx-auto">
            Start your 14-day free trial today. Connect your calendar and test your AI receptionist in under 5 minutes.
          </p>
          <div className="pt-2">
            <Link
              href="/signup"
              className="inline-flex items-center gap-2 px-8 py-3.5 rounded-xl bg-blue-600 hover:bg-blue-700 text-white text-sm font-bold shadow-lg shadow-blue-500/25 transition-all"
            >
              <span>Start Free Trial</span>
              <ArrowRight className="w-4 h-4" />
            </Link>
          </div>
        </div>
      </RevealOnScroll>
    </div>
  );
}

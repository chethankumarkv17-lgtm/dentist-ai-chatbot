import Link from 'next/link';
import { getHelpArticles } from '@/lib/support/service';
import { BookOpen, ArrowRight, Sparkles, Calendar, Code, CreditCard, LifeBuoy } from 'lucide-react';

export default function HelpCenterPage() {
  const articles = getHelpArticles();

  return (
    <div className="min-h-screen bg-slate-50 py-16 px-4 sm:px-6 lg:px-8">
      <div className="max-w-6xl mx-auto space-y-12">
        {/* Header */}
        <div className="text-center max-w-3xl mx-auto space-y-4">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-sky-100 text-sky-700 text-xs font-semibold uppercase">
            <BookOpen className="w-3.5 h-3.5" />
            Knowledge Base & Guides
          </div>
          <h1 className="text-4xl font-extrabold text-slate-900 tracking-tight">
            How can we help your dental practice?
          </h1>
          <p className="text-slate-600">
            Explore comprehensive documentation on AI receptionist setup, calendar integrations, and billing.
          </p>
        </div>

        {/* Categories Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
          <div className="p-6 bg-white rounded-2xl border border-slate-200 shadow-sm hover:shadow-md transition-all">
            <div className="w-10 h-10 rounded-xl bg-sky-50 text-sky-600 flex items-center justify-center mb-4 font-bold">
              <Sparkles className="w-5 h-5" />
            </div>
            <h3 className="font-bold text-slate-900 mb-1">AI Receptionist</h3>
            <p className="text-xs text-slate-500">Configure prompt tone, FAQs, and services</p>
          </div>

          <div className="p-6 bg-white rounded-2xl border border-slate-200 shadow-sm hover:shadow-md transition-all">
            <div className="w-10 h-10 rounded-xl bg-indigo-50 text-indigo-600 flex items-center justify-center mb-4 font-bold">
              <Calendar className="w-5 h-5" />
            </div>
            <h3 className="font-bold text-slate-900 mb-1">Calendar Sync</h3>
            <p className="text-xs text-slate-500">Google Calendar OAuth & slot conflicts</p>
          </div>

          <div className="p-6 bg-white rounded-2xl border border-slate-200 shadow-sm hover:shadow-md transition-all">
            <div className="w-10 h-10 rounded-xl bg-emerald-50 text-emerald-600 flex items-center justify-center mb-4 font-bold">
              <Code className="w-5 h-5" />
            </div>
            <h3 className="font-bold text-slate-900 mb-1">Widget & Embed</h3>
            <p className="text-xs text-slate-500">HTML embed scripts & WordPress plugin</p>
          </div>

          <div className="p-6 bg-white rounded-2xl border border-slate-200 shadow-sm hover:shadow-md transition-all">
            <div className="w-10 h-10 rounded-xl bg-purple-50 text-purple-600 flex items-center justify-center mb-4 font-bold">
              <CreditCard className="w-5 h-5" />
            </div>
            <h3 className="font-bold text-slate-900 mb-1">Billing & Plans</h3>
            <p className="text-xs text-slate-500">Stripe Customer Portal & invoices</p>
          </div>
        </div>

        {/* Featured Documentation Articles */}
        <div className="bg-white border border-slate-200 rounded-2xl p-8 shadow-sm">
          <h2 className="text-xl font-bold text-slate-900 mb-6">Popular Articles & Tutorials</h2>
          <div className="divide-y divide-slate-100">
            {articles.map((article) => (
              <Link
                key={article.slug}
                href={`/help/${article.slug}`}
                className="py-4 flex items-center justify-between group hover:bg-slate-50 -mx-4 px-4 rounded-xl transition-all"
              >
                <div>
                  <span className="text-xs font-bold text-sky-600 uppercase tracking-wider">
                    {article.category}
                  </span>
                  <h4 className="text-base font-semibold text-slate-900 group-hover:text-sky-600 transition-colors mt-0.5">
                    {article.title}
                  </h4>
                  <p className="text-xs text-slate-500 mt-1 line-clamp-1">{article.summary}</p>
                </div>
                <ArrowRight className="w-5 h-5 text-slate-400 group-hover:text-sky-600 group-hover:translate-x-1 transition-all shrink-0" />
              </Link>
            ))}
          </div>
        </div>

        {/* Need Direct Help? */}
        <div className="bg-gradient-to-r from-slate-900 to-indigo-950 text-white rounded-2xl p-8 flex flex-col sm:flex-row items-center justify-between gap-6 shadow-xl">
          <div>
            <h3 className="text-xl font-bold">Can&apos;t find what you are looking for?</h3>
            <p className="text-slate-300 text-sm mt-1">
              Our specialized healthcare support team is available 24/7 to assist your clinic.
            </p>
          </div>
          <Link
            href="/dashboard/support"
            className="px-5 py-3 bg-sky-600 hover:bg-sky-500 text-white text-xs font-bold rounded-xl transition-all shadow-md shrink-0 flex items-center gap-2"
          >
            <LifeBuoy className="w-4 h-4" />
            Open Support Ticket
          </Link>
        </div>
      </div>
    </div>
  );
}

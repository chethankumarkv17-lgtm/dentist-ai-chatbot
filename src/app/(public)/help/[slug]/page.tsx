import { notFound } from 'next/navigation';
import Link from 'next/link';
import { getHelpArticleBySlug, getHelpArticles } from '@/lib/support/service';
import { ArrowLeft, Clock, LifeBuoy } from 'lucide-react';

interface ArticlePageProps {
  params: Promise<{ slug: string }>;
}

export async function generateStaticParams() {
  const articles = getHelpArticles();
  return articles.map((article) => ({
    slug: article.slug,
  }));
}

export default async function HelpArticlePage({ params }: ArticlePageProps) {
  const { slug } = await params;
  const article = getHelpArticleBySlug(slug);

  if (!article) {
    notFound();
  }

  return (
    <div className="min-h-screen bg-slate-50 py-16 px-4 sm:px-6 lg:px-8">
      <div className="max-w-4xl mx-auto">
        <Link
          href="/help"
          className="inline-flex items-center gap-1.5 text-xs font-bold text-slate-500 hover:text-slate-800 mb-8 transition-colors"
        >
          <ArrowLeft className="w-4 h-4" />
          Back to Help Center
        </Link>

        <article className="bg-white border border-slate-200 rounded-2xl p-8 sm:p-12 shadow-sm">
          <div className="flex items-center gap-3 mb-4">
            <span className="px-3 py-1 rounded-full bg-sky-100 text-sky-700 text-xs font-bold uppercase">
              {article.category}
            </span>
            <span className="text-xs text-slate-400 flex items-center gap-1">
              <Clock className="w-3.5 h-3.5" />
              Updated {article.updatedAt}
            </span>
          </div>

          <h1 className="text-3xl sm:text-4xl font-extrabold text-slate-900 tracking-tight mb-6">
            {article.title}
          </h1>

          <div className="prose prose-slate max-w-none text-slate-700 space-y-4">
            <div className="whitespace-pre-line leading-relaxed font-sans">{article.content}</div>
          </div>

          <div className="mt-12 pt-8 border-t border-slate-100 flex flex-col sm:flex-row items-center justify-between gap-4">
            <div className="text-xs text-slate-500">
              Still have questions? Our support team is here for you.
            </div>
            <Link
              href="/dashboard/support"
              className="inline-flex items-center gap-2 px-4 py-2 bg-sky-600 hover:bg-sky-700 text-white text-xs font-bold rounded-xl transition-all shadow-sm"
            >
              <LifeBuoy className="w-4 h-4" />
              Contact Support
            </Link>
          </div>
        </article>
      </div>
    </div>
  );
}

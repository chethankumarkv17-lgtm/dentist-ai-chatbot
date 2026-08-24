import { MetadataRoute } from 'next';

export default function sitemap(): MetadataRoute.Sitemap {
  const baseUrl = process.env.NEXT_PUBLIC_APP_URL || 'https://radiantnobel.com';

  const publicRoutes: { path: string; priority: number; changeFrequency: 'always' | 'hourly' | 'daily' | 'weekly' | 'monthly' | 'yearly' | 'never' }[] = [
    { path: '', priority: 1.0, changeFrequency: 'daily' },
    { path: '/features', priority: 0.9, changeFrequency: 'weekly' },
    { path: '/how-it-works', priority: 0.9, changeFrequency: 'weekly' },
    { path: '/pricing', priority: 0.9, changeFrequency: 'weekly' },
    { path: '/help', priority: 0.8, changeFrequency: 'weekly' },
    { path: '/help/ai-receptionist-setup', priority: 0.8, changeFrequency: 'monthly' },
    { path: '/help/google-calendar-sync', priority: 0.8, changeFrequency: 'monthly' },
    { path: '/help/embedding-chat-widget', priority: 0.8, changeFrequency: 'monthly' },
    { path: '/help/custom-domain-dns-setup', priority: 0.8, changeFrequency: 'monthly' },
    { path: '/help/data-retention-privacy-compliance', priority: 0.8, changeFrequency: 'monthly' },
    { path: '/contact', priority: 0.7, changeFrequency: 'monthly' },
    { path: '/login', priority: 0.6, changeFrequency: 'monthly' },
    { path: '/signup', priority: 0.6, changeFrequency: 'monthly' },
    { path: '/privacy', priority: 0.5, changeFrequency: 'monthly' },
    { path: '/terms', priority: 0.5, changeFrequency: 'monthly' },
    { path: '/refund-policy', priority: 0.5, changeFrequency: 'monthly' },
    { path: '/cookie-policy', priority: 0.5, changeFrequency: 'monthly' },
  ];

  return publicRoutes.map((route) => ({
    url: `${baseUrl}${route.path}`,
    lastModified: new Date(),
    changeFrequency: route.changeFrequency,
    priority: route.priority,
  }));
}

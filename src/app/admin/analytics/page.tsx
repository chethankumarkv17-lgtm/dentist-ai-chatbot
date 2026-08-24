import { getPlatformAnalytics } from '@/lib/analytics/service';
import PlatformAnalyticsClient from '../PlatformAnalyticsClient';

export default async function AdminAnalyticsPage() {
  const data = await getPlatformAnalytics(30);

  return <PlatformAnalyticsClient initialData={data} />;
}

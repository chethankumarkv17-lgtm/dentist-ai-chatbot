import { requirePlatformAdmin } from '@/lib/admin/auth';
import { getSystemHealthOverview } from '@/lib/monitoring/service';
import SystemHealthClient from './SystemHealthClient';

export default async function AdminSystemHealthPage() {
  await requirePlatformAdmin();
  const overview = await getSystemHealthOverview();

  return <SystemHealthClient initialOverview={overview} />;
}

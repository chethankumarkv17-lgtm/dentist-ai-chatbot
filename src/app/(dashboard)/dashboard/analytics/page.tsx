import { createClient } from '@/lib/supabase/server-auth';
import { getClinicAnalytics } from '@/lib/analytics/service';
import ClinicAnalyticsClient from './ClinicAnalyticsClient';

export default async function AnalyticsPage() {
  const supabase = createClient();
  let orgId = 'org-1';

  try {
    const { data: { user } } = await supabase.auth.getUser();
    if (user) {
      const { data: member } = await supabase
        .from('organization_members')
        .select('organization_id')
        .eq('user_id', user.id)
        .maybeSingle();

      if (member?.organization_id) {
        orgId = member.organization_id;
      }
    }
  } catch {
    // Fallback
  }

  const initialData = await getClinicAnalytics(orgId, 30);

  return <ClinicAnalyticsClient organizationId={orgId} initialData={initialData} />;
}
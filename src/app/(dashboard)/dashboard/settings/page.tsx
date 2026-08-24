import { createClient } from '@/lib/supabase/server-auth';
import { getRetentionPolicy } from '@/lib/privacy/service';
import SettingsClient from './SettingsClient';

export default async function SettingsPage() {
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

  const policy = await getRetentionPolicy(orgId);

  return <SettingsClient organizationId={orgId} initialPolicy={policy} />;
}
import { createClient } from '@/lib/supabase/server-auth';
import { getClinicTickets } from '@/lib/support/service';
import SupportClient from './SupportClient';

export default async function DashboardSupportPage() {
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

  const tickets = await getClinicTickets(orgId);

  return <SupportClient organizationId={orgId} initialTickets={tickets} />;
}

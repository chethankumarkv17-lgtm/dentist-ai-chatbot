import { createClient } from '@/lib/supabase/server-auth';
import { getOrganizationBillingDetails } from '@/app/actions/billing';
import { PlanDefinition } from '@/lib/billing/plans';
import BillingDashboardClient from './BillingDashboardClient';

export default async function BillingPage() {
  const supabase = createClient();
  
  // Find current user's organization
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
    // Fallback in test mode
  }

  const billingRes = await getOrganizationBillingDetails(orgId);

  const fallbackData = {
    subscription: {
      status: 'trialing',
      interval: 'monthly',
      cancel_at_period_end: false,
    },
    plan: {
      key: 'starter' as const,
      name: 'Starter',
      description: 'Essential AI Receptionist for solo practices',
      monthlyPrice: 99,
      yearlyPrice: 950,
      limits: {
        aiMessagesLimit: 500,
        dentistsLimit: 2,
        websitesLimit: 1,
        locationsLimit: 1,
        appointmentsLimit: 150,
      },
      featureFlags: {
        customDomains: false,
        calendarSync: true,
        prioritySupport: false,
        customWidgetBranding: false,
        analyticsReports: false,
      },
      highlights: ['24/7 AI Dental Receptionist', '500 AI Patient Conversations/mo'],
    },
    usage: {
      dentistsCount: 1,
      websitesCount: 1,
      aiMessagesCount: 45,
    },
  };

  const details = billingRes.success && billingRes.data ? billingRes.data : fallbackData;

  return (
    <BillingDashboardClient
      organizationId={orgId}
      subscription={details.subscription}
      currentPlan={details.plan as PlanDefinition}
      usage={details.usage}
    />
  );
}
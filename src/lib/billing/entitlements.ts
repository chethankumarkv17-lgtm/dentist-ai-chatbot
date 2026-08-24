import { createClient } from '@/lib/supabase/server-auth';
import { getPlan, PlanDefinition, PlanFeatureFlags } from './plans';

export interface EntitlementsResult {
  plan: PlanDefinition;
  subscriptionStatus: string;
  isEntitled: (feature: keyof PlanFeatureFlags) => boolean;
  voiceMinutesLimit: number;
  voiceMinutesUsed: number;
  voiceMinutesRemaining: number;
  voiceAllowed: boolean;
}

/**
 * Authoritative Server-Side Feature Entitlement Check.
 * Verifies active subscription status against Supabase and evaluates requested feature flag.
 */
export async function hasFeature(
  organizationId: string,
  feature: keyof PlanFeatureFlags
): Promise<boolean> {
  if (!organizationId) return false;

  const supabase = createClient();

  try {
    const { data: sub } = await supabase
      .from('subscriptions')
      .select('plan_id, status')
      .eq('organization_id', organizationId)
      .maybeSingle();

    if (!sub || (sub.status !== 'active' && sub.status !== 'trialing')) {
      return false;
    }

    let planKey = 'starter';
    if (sub.plan_id) {
      const { data: planRecord } = await supabase
        .from('plans')
        .select('name')
        .eq('id', sub.plan_id)
        .maybeSingle();

      const name = (planRecord?.name || '').toLowerCase();
      if (name.includes('pro') || name.includes('enterprise')) {
        planKey = 'pro';
      } else if (name.includes('growth')) {
        planKey = 'growth';
      }
    }

    const plan = getPlan(planKey);
    return Boolean(plan.featureFlags[feature]);
  } catch (err: unknown) {
    console.error('Error evaluating feature entitlement:', err);
    return false;
  }
}

/**
 * Retrieves full feature entitlements, minutes usage, and voice limits for an organization.
 */
export async function getOrganizationEntitlements(
  organizationId: string
): Promise<EntitlementsResult> {
  const defaultFallbackPlan = getPlan('starter');
  if (!organizationId) {
    return {
      plan: defaultFallbackPlan,
      subscriptionStatus: 'none',
      isEntitled: () => false,
      voiceMinutesLimit: 0,
      voiceMinutesUsed: 0,
      voiceMinutesRemaining: 0,
      voiceAllowed: false,
    };
  }

  const supabase = createClient();

  try {
    const { data: sub } = await supabase
      .from('subscriptions')
      .select('plan_id, status')
      .eq('organization_id', organizationId)
      .maybeSingle();

    const status = sub?.status || 'none';
    const isActive = status === 'active' || status === 'trialing';

    let planKey = 'starter';
    if (sub?.plan_id) {
      const { data: planRecord } = await supabase
        .from('plans')
        .select('name')
        .eq('id', sub.plan_id)
        .maybeSingle();

      const name = (planRecord?.name || '').toLowerCase();
      if (name.includes('pro') || name.includes('enterprise')) {
        planKey = 'pro';
      } else if (name.includes('growth')) {
        planKey = 'growth';
      }
    }

    const plan = getPlan(planKey);

    // Calculate voice usage for current billing month
    const startOfMonthIso = new Date(new Date().getFullYear(), new Date().getMonth(), 1).toISOString();
    const { data: voiceUsageRecords } = await supabase
      .from('voice_usage')
      .select('minutes_used')
      .eq('organization_id', organizationId)
      .gte('billing_month', startOfMonthIso);

    const usageList = Array.isArray(voiceUsageRecords) ? voiceUsageRecords : [];
    const voiceMinutesUsed = usageList.reduce((acc: number, curr: { minutes_used?: number }) => acc + (curr.minutes_used || 0), 0);
    const voiceMinutesLimit = isActive ? plan.limits.voiceMinutesLimit : 0;
    const voiceMinutesRemaining = Math.max(0, voiceMinutesLimit - voiceMinutesUsed);
    const voiceAllowed = isActive && plan.featureFlags.voiceAgent && voiceMinutesRemaining > 0;

    return {
      plan,
      subscriptionStatus: status,
      isEntitled: (feature: keyof PlanFeatureFlags) => isActive && Boolean(plan.featureFlags[feature]),
      voiceMinutesLimit,
      voiceMinutesUsed,
      voiceMinutesRemaining,
      voiceAllowed,
    };
  } catch (err: unknown) {
    console.error('Error fetching organization entitlements:', err);
    return {
      plan: defaultFallbackPlan,
      subscriptionStatus: 'error',
      isEntitled: () => false,
      voiceMinutesLimit: 0,
      voiceMinutesUsed: 0,
      voiceMinutesRemaining: 0,
      voiceAllowed: false,
    };
  }
}

/**
 * Strict server-side assertion that throws an Error if the organization does not have access.
 */
export async function assertFeatureEntitlement(
  organizationId: string,
  feature: keyof PlanFeatureFlags
): Promise<void> {
  const entitled = await hasFeature(organizationId, feature);
  if (!entitled) {
    throw new Error(`Unauthorized: Feature '${feature}' requires an active plan upgrade.`);
  }
}

/**
 * Validates voice entitlement for an incoming telephony call by clinicId or organizationId.
 */
export async function verifyVoiceEntitlementServerSide(
  clinicIdOrOrgId: string
): Promise<{ authorized: boolean; reason?: string; organizationId?: string; clinicId?: string }> {
  const supabase = createClient();

  // 1. Resolve clinic and organization
  const { data: clinic } = await supabase
    .from('clinics')
    .select('id, organization_id')
    .or(`id.eq.${clinicIdOrOrgId},organization_id.eq.${clinicIdOrOrgId}`)
    .maybeSingle();

  const orgId = clinic?.organization_id || clinicIdOrOrgId;
  const clinicId = clinic?.id;

  if (!orgId) {
    return { authorized: false, reason: 'unrecognized_tenant' };
  }

  // 2. Query Authoritative Subscription Entitlement
  const entitlements = await getOrganizationEntitlements(orgId);

  if (!entitlements.isEntitled('voiceAgent')) {
    return {
      authorized: false,
      reason: 'voice_plan_required',
      organizationId: orgId,
      clinicId,
    };
  }

  if (entitlements.voiceMinutesRemaining <= 0) {
    return {
      authorized: false,
      reason: 'voice_minutes_exceeded',
      organizationId: orgId,
      clinicId,
    };
  }

  return {
    authorized: true,
    organizationId: orgId,
    clinicId,
  };
}

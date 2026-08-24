'use server';

import { createClient } from '@/lib/supabase/server-auth';
import {
  createStripeCheckoutSession,
  createStripeCustomerPortalSession,
  cancelStripeSubscription,
} from '@/lib/billing/stripe';
import { PlanKey, BillingInterval, getPlan } from '@/lib/billing/plans';
import { revalidatePath } from 'next/cache';

export async function getOrganizationBillingDetails(organizationId: string) {
  if (!organizationId) {
    return { success: false, error: 'Organization ID is required' };
  }

  const supabase = createClient();

  try {
    const [subRes, dentistsRes, websitesRes, usageRes] = await Promise.all([
      supabase
        .from('subscriptions')
        .select('id, organization_id, plan_id, stripe_customer_id, stripe_subscription_id, status, interval, current_period_end, cancel_at_period_end')
        .eq('organization_id', organizationId)
        .single(),
      supabase
        .from('dentists')
        .select('id', { count: 'exact', head: true })
        .eq('is_active', true),
      supabase
        .from('clinic_websites')
        .select('id', { count: 'exact', head: true }),
      supabase
        .from('ai_usage')
        .select('prompt_tokens, completion_tokens')
        .eq('organization_id', organizationId),
    ]);

    const subscription = subRes.data || {
      id: undefined,
      organization_id: organizationId,
      plan_id: null as string | null,
      stripe_customer_id: null as string | null,
      stripe_subscription_id: null as string | null,
      status: 'trialing',
      interval: 'monthly',
      current_period_end: null as string | null,
      cancel_at_period_end: false,
    };

    // Calculate plan key
    let currentPlanKey: PlanKey = 'starter';
    if (subscription.plan_id) {
      const { data: planRecord } = await supabase
        .from('plans')
        .select('name, limits')
        .eq('id', subscription.plan_id)
        .single();

      if (planRecord?.name?.toLowerCase().includes('pro')) currentPlanKey = 'pro';
      else if (planRecord?.name?.toLowerCase().includes('growth')) currentPlanKey = 'growth';
    }

    const currentPlan = getPlan(currentPlanKey);

    // Approximate message count from tokens or records
    const totalAiTokens = (usageRes.data || []).reduce(
      (acc, r) => acc + (r.prompt_tokens || 0) + (r.completion_tokens || 0),
      0
    );
    const estimatedAiMessages = Math.floor(totalAiTokens / 150);

    return {
      success: true,
      data: {
        subscription,
        plan: currentPlan,
        usage: {
          dentistsCount: dentistsRes.count || 1,
          websitesCount: websitesRes.count || 1,
          aiMessagesCount: estimatedAiMessages || 45,
        },
      },
    };
  } catch (err: unknown) {
    return { success: false, error: (err as Error)?.message || 'Failed to load billing details' };
  }
}

export async function createCheckoutSessionAction(
  organizationId: string,
  planKey: PlanKey,
  interval: BillingInterval,
  customerEmail?: string
) {
  if (!organizationId) return { success: false, error: 'Organization ID is required' };

  try {
    const session = await createStripeCheckoutSession({
      organizationId,
      planKey,
      interval,
      customerEmail,
    });
    return { success: true, url: session.url };
  } catch (err: unknown) {
    return { success: false, error: (err as Error)?.message || 'Failed to initialize checkout' };
  }
}

export async function createCustomerPortalAction(organizationId: string) {
  if (!organizationId) return { success: false, error: 'Organization ID is required' };

  const supabase = createClient();
  const { data: sub } = await supabase
    .from('subscriptions')
    .select('stripe_customer_id')
    .eq('organization_id', organizationId)
    .single();

  if (!sub?.stripe_customer_id) {
    return { success: false, error: 'No active Stripe customer found. Please subscribe to a plan first.' };
  }

  try {
    const portal = await createStripeCustomerPortalSession(sub.stripe_customer_id);
    return { success: true, url: portal.url };
  } catch (err: unknown) {
    return { success: false, error: (err as Error)?.message || 'Failed to open billing portal' };
  }
}

export async function cancelSubscriptionAction(organizationId: string, cancelAtPeriodEnd = true) {
  if (!organizationId) return { success: false, error: 'Organization ID is required' };

  const supabase = createClient();
  const { data: sub } = await supabase
    .from('subscriptions')
    .select('stripe_subscription_id')
    .eq('organization_id', organizationId)
    .single();

  if (!sub?.stripe_subscription_id) {
    // If no Stripe subscription ID (e.g. trial), update DB directly
    await supabase
      .from('subscriptions')
      .update({ status: 'canceled', cancel_at_period_end: false, updated_at: new Date().toISOString() })
      .eq('organization_id', organizationId);

    revalidatePath('/dashboard/billing');
    return { success: true };
  }

  try {
    await cancelStripeSubscription(sub.stripe_subscription_id, cancelAtPeriodEnd);
    await supabase
      .from('subscriptions')
      .update({
        cancel_at_period_end: cancelAtPeriodEnd,
        status: cancelAtPeriodEnd ? 'active' : 'canceled',
        updated_at: new Date().toISOString(),
      })
      .eq('organization_id', organizationId);

    revalidatePath('/dashboard/billing');
    return { success: true };
  } catch (err: unknown) {
    return { success: false, error: (err as Error)?.message || 'Failed to cancel subscription' };
  }
}

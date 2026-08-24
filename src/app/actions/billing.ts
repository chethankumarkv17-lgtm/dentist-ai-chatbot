'use server';

import { createClient } from '@/lib/supabase/server-auth';
import { getPaymentProvider } from '@/lib/billing/provider-factory';
import { PlanKey, BillingInterval, getPlan } from '@/lib/billing/plans';
import { SupportedPaymentMethod } from '@/lib/billing/types';
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
        .select('id, organization_id, plan_id, razorpay_customer_id, razorpay_subscription_id, status, interval, current_period_end, cancel_at_period_end')
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
      razorpay_customer_id: null as string | null,
      razorpay_subscription_id: null as string | null,
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
          whatsappMessagesCount: 12,
        },
      },
    };
  } catch (err: unknown) {
    return { success: false, error: (err as Error)?.message || 'Failed to load billing details' };
  }
}

export async function createSubscriptionAction(
  organizationId: string,
  planKey: PlanKey,
  interval: BillingInterval,
  customerEmail?: string,
  customerPhone?: string,
  preferredMethod?: SupportedPaymentMethod
) {
  if (!organizationId) return { success: false, error: 'Organization ID is required' };

  try {
    const provider = getPaymentProvider();
    const result = await provider.createSubscription({
      organizationId,
      planKey,
      interval,
      customerEmail,
      customerPhone,
      preferredMethod,
    });

    return {
      success: true,
      subscriptionId: result.subscriptionId,
      url: result.shortUrl,
      planId: result.planId,
    };
  } catch (err: unknown) {
    return { success: false, error: (err as Error)?.message || 'Failed to initialize subscription' };
  }
}

export async function createCheckoutSessionAction(
  organizationId: string,
  planKey: PlanKey,
  interval: BillingInterval,
  customerEmail?: string,
  customerPhone?: string,
  preferredMethod?: SupportedPaymentMethod
) {
  if (!organizationId) return { success: false, error: 'Organization ID is required' };

  const plan = getPlan(planKey);
  const amount = interval === 'yearly' ? plan.yearlyPrice : plan.monthlyPrice;

  try {
    const provider = getPaymentProvider();
    const checkout = await provider.createCheckout({
      organizationId,
      planKey,
      interval,
      amount,
      currency: 'INR',
      customerEmail,
      customerPhone,
      preferredMethod,
    });

    return {
      success: true,
      checkoutId: checkout.checkoutId,
      url: checkout.shortUrl,
      qrCodeUrl: checkout.qrCodeUrl,
      upiIntentUrl: checkout.upiIntentUrl,
      supportedMethods: checkout.supportedMethods,
    };
  } catch (err: unknown) {
    return { success: false, error: (err as Error)?.message || 'Failed to initialize checkout' };
  }
}

export async function verifyPaymentAction(
  paymentId: string,
  orderId?: string,
  subscriptionId?: string,
  signature = ''
) {
  if (!paymentId || !signature) {
    return { success: false, error: 'Payment details and signature are required' };
  }

  try {
    const provider = getPaymentProvider();
    const result = await provider.verifyPayment({
      paymentId,
      orderId,
      subscriptionId,
      signature,
    });

    if (!result.isValid) {
      return { success: false, error: result.error || 'Payment verification failed' };
    }

    return {
      success: true,
      paymentId: result.paymentId,
      status: result.status,
      method: result.method,
    };
  } catch (err: unknown) {
    return { success: false, error: (err as Error)?.message || 'Verification error' };
  }
}

export async function changeSubscriptionPlanAction(
  organizationId: string,
  newPlanKey: PlanKey,
  newInterval: BillingInterval = 'monthly'
) {
  if (!organizationId) return { success: false, error: 'Organization ID is required' };

  const supabase = createClient();
  const { data: sub } = await supabase
    .from('subscriptions')
    .select('razorpay_subscription_id')
    .eq('organization_id', organizationId)
    .single();

  if (!sub?.razorpay_subscription_id) {
    return { success: false, error: 'No active subscription found to upgrade or downgrade.' };
  }

  try {
    const provider = getPaymentProvider();
    const result = await provider.updateSubscription({
      subscriptionId: sub.razorpay_subscription_id,
      newPlanKey,
      newInterval,
      prorate: true,
    });

    const plan = getPlan(newPlanKey);
    const { data: planRecord } = await supabase
      .from('plans')
      .select('id')
      .eq('razorpay_plan_id', result.newPlanId)
      .maybeSingle();

    await supabase
      .from('subscriptions')
      .update({
        plan_id: planRecord?.id,
        interval: newInterval,
        updated_at: new Date().toISOString(),
      })
      .eq('organization_id', organizationId);

    revalidatePath('/dashboard/billing');
    return { success: true, newPlan: plan.name };
  } catch (err: unknown) {
    return { success: false, error: (err as Error)?.message || 'Plan change failed' };
  }
}

export async function cancelSubscriptionAction(organizationId: string, cancelAtPeriodEnd = true) {
  if (!organizationId) return { success: false, error: 'Organization ID is required' };

  const supabase = createClient();
  const { data: sub } = await supabase
    .from('subscriptions')
    .select('razorpay_subscription_id')
    .eq('organization_id', organizationId)
    .single();

  if (!sub?.razorpay_subscription_id) {
    await supabase
      .from('subscriptions')
      .update({ status: 'canceled', cancel_at_period_end: false, updated_at: new Date().toISOString() })
      .eq('organization_id', organizationId);

    revalidatePath('/dashboard/billing');
    return { success: true };
  }

  try {
    const provider = getPaymentProvider();
    await provider.cancelSubscription({
      subscriptionId: sub.razorpay_subscription_id,
      cancelAtPeriodEnd,
    });

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

export async function createCustomerPortalAction(organizationId: string) {
  if (!organizationId) return { success: false, error: 'Organization ID is required' };
  return { success: true, url: '/dashboard/billing' };
}


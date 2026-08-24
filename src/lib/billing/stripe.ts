import Stripe from 'stripe';
import { PlanKey, BillingInterval, getPlan } from './plans';

let stripeClient: Stripe | null = null;

export function getStripeClient(): Stripe {
  if (!stripeClient) {
    const key = process.env.STRIPE_SECRET_KEY || 'mock_sk_test_12345';
    stripeClient = new Stripe(key, {
      apiVersion: '2026-02-05' as unknown as Stripe.LatestApiVersion,
      typescript: true,
    });
  }
  return stripeClient;
}

export interface CreateCheckoutSessionParams {
  organizationId: string;
  planKey: PlanKey;
  interval: BillingInterval;
  customerEmail?: string;
  successUrl?: string;
  cancelUrl?: string;
}

/**
 * Creates a Stripe Checkout Session for subscription payment
 */
export async function createStripeCheckoutSession(params: CreateCheckoutSessionParams): Promise<{ url: string; sessionId: string }> {
  const { organizationId, planKey, interval, customerEmail, successUrl, cancelUrl } = params;
  const plan = getPlan(planKey);
  const priceId = interval === 'yearly' ? plan.yearlyPriceId : plan.monthlyPriceId;

  // In test / offline mock mode without real Stripe keys
  if (!process.env.STRIPE_SECRET_KEY || process.env.STRIPE_SECRET_KEY.startsWith('mock_')) {
    return {
      url: `https://checkout.stripe.com/c/pay/cs_test_${organizationId}_${planKey}_${interval}`,
      sessionId: `cs_test_${Date.now()}`,
    };
  }

  const stripe = getStripeClient();
  const origin = process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000';

  const session = await stripe.checkout.sessions.create({
    mode: 'subscription',
    payment_method_types: ['card'],
    customer_email: customerEmail,
    line_items: [
      {
        price: priceId,
        quantity: 1,
      },
    ],
    metadata: {
      organizationId,
      planKey,
      interval,
    },
    subscription_data: {
      metadata: {
        organizationId,
        planKey,
        interval,
      },
    },
    client_reference_id: organizationId,
    success_url: successUrl || `${origin}/dashboard/billing?session_id={CHECKOUT_SESSION_ID}&success=true`,
    cancel_url: cancelUrl || `${origin}/dashboard/billing?canceled=true`,
  });

  return {
    url: session.url || `${origin}/dashboard/billing`,
    sessionId: session.id,
  };
}

/**
 * Creates a Stripe Customer Portal Session for billing self-service
 */
export async function createStripeCustomerPortalSession(
  stripeCustomerId: string,
  returnUrl?: string
): Promise<{ url: string }> {
  const origin = process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000';

  if (!process.env.STRIPE_SECRET_KEY || process.env.STRIPE_SECRET_KEY.startsWith('mock_')) {
    return {
      url: `https://billing.stripe.com/p/session/test_${stripeCustomerId}`,
    };
  }

  const stripe = getStripeClient();
  const session = await stripe.billingPortal.sessions.create({
    customer: stripeCustomerId,
    return_url: returnUrl || `${origin}/dashboard/billing`,
  });

  return { url: session.url };
}

/**
 * Cancels or schedules cancellation for a Stripe subscription
 */
export async function cancelStripeSubscription(
  stripeSubscriptionId: string,
  cancelAtPeriodEnd = true
): Promise<{ success: boolean; status: string }> {
  if (!process.env.STRIPE_SECRET_KEY || process.env.STRIPE_SECRET_KEY.startsWith('mock_')) {
    return { success: true, status: cancelAtPeriodEnd ? 'canceling' : 'canceled' };
  }

  const stripe = getStripeClient();

  if (cancelAtPeriodEnd) {
    const sub = await stripe.subscriptions.update(stripeSubscriptionId, {
      cancel_at_period_end: true,
    });
    return { success: true, status: sub.status };
  }

  const sub = await stripe.subscriptions.cancel(stripeSubscriptionId);
  return { success: true, status: sub.status };
}

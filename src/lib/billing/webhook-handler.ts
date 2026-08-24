import Stripe from 'stripe';
import { getStripeClient } from './stripe';
import { createClient } from '@/lib/supabase/server-auth';
import { getPlanByPriceId, getPlan } from './plans';
import {
  claimWebhookEvent,
  finalizeWebhookSuccess,
  finalizeWebhookFailure,
  isEventStale,
} from '@/lib/webhooks/reliability';

export interface WebhookProcessingResult {
  success: boolean;
  received: boolean;
  duplicate?: boolean;
  eventType?: string;
  error?: string;
}

/**
 * Authoritative Stripe Webhook Processor with Mutex Concurrency, Deduplication,
 * and Out-of-Order Event Protection.
 */
export async function processStripeWebhookEvent(
  rawBody: string | Buffer,
  signature: string
): Promise<WebhookProcessingResult> {
  const stripe = getStripeClient();
  const webhookSecret = process.env.STRIPE_WEBHOOK_SECRET || 'whsec_test_secret';

  let event: Stripe.Event;

  // 1. Authoritative Cryptographic Signature Verification
  try {
    if (process.env.NODE_ENV === 'test' && signature === 'test_bypass_sig') {
      event = JSON.parse(rawBody.toString()) as Stripe.Event;
    } else {
      event = stripe.webhooks.constructEvent(rawBody, signature, webhookSecret);
    }
  } catch (err: unknown) {
    return {
      success: false,
      received: false,
      error: `Webhook signature verification failed: ${(err as Error)?.message}`,
    };
  }

  // 2. Concurrency & Idempotency Claim
  const claim = await claimWebhookEvent(
    'stripe',
    event.id,
    event as unknown as Record<string, unknown>,
    event.created
  );

  if (!claim.shouldProcess) {
    return {
      success: true,
      received: true,
      duplicate: claim.isDuplicate || claim.isProcessing,
      eventType: event.type,
    };
  }

  const supabase = createClient();

  const eventDateIso = event.created
    ? new Date(event.created * 1000).toISOString()
    : new Date().toISOString();

  // 3. Process Authoritative Event Types
  try {
    switch (event.type) {
      case 'checkout.session.completed': {
        const session = event.data.object as Stripe.Checkout.Session;
        const organizationId =
          session.client_reference_id ||
          (session.metadata?.organizationId as string);

        const customerId = session.customer as string;
        const subscriptionId = session.subscription as string;
        const planKey = (session.metadata?.planKey as string) || 'starter';
        const interval = (session.metadata?.interval as string) || 'monthly';

        if (organizationId) {
          const planDef = getPlan(planKey);
          const priceId = interval === 'yearly' ? planDef.yearlyPriceId : planDef.monthlyPriceId;

          const { data: planRecord } = await supabase
            .from('plans')
            .select('id')
            .eq('stripe_price_id', priceId)
            .maybeSingle();

          const planId = planRecord?.id;

          const updatePayload: Record<string, unknown> = {
            stripe_customer_id: customerId,
            stripe_subscription_id: subscriptionId,
            status: 'active',
            interval,
            cancel_at_period_end: false,
            updated_at: eventDateIso,
          };
          if (planId) updatePayload.plan_id = planId;

          await supabase
            .from('subscriptions')
            .update(updatePayload)
            .eq('organization_id', organizationId);
        }
        break;
      }

      case 'customer.subscription.created':
      case 'customer.subscription.updated': {
        const sub = event.data.object as Stripe.Subscription;
        const subscriptionId = sub.id;
        const customerId = sub.customer as string;
        const organizationId = sub.metadata?.organizationId;

        // Out-of-order protection: Check existing subscription updated_at
        if (event.created) {
          const query = supabase.from('subscriptions').select('id, updated_at');
          const { data: currentSub } = organizationId
            ? await query.eq('organization_id', organizationId).maybeSingle()
            : await query.eq('stripe_subscription_id', subscriptionId).maybeSingle();

          if (currentSub?.updated_at && isEventStale(event.created, currentSub.updated_at)) {
            // Out of order: Older event arriving after newer state already applied
            break;
          }
        }

        const status = sub.status === 'trialing'
          ? 'trialing'
          : sub.status === 'active'
          ? 'active'
          : sub.status === 'past_due'
          ? 'past_due'
          : sub.status === 'unpaid'
          ? 'unpaid'
          : 'canceled';

        const currentPeriodEnd = (sub as unknown as { current_period_end?: number }).current_period_end
          ? new Date((sub as unknown as { current_period_end: number }).current_period_end * 1000).toISOString()
          : null;

        const cancelAtPeriodEnd = sub.cancel_at_period_end || false;
        const priceId = sub.items?.data?.[0]?.price?.id;

        const matched = priceId ? getPlanByPriceId(priceId) : null;

        const updatePayload: Record<string, unknown> = {
          stripe_customer_id: customerId,
          status,
          current_period_end: currentPeriodEnd,
          cancel_at_period_end: cancelAtPeriodEnd,
          updated_at: eventDateIso,
        };

        if (matched) {
          updatePayload.interval = matched.interval;
          const { data: planRecord } = await supabase
            .from('plans')
            .select('id')
            .eq('stripe_price_id', priceId)
            .maybeSingle();
          if (planRecord) updatePayload.plan_id = planRecord.id;
        }

        if (organizationId) {
          await supabase
            .from('subscriptions')
            .update(updatePayload)
            .eq('organization_id', organizationId);
        } else {
          await supabase
            .from('subscriptions')
            .update(updatePayload)
            .eq('stripe_subscription_id', subscriptionId);
        }
        break;
      }

      case 'customer.subscription.deleted': {
        const sub = event.data.object as Stripe.Subscription;
        await supabase
          .from('subscriptions')
          .update({
            status: 'canceled',
            cancel_at_period_end: false,
            updated_at: eventDateIso,
          })
          .eq('stripe_subscription_id', sub.id);
        break;
      }

      case 'invoice.paid': {
        const invoice = event.data.object as Stripe.Invoice;
        const subId = (invoice as unknown as { subscription?: string }).subscription;
        if (subId) {
          await supabase
            .from('subscriptions')
            .update({
              status: 'active',
              updated_at: eventDateIso,
            })
            .eq('stripe_subscription_id', subId);
        }
        break;
      }

      case 'invoice.payment_failed': {
        const invoice = event.data.object as Stripe.Invoice;
        const subId = (invoice as unknown as { subscription?: string }).subscription;
        if (subId) {
          await supabase
            .from('subscriptions')
            .update({
              status: 'past_due',
              updated_at: eventDateIso,
            })
            .eq('stripe_subscription_id', subId);
        }
        break;
      }

      default:
        break;
    }

    // 4. Finalize Success
    await finalizeWebhookSuccess('stripe', event.id, event.created);

    return {
      success: true,
      received: true,
      eventType: event.type,
    };
  } catch (err: unknown) {
    const errorMsg = (err as Error)?.message || 'Processing failed';
    await finalizeWebhookFailure('stripe', event.id, errorMsg);

    return {
      success: false,
      received: true,
      eventType: event.type,
      error: errorMsg,
    };
  }
}

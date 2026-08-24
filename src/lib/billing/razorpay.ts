import Razorpay from 'razorpay';
import { PlanKey, BillingInterval, getPlan } from './plans';

let razorpayClient: Razorpay | null = null;

export function getRazorpayClient(): Razorpay {
  if (!razorpayClient) {
    const key_id = process.env.RAZORPAY_KEY_ID || 'mock_rzp_test_key_id';
    const key_secret = process.env.RAZORPAY_KEY_SECRET || 'mock_rzp_test_secret';
    razorpayClient = new Razorpay({
      key_id,
      key_secret,
    });
  }
  return razorpayClient;
}

export interface CreateSubscriptionParams {
  organizationId: string;
  planKey: PlanKey;
  interval: BillingInterval;
  customerEmail?: string;
}

/**
 * Creates a Razorpay Subscription
 */
export async function createRazorpaySubscription(params: CreateSubscriptionParams): Promise<{ id: string; short_url: string }> {
  const { organizationId, planKey, interval } = params;
  const plan = getPlan(planKey);
  const planId = interval === 'yearly' ? plan.razorpayYearlyPlanId : plan.razorpayMonthlyPlanId;

  // In test / offline mock mode without real Razorpay keys
  if (!process.env.RAZORPAY_KEY_ID || process.env.RAZORPAY_KEY_ID.startsWith('mock_') || process.env.RAZORPAY_KEY_ID.startsWith('rzp_test_')) {
    return {
      id: `sub_test_${Date.now()}`,
      short_url: `https://rzp.io/i/mock_${organizationId}_${planKey}_${interval}`,
    };
  }

  const razorpay = getRazorpayClient();

  const subscription = await razorpay.subscriptions.create({
    plan_id: planId,
    total_count: interval === 'yearly' ? 10 : 120, // Example durations
    customer_notify: 1,
    notes: {
      organizationId,
      planKey,
      interval,
    },
  });

  return {
    id: subscription.id,
    short_url: subscription.short_url || '',
  };
}

export async function createRazorpayOrder(params: { amount: number; currency?: string; receipt?: string; notes?: Record<string, string | number> }): Promise<{ id: string }> {
  if (!process.env.RAZORPAY_KEY_ID || process.env.RAZORPAY_KEY_ID.startsWith('mock_') || process.env.RAZORPAY_KEY_ID.startsWith('rzp_test_')) {
    return { id: `order_test_${Date.now()}` };
  }
  const razorpay = getRazorpayClient();
  const order = (await razorpay.orders.create({
    amount: params.amount,
    currency: params.currency || 'INR',
    receipt: params.receipt,
    notes: params.notes,
  })) as unknown as { id: string };
  return { id: order.id };
}

/**
 * Cancels or schedules cancellation for a Razorpay subscription
 */
export async function cancelRazorpaySubscription(
  subscriptionId: string,
  cancelAtPeriodEnd = true
): Promise<{ success: boolean; status: string }> {
  if (!process.env.RAZORPAY_KEY_ID || process.env.RAZORPAY_KEY_ID.startsWith('mock_') || process.env.RAZORPAY_KEY_ID.startsWith('rzp_test_')) {
    return { success: true, status: cancelAtPeriodEnd ? 'canceling' : 'cancelled' };
  }

  const razorpay = getRazorpayClient();

  try {
    const sub = await razorpay.subscriptions.cancel(subscriptionId, cancelAtPeriodEnd);
    return { success: true, status: sub.status };
  } catch (error) {
    console.error('Error canceling Razorpay subscription:', error);
    return { success: false, status: 'error' };
  }
}

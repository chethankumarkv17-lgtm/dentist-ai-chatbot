import { describe, it, expect, vi, beforeEach } from 'vitest';
import {
  getPlan,
  getPlanByPriceId,
  getAllPlans,
  BILLING_PLANS,
} from './plans';
import {
  createStripeCheckoutSession,
  createStripeCustomerPortalSession,
  cancelStripeSubscription,
} from './stripe';
import { processStripeWebhookEvent } from './webhook-handler';
import { resetWebhookReliabilityCache } from '@/lib/webhooks/reliability';

// --- IN-MEMORY DATABASE MOCK ---
interface MockDb {
  plans: { id: string; stripe_price_id: string; name: string; limits: unknown }[];
  subscriptions: {
    id: string;
    organization_id: string;
    plan_id?: string;
    stripe_customer_id?: string;
    stripe_subscription_id?: string;
    status: string;
    interval?: string;
    current_period_end?: string | null;
    cancel_at_period_end?: boolean;
  }[];
  webhook_events: {
    id: string;
    event_id: string;
    provider: string;
    payload: unknown;
    status: string;
  }[];
  [key: string]: unknown[];
}

const mockDbState: MockDb = {
  plans: [
    { id: 'plan-starter-id', stripe_price_id: 'price_starter_monthly', name: 'Starter', limits: BILLING_PLANS.starter.limits },
    { id: 'plan-growth-id', stripe_price_id: 'price_growth_monthly', name: 'Growth', limits: BILLING_PLANS.growth.limits },
    { id: 'plan-pro-id', stripe_price_id: 'price_pro_monthly', name: 'Pro', limits: BILLING_PLANS.pro.limits },
  ],
  subscriptions: [
    {
      id: 'sub-1',
      organization_id: 'org-1',
      status: 'trialing',
      interval: 'monthly',
      cancel_at_period_end: false,
    },
  ],
  webhook_events: [],
};

const createMockSupabase = () => {
  const chain = (table: string) => {
    let result: Record<string, unknown>[] = (mockDbState[table] as Record<string, unknown>[]) || [];

    const obj = {
      select: vi.fn(() => obj),
      eq: vi.fn((field: string, val: unknown) => {
        result = result.filter(r => r[field] === val);
        return obj;
      }),
      single: vi.fn(() => ({ data: result[0] || null, error: result[0] ? null : { message: 'Not found' } })),
      maybeSingle: vi.fn(() => ({ data: result[0] || null, error: null })),
      insert: vi.fn((payload: Record<string, unknown>) => {
        const item = { id: `id-${Date.now()}-${Math.random()}`, ...payload };
        if (!mockDbState[table]) mockDbState[table] = [];
        mockDbState[table].push(item);
        return {
          data: item,
          error: null,
          select: vi.fn(() => ({
            single: vi.fn(() => ({ data: item, error: null })),
          })),
        };
      }),
      upsert: vi.fn((payload: Record<string, unknown>) => {
        const item = { id: `id-${Date.now()}`, ...payload };
        if (!mockDbState[table]) mockDbState[table] = [];
        mockDbState[table].push(item);
        return { data: item, error: null };
      }),
      update: vi.fn((payload: Record<string, unknown>) => {
        return {
          eq: vi.fn((field: string, val: unknown) => {
            const tableArr = (mockDbState[table] as Record<string, unknown>[]) || [];
            mockDbState[table] = tableArr.map((r) =>
              r[field] === val ? { ...r, ...payload } : r
            );
            return { data: null, error: null };
          }),
        };
      }),
      then: (resolve: (val: { data: Record<string, unknown>[] }) => void) => resolve({ data: result }),
    };

    return obj;
  };

  return {
    from: vi.fn((table: string) => chain(table)),
  };
};

vi.mock('@/lib/supabase/server-auth', () => ({
  createClient: vi.fn(() => createMockSupabase()),
}));

describe('Phase 21 — Stripe Subscriptions & Billing', () => {
  beforeEach(() => {
    resetWebhookReliabilityCache();
    mockDbState.subscriptions = [
      {
        id: 'sub-1',
        organization_id: 'org-1',
        status: 'trialing',
        interval: 'monthly',
        cancel_at_period_end: false,
      },
    ];
    mockDbState.webhook_events = [];
  });

  describe('1. Plans & Limit Definitions', () => {
    it('defines 3 configurable tiers: Starter, Growth, and Pro with limits', () => {
      const plans = getAllPlans();
      expect(plans.length).toBe(3);

      const starter = getPlan('starter');
      expect(starter.monthlyPrice).toBe(99);
      expect(starter.limits.aiMessagesLimit).toBe(500);
      expect(starter.limits.dentistsLimit).toBe(2);

      const growth = getPlan('growth');
      expect(growth.monthlyPrice).toBe(199);
      expect(growth.limits.aiMessagesLimit).toBe(2500);
      expect(growth.featureFlags.customDomains).toBe(true);

      const pro = getPlan('pro');
      expect(pro.monthlyPrice).toBe(399);
      expect(pro.limits.dentistsLimit).toBeGreaterThanOrEqual(100);
    });

    it('matches plan by price ID correctly', () => {
      const match = getPlanByPriceId(BILLING_PLANS.starter.monthlyPriceId);
      expect(match).not.toBeNull();
      expect(match?.plan.key).toBe('starter');
      expect(match?.interval).toBe('monthly');
    });
  });

  describe('2. Stripe Checkout & Customer Portal Sessions', () => {
    it('creates a checkout session with plan metadata', async () => {
      const session = await createStripeCheckoutSession({
        organizationId: 'org-1',
        planKey: 'growth',
        interval: 'monthly',
        customerEmail: 'dentist@clinic.com',
      });

      expect(session.url).toBeDefined();
      expect(session.url).toContain('org-1');
      expect(session.url).toContain('growth');
      expect(session.sessionId).toBeDefined();
    });

    it('creates a customer portal session for existing customers', async () => {
      const portal = await createStripeCustomerPortalSession('cus_123456');
      expect(portal.url).toBeDefined();
      expect(portal.url).toContain('cus_123456');
    });

    it('handles cancellation and cancel-at-period-end', async () => {
      const res = await cancelStripeSubscription('sub_test_123', true);
      expect(res.success).toBe(true);
      expect(res.status).toBe('canceling');
    });
  });

  describe('3. Authoritative Stripe Webhook Processing', () => {
    it('rejects forged webhook payloads with invalid signatures', async () => {
      const res = await processStripeWebhookEvent('invalid_body', 'invalid_signature');
      expect(res.success).toBe(false);
      expect(res.received).toBe(false);
      expect(res.error).toContain('signature verification failed');
    });

    it('authoritatively activates subscription on checkout.session.completed', async () => {
      const checkoutCompletedEvent = {
        id: 'evt_test_checkout_123',
        type: 'checkout.session.completed',
        data: {
          object: {
            id: 'cs_test_abc',
            client_reference_id: 'org-1',
            customer: 'cus_stripe_999',
            subscription: 'sub_stripe_888',
            metadata: {
              organizationId: 'org-1',
              planKey: 'growth',
              interval: 'monthly',
            },
          },
        },
      };

      const res = await processStripeWebhookEvent(
        JSON.stringify(checkoutCompletedEvent),
        'test_bypass_sig'
      );

      expect(res.success).toBe(true);
      expect(res.eventType).toBe('checkout.session.completed');

      // Subscription updated authoritatively in DB
      const sub = mockDbState.subscriptions.find(s => s.organization_id === 'org-1');
      expect(sub?.status).toBe('active');
      expect(sub?.stripe_customer_id).toBe('cus_stripe_999');
      expect(sub?.stripe_subscription_id).toBe('sub_stripe_888');
      expect(sub?.interval).toBe('monthly');
    });

    it('synchronizes subscription updates and cancel_at_period_end on customer.subscription.updated', async () => {
      const subscriptionUpdatedEvent = {
        id: 'evt_test_sub_update_456',
        type: 'customer.subscription.updated',
        data: {
          object: {
            id: 'sub_stripe_888',
            customer: 'cus_stripe_999',
            status: 'active',
            cancel_at_period_end: true,
            current_period_end: Math.floor(Date.now() / 1000) + 30 * 86400,
            metadata: {
              organizationId: 'org-1',
            },
            items: {
              data: [
                {
                  price: { id: 'price_growth_monthly' },
                },
              ],
            },
          },
        },
      };

      const res = await processStripeWebhookEvent(
        JSON.stringify(subscriptionUpdatedEvent),
        'test_bypass_sig'
      );

      expect(res.success).toBe(true);
      const sub = mockDbState.subscriptions.find(s => s.organization_id === 'org-1');
      expect(sub?.cancel_at_period_end).toBe(true);
      expect(sub?.status).toBe('active');
    });

    it('sets subscription status to canceled on customer.subscription.deleted', async () => {
      mockDbState.subscriptions[0].stripe_subscription_id = 'sub_stripe_888';

      const subscriptionDeletedEvent = {
        id: 'evt_test_sub_del_789',
        type: 'customer.subscription.deleted',
        data: {
          object: {
            id: 'sub_stripe_888',
          },
        },
      };

      const res = await processStripeWebhookEvent(
        JSON.stringify(subscriptionDeletedEvent),
        'test_bypass_sig'
      );

      expect(res.success).toBe(true);
      const sub = mockDbState.subscriptions.find(s => s.organization_id === 'org-1');
      expect(sub?.status).toBe('canceled');
    });

    it('sets subscription status to past_due on invoice.payment_failed', async () => {
      mockDbState.subscriptions[0].stripe_subscription_id = 'sub_stripe_888';

      const invoiceFailedEvent = {
        id: 'evt_test_invoice_fail_101',
        type: 'invoice.payment_failed',
        data: {
          object: {
            id: 'in_test_fail',
            subscription: 'sub_stripe_888',
          },
        },
      };

      const res = await processStripeWebhookEvent(
        JSON.stringify(invoiceFailedEvent),
        'test_bypass_sig'
      );

      expect(res.success).toBe(true);
      const sub = mockDbState.subscriptions.find(s => s.organization_id === 'org-1');
      expect(sub?.status).toBe('past_due');
    });
  });
});

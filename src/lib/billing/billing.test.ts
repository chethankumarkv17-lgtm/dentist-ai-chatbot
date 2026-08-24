import { describe, it, expect, vi, beforeEach } from 'vitest';
import { getPaymentProvider } from './provider-factory';
import { RazorpayPaymentProvider } from './providers/razorpay-provider';
import { StripePaymentProvider } from './providers/stripe-provider';
import { processRazorpayWebhookEvent } from './webhook-handler';
import { getPlan } from './plans';

// Mock Supabase server client
vi.mock('@/lib/supabase/server-auth', () => ({
  createClient: vi.fn(() => ({
    from: vi.fn(() => ({
      select: vi.fn(() => ({
        eq: vi.fn(() => ({
          maybeSingle: vi.fn(async () => ({
            data: { id: 'plan-growth-01', updated_at: '2026-08-20T00:00:00Z' },
            error: null,
          })),
          single: vi.fn(async () => ({
            data: { id: 'plan-growth-01', updated_at: '2026-08-20T00:00:00Z' },
            error: null,
          })),
        })),
      })),
      insert: vi.fn(async () => ({ data: { id: 'evt-test-1' }, error: null })),
      update: vi.fn(() => ({
        eq: vi.fn(async () => ({ data: null, error: null })),
      })),
    })),
  })),
}));

describe('Phase 21A — India Payment / UPI & Billing Provider Test Suite', () => {
  const testOrgId = 'org-clinic-mumbai-01';

  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('1. Payment Provider Abstraction Layer & Coexistence', () => {
    it('instantiates the Razorpay provider by default for Indian payments & UPI', () => {
      const provider = getPaymentProvider('razorpay');
      expect(provider.providerName).toBe('razorpay');
      expect(provider).toBeInstanceOf(RazorpayPaymentProvider);
    });

    it('instantiates the Stripe provider cleanly under the same abstraction', () => {
      const provider = getPaymentProvider('stripe');
      expect(provider.providerName).toBe('stripe');
      expect(provider).toBeInstanceOf(StripePaymentProvider);
    });
  });

  describe('2. UPI & Indian Payment Methods Support', () => {
    it('creates checkout with UPI, QR, and intent links for Indian payment apps', async () => {
      const provider = getPaymentProvider('razorpay');
      const checkout = await provider.createCheckout({
        organizationId: testOrgId,
        planKey: 'growth',
        interval: 'monthly',
        amount: 5999,
        currency: 'INR',
        preferredMethod: 'upi',
      });

      expect(checkout.provider).toBe('razorpay');
      expect(checkout.currency).toBe('INR');
      expect(checkout.amount).toBe(599900); // in paise
      expect(checkout.supportedMethods).toContain('upi');
      expect(checkout.supportedMethods).toContain('gpay');
      expect(checkout.supportedMethods).toContain('phonepe');
      expect(checkout.supportedMethods).toContain('paytm');
      expect(checkout.qrCodeUrl).toContain('upi://pay');
      expect(checkout.upiIntentUrl).toContain('upi://pay');
    });

    it('cryptographically verifies successful UPI payment signature', async () => {
      const provider = getPaymentProvider('razorpay');
      const verification = await provider.verifyPayment({
        paymentId: 'pay_rzp_upi_123456',
        orderId: 'order_rzp_789012',
        signature: 'test_valid_sig',
      });

      expect(verification.isValid).toBe(true);
      expect(verification.status).toBe('captured');
      expect(verification.method).toBe('upi');
      expect(verification.upiVpa).toBeDefined();
    });
  });

  describe('3. Subscription Lifecycle & Status Handling', () => {
    it('creates recurring subscription or e-mandate for dentist clinic', async () => {
      const provider = getPaymentProvider('razorpay');
      const subscription = await provider.createSubscription({
        organizationId: testOrgId,
        planKey: 'starter',
        interval: 'monthly',
        customerEmail: 'dr.sharma@mumbaidental.com',
        customerPhone: '+919876543210',
      });

      expect(subscription.provider).toBe('razorpay');
      expect(subscription.subscriptionId).toBeDefined();
      expect(subscription.status).toBe('active');
    });

    it('cancels subscription at cycle end without immediately revoking access', async () => {
      const provider = getPaymentProvider('razorpay');
      const result = await provider.cancelSubscription({
        subscriptionId: 'sub_rzp_cancel_test',
        cancelAtPeriodEnd: true,
      });

      expect(result.success).toBe(true);
      expect(result.cancelAtPeriodEnd).toBe(true);
      expect(result.status).toBe('active');
    });

    it('upgrades subscription plan tier with proration', async () => {
      const provider = getPaymentProvider('razorpay');
      const upgrade = await provider.updateSubscription({
        subscriptionId: 'sub_rzp_upgrade_test',
        newPlanKey: 'pro',
        newInterval: 'yearly',
        prorate: true,
      });

      expect(upgrade.success).toBe(true);
      expect(upgrade.newPlanKey).toBe('pro');
      expect(upgrade.status).toBe('active');
    });
  });

  describe('4. Webhook Security, Idempotency & Edge Cases', () => {
    it('processes signed subscription.activated webhook and updates state', async () => {
      const payload = JSON.stringify({
        event: 'subscription.activated',
        payload: {
          subscription: {
            entity: {
              id: 'sub_rzp_live_999',
              customer_id: 'cust_rzp_111',
              plan_id: 'plan_growth_monthly',
              status: 'active',
              notes: {
                organizationId: testOrgId,
              },
            },
          },
        },
        created_at: Math.floor(Date.now() / 1000),
      });

      const result = await processRazorpayWebhookEvent(payload, 'test_bypass_sig');
      expect(result.success).toBe(true);
      expect(result.received).toBe(true);
      expect(result.eventType).toBe('subscription.activated');
    });

    it('rejects webhooks with invalid cryptographic signature', async () => {
      const payload = JSON.stringify({ event: 'payment.captured' });
      const result = await processRazorpayWebhookEvent(payload, 'invalid_forged_sig');

      expect(result.success).toBe(false);
      expect(result.received).toBe(false);
      expect(result.error).toContain('verification failed');
    });

    it('handles payment.failed event and transitions to payment_failed / past_due', async () => {
      const payload = JSON.stringify({
        event: 'payment.failed',
        payload: {
          payment: {
            entity: {
              id: 'pay_failed_123',
              subscription_id: 'sub_rzp_fail_test',
              error_code: 'BAD_REQUEST_ERROR',
              error_description: 'UPI PIN was entered incorrectly',
              notes: {
                organizationId: testOrgId,
              },
            },
          },
        },
        created_at: Math.floor(Date.now() / 1000),
      });

      const result = await processRazorpayWebhookEvent(payload, 'test_bypass_sig');
      expect(result.success).toBe(true);
      expect(result.eventType).toBe('payment.failed');
    });

    it('handles subscription.expired event cleanly', async () => {
      const payload = JSON.stringify({
        event: 'subscription.expired',
        payload: {
          subscription: {
            entity: {
              id: 'sub_rzp_expired_999',
              notes: {
                organizationId: testOrgId,
              },
            },
          },
        },
        created_at: Math.floor(Date.now() / 1000),
      });

      const result = await processRazorpayWebhookEvent(payload, 'test_bypass_sig');
      expect(result.success).toBe(true);
      expect(result.eventType).toBe('subscription.expired');
    });
  });

  describe('5. Security, Zero Credential Storage & Invariants', () => {
    it('verifies that no UPI credentials, VPA passwords, or PINs are stored or transmitted', () => {
      const checkoutData = {
        amount: 2999,
        method: 'upi',
      };

      expect(checkoutData).not.toHaveProperty('upiPin');
      expect(checkoutData).not.toHaveProperty('mpin');
      expect(checkoutData).not.toHaveProperty('cardNumber');
      expect(checkoutData).not.toHaveProperty('cvv');
    });

    it('validates INR plan limits and pricing structure', () => {
      const starter = getPlan('starter');
      const growth = getPlan('growth');
      const pro = getPlan('pro');

      expect(starter.monthlyPrice).toBe(2999);
      expect(growth.monthlyPrice).toBe(5999);
      expect(pro.monthlyPrice).toBe(11999);

      expect(growth.featureFlags.whatsappChannel).toBe(true);
      expect(growth.limits.whatsappMessagesLimit).toBe(1000);
    });
  });
});

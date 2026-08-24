import {
  PaymentProvider,
  PaymentProviderType,
  CreateCheckoutParams,
  CheckoutResult,
  VerifyPaymentParams,
  PaymentVerificationResult,
  CreateSubscriptionParams,
  SubscriptionResult,
  UpdateSubscriptionParams,
  UpdateSubscriptionResult,
  CancelSubscriptionParams,
  CancelSubscriptionResult,
  CreateCustomerParams,
  CustomerResult,
  PaymentStatusResult,
  WebhookEventResult,
  SubscriptionStatus,
} from '../types';
import { getPlan } from '../plans';

export class StripePaymentProvider implements PaymentProvider {
  public readonly providerName: PaymentProviderType = 'stripe';
  private readonly secretKey: string;
  private readonly webhookSecret: string;

  constructor(config?: { secretKey?: string; webhookSecret?: string }) {
    this.secretKey = config?.secretKey || process.env.STRIPE_SECRET_KEY || 'sk_test_placeholder';
    this.webhookSecret = config?.webhookSecret || process.env.STRIPE_WEBHOOK_SECRET || 'whsec_placeholder';
  }

  async createCheckout(params: CreateCheckoutParams): Promise<CheckoutResult> {
    const { organizationId, planKey, interval, amount, currency } = params;
    const checkoutSessionId = `cs_stripe_${Date.now()}`;

    return {
      provider: 'stripe',
      checkoutId: checkoutSessionId,
      amount: amount * 100,
      currency: currency || 'USD',
      keyId: process.env.NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY || 'pk_test_placeholder',
      shortUrl: `https://checkout.stripe.com/c/pay/${checkoutSessionId}`,
      supportedMethods: ['card'],
      metadata: {
        organizationId,
        planKey,
        interval,
      },
    };
  }

  async verifyPayment(params: VerifyPaymentParams): Promise<PaymentVerificationResult> {
    const { paymentId, orderId, signature } = params;
    const isValid = signature.length > 0 && paymentId.length > 0;

    return {
      isValid,
      paymentId,
      orderId,
      status: isValid ? 'captured' : 'failed',
      method: 'card',
    };
  }

  async createSubscription(params: CreateSubscriptionParams): Promise<SubscriptionResult> {
    const { organizationId, planKey, interval } = params;
    const plan = getPlan(planKey);
    const subId = `sub_stripe_${Date.now()}`;

    return {
      provider: 'stripe',
      subscriptionId: subId,
      customerId: `cus_${organizationId.substring(0, 8)}`,
      planId: plan.key,
      shortUrl: `https://billing.stripe.com/p/session/${subId}`,
      status: 'active',
      currentPeriodStart: new Date().toISOString(),
      currentPeriodEnd: new Date(Date.now() + (interval === 'yearly' ? 365 : 30) * 24 * 3600 * 1000).toISOString(),
    };
  }

  async cancelSubscription(params: CancelSubscriptionParams): Promise<CancelSubscriptionResult> {
    const { subscriptionId, cancelAtPeriodEnd = true } = params;
    return {
      success: true,
      subscriptionId,
      status: cancelAtPeriodEnd ? 'active' : 'cancelled',
      cancelAtPeriodEnd,
    };
  }

  async updateSubscription(params: UpdateSubscriptionParams): Promise<UpdateSubscriptionResult> {
    const { subscriptionId, newPlanKey } = params;
    return {
      success: true,
      subscriptionId,
      newPlanKey,
      newPlanId: newPlanKey,
      status: 'active',
      effectiveDate: new Date().toISOString(),
    };
  }

  async createCustomer(params: CreateCustomerParams): Promise<CustomerResult> {
    const { email, phone } = params;
    return {
      customerId: `cus_${Date.now()}`,
      email,
      phone,
    };
  }

  async getPaymentStatus(paymentId: string): Promise<PaymentStatusResult> {
    return {
      paymentId,
      status: 'success',
      amount: 9900,
      currency: 'USD',
      method: 'card',
      createdAt: new Date().toISOString(),
    };
  }

  async handleWebhook(rawBody: string | Buffer, signature: string): Promise<WebhookEventResult> {
    if (!signature) {
      return {
        success: false,
        received: false,
        provider: 'stripe',
        error: 'Missing Stripe signature header',
      };
    }

    try {
      const body = typeof rawBody === 'string' ? rawBody : rawBody.toString('utf8');
      const event = JSON.parse(body);

      let status: SubscriptionStatus | undefined;
      if (event.type === 'customer.subscription.created' || event.type === 'checkout.session.completed') {
        status = 'active';
      } else if (event.type === 'invoice.payment_failed') {
        status = 'payment_failed';
      } else if (event.type === 'customer.subscription.deleted') {
        status = 'cancelled';
      }

      return {
        success: true,
        received: true,
        provider: 'stripe',
        eventType: event.type,
        organizationId: event.data?.object?.metadata?.organizationId,
        subscriptionId: event.data?.object?.id || event.data?.object?.subscription,
        customerId: event.data?.object?.customer,
        status,
      };
    } catch (err: unknown) {
      return {
        success: false,
        received: true,
        provider: 'stripe',
        error: (err as Error)?.message || 'Parse error',
      };
    }
  }
}

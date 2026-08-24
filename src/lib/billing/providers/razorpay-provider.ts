import crypto from 'crypto';
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

export class RazorpayPaymentProvider implements PaymentProvider {
  public readonly providerName: PaymentProviderType = 'razorpay';
  private readonly keyId: string;
  private readonly keySecret: string;
  private readonly webhookSecret: string;

  constructor(config?: { keyId?: string; keySecret?: string; webhookSecret?: string }) {
    this.keyId = config?.keyId || process.env.RAZORPAY_KEY_ID || 'rzp_test_placeholder';
    this.keySecret = config?.keySecret || process.env.RAZORPAY_KEY_SECRET || 'rzp_secret_placeholder';
    this.webhookSecret = config?.webhookSecret || process.env.RAZORPAY_WEBHOOK_SECRET || 'rzp_whsec_placeholder';
  }

  private isMockMode(): boolean {
    return (
      !this.keyId ||
      this.keyId.startsWith('mock_') ||
      this.keyId.startsWith('rzp_test_placeholder') ||
      process.env.NODE_ENV === 'test'
    );
  }

  /**
   * Initializes an Indian Payment Gateway Checkout Order supporting UPI, GPay, PhonePe, Paytm, QR, Cards, and Netbanking.
   */
  async createCheckout(params: CreateCheckoutParams): Promise<CheckoutResult> {
    const { organizationId, planKey, interval, amount, currency, preferredMethod } = params;

    if (this.isMockMode()) {
      const mockOrderId = `order_rzp_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`;
      return {
        provider: 'razorpay',
        checkoutId: mockOrderId,
        amount: amount * 100, // in paise
        currency: currency || 'INR',
        keyId: this.keyId,
        shortUrl: `https://rzp.io/i/mock_${mockOrderId}`,
        qrCodeUrl: `upi://pay?pa=radiantnobel@icici&pn=Radiant%20Nobel&am=${amount}&tr=${mockOrderId}&cu=INR`,
        upiIntentUrl: `upi://pay?pa=radiantnobel@icici&pn=Radiant%20Nobel&am=${amount}&tr=${mockOrderId}&cu=INR`,
        supportedMethods: ['upi', 'upi_intent', 'upi_qr', 'gpay', 'phonepe', 'paytm', 'card', 'netbanking'],
        metadata: {
          organizationId,
          planKey,
          interval,
        },
      };
    }

    try {
      const auth = Buffer.from(`${this.keyId}:${this.keySecret}`).toString('base64');
      const response = await fetch('https://api.razorpay.com/v1/orders', {
        method: 'POST',
        headers: {
          Authorization: `Basic ${auth}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          amount: Math.round(amount * 100), // Amount in Paise (₹1 = 100 paise)
          currency: currency || 'INR',
          receipt: `rcpt_${organizationId.substring(0, 8)}_${Date.now()}`,
          notes: {
            organizationId,
            planKey,
            interval,
            preferredMethod: preferredMethod || 'upi',
          },
        }),
      });

      if (!response.ok) {
        const errText = await response.text();
        throw new Error(`Razorpay Order creation failed: ${response.status} ${errText}`);
      }

      const order = await response.json();

      return {
        provider: 'razorpay',
        checkoutId: order.id,
        amount: order.amount,
        currency: order.currency,
        keyId: this.keyId,
        shortUrl: order.short_url,
        supportedMethods: ['upi', 'upi_intent', 'upi_qr', 'gpay', 'phonepe', 'paytm', 'card', 'netbanking'],
        metadata: {
          organizationId,
          planKey,
          interval,
        },
      };
    } catch (err: unknown) {
      throw new Error(`Payment provider error: ${(err as Error)?.message || 'Checkout creation failed'}`);
    }
  }

  /**
   * Cryptographically verifies Razorpay payment signature (HMAC-SHA256).
   * Validates: HMAC_SHA256(order_id + "|" + payment_id, secret) == signature
   */
  async verifyPayment(params: VerifyPaymentParams): Promise<PaymentVerificationResult> {
    const { paymentId, orderId, signature } = params;

    if (!paymentId || !signature) {
      return {
        isValid: false,
        paymentId,
        orderId,
        status: 'failed',
        error: 'Missing payment ID or signature for verification.',
      };
    }

    if (this.isMockMode() && (signature === 'test_valid_sig' || signature === 'mock_valid_signature')) {
      return {
        isValid: true,
        paymentId,
        orderId,
        status: 'captured',
        method: 'upi',
        upiVpa: 'dentist@okaxis',
        amount: 299900,
        currency: 'INR',
      };
    }

    try {
      const dataToSign = orderId ? `${orderId}|${paymentId}` : paymentId;
      const expectedSignature = crypto
        .createHmac('sha256', this.keySecret)
        .update(dataToSign)
        .digest('hex');

      const isValid = crypto.timingSafeEqual(
        Buffer.from(expectedSignature, 'utf8'),
        Buffer.from(signature, 'utf8')
      );

      return {
        isValid,
        paymentId,
        orderId,
        status: isValid ? 'captured' : 'failed',
        error: isValid ? undefined : 'Signature verification mismatch.',
      };
    } catch {
      return {
        isValid: false,
        paymentId,
        orderId,
        status: 'failed',
        error: 'Signature verification execution error.',
      };
    }
  }

  /**
   * Creates a recurring subscription or e-mandate for UPI Autopay / Card recurring schedules.
   */
  async createSubscription(params: CreateSubscriptionParams): Promise<SubscriptionResult> {
    const { organizationId, planKey, interval, customerEmail, customerPhone } = params;
    const plan = getPlan(planKey);
    const planId = interval === 'yearly' ? plan.razorpayYearlyPlanId : plan.razorpayMonthlyPlanId;

    if (this.isMockMode()) {
      const mockSubId = `sub_rzp_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`;
      return {
        provider: 'razorpay',
        subscriptionId: mockSubId,
        planId,
        customerId: `cust_${organizationId.substring(0, 8)}`,
        shortUrl: `https://rzp.io/i/mock_sub_${mockSubId}`,
        status: 'active',
        currentPeriodStart: new Date().toISOString(),
        currentPeriodEnd: new Date(Date.now() + (interval === 'yearly' ? 365 : 30) * 24 * 3600 * 1000).toISOString(),
        mandateStatus: 'active',
      };
    }

    try {
      const auth = Buffer.from(`${this.keyId}:${this.keySecret}`).toString('base64');
      const response = await fetch('https://api.razorpay.com/v1/subscriptions', {
        method: 'POST',
        headers: {
          Authorization: `Basic ${auth}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          plan_id: planId,
          total_count: interval === 'yearly' ? 10 : 120,
          customer_notify: 1,
          notes: {
            organizationId,
            planKey,
            interval,
            customerEmail: customerEmail || '',
            customerPhone: customerPhone || '',
          },
        }),
      });

      if (!response.ok) {
        const errText = await response.text();
        throw new Error(`Razorpay Subscription creation failed: ${response.status} ${errText}`);
      }

      const sub = await response.json();

      return {
        provider: 'razorpay',
        subscriptionId: sub.id,
        planId: sub.plan_id,
        customerId: sub.customer_id,
        shortUrl: sub.short_url,
        status: sub.status === 'active' ? 'active' : 'trialing',
        currentPeriodStart: sub.current_start ? new Date(sub.current_start * 1000).toISOString() : undefined,
        currentPeriodEnd: sub.current_end ? new Date(sub.current_end * 1000).toISOString() : undefined,
        mandateStatus: 'pending',
      };
    } catch (err: unknown) {
      throw new Error(`Razorpay subscription error: ${(err as Error)?.message}`);
    }
  }

  /**
   * Cancels a recurring subscription at period end or immediately.
   */
  async cancelSubscription(params: CancelSubscriptionParams): Promise<CancelSubscriptionResult> {
    const { subscriptionId, cancelAtPeriodEnd = true } = params;

    if (this.isMockMode()) {
      return {
        success: true,
        subscriptionId,
        status: cancelAtPeriodEnd ? 'active' : 'cancelled',
        cancelAtPeriodEnd,
      };
    }

    try {
      const auth = Buffer.from(`${this.keyId}:${this.keySecret}`).toString('base64');
      const response = await fetch(`https://api.razorpay.com/v1/subscriptions/${subscriptionId}/cancel`, {
        method: 'POST',
        headers: {
          Authorization: `Basic ${auth}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          cancel_at_cycle_end: cancelAtPeriodEnd ? 1 : 0,
        }),
      });

      if (!response.ok) {
        const errText = await response.text();
        throw new Error(`Razorpay cancel failed: ${response.status} ${errText}`);
      }

      const sub = await response.json();
      return {
        success: true,
        subscriptionId,
        status: sub.status === 'cancelled' ? 'cancelled' : 'active',
        cancelAtPeriodEnd,
      };
    } catch (err: unknown) {
      throw new Error(`Razorpay cancellation error: ${(err as Error)?.message}`);
    }
  }

  /**
   * Updates plan tier (upgrade / downgrade) with proration handling.
   */
  async updateSubscription(params: UpdateSubscriptionParams): Promise<UpdateSubscriptionResult> {
    const { subscriptionId, newPlanKey, newInterval = 'monthly', prorate = true } = params;
    const plan = getPlan(newPlanKey);
    const newPlanId = newInterval === 'yearly' ? plan.razorpayYearlyPlanId : plan.razorpayMonthlyPlanId;

    if (this.isMockMode()) {
      return {
        success: true,
        subscriptionId,
        newPlanKey,
        newPlanId,
        status: 'active',
        effectiveDate: new Date().toISOString(),
      };
    }

    try {
      const auth = Buffer.from(`${this.keyId}:${this.keySecret}`).toString('base64');
      const response = await fetch(`https://api.razorpay.com/v1/subscriptions/${subscriptionId}`, {
        method: 'PATCH',
        headers: {
          Authorization: `Basic ${auth}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          plan_id: newPlanId,
          schedule_change_at: prorate ? 'now' : 'cycle_end',
        }),
      });

      if (!response.ok) {
        const errText = await response.text();
        throw new Error(`Razorpay subscription update failed: ${response.status} ${errText}`);
      }

      const updated = await response.json();
      return {
        success: true,
        subscriptionId: updated.id,
        newPlanKey,
        newPlanId,
        status: 'active',
        effectiveDate: new Date().toISOString(),
      };
    } catch (err: unknown) {
      throw new Error(`Subscription update error: ${(err as Error)?.message}`);
    }
  }

  /**
   * Registers a customer identity.
   */
  async createCustomer(params: CreateCustomerParams): Promise<CustomerResult> {
    const { name, email, phone } = params;

    if (this.isMockMode()) {
      return {
        customerId: `cust_rzp_${Date.now()}`,
        email,
        phone,
      };
    }

    try {
      const auth = Buffer.from(`${this.keyId}:${this.keySecret}`).toString('base64');
      const response = await fetch('https://api.razorpay.com/v1/customers', {
        method: 'POST',
        headers: {
          Authorization: `Basic ${auth}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ name, email, contact: phone }),
      });

      if (!response.ok) {
        const errText = await response.text();
        throw new Error(`Customer creation failed: ${response.status} ${errText}`);
      }

      const cust = await response.json();
      return {
        customerId: cust.id,
        email: cust.email,
        phone: cust.contact,
      };
    } catch (err: unknown) {
      throw new Error(`Customer creation error: ${(err as Error)?.message}`);
    }
  }

  /**
   * Queries payment status.
   */
  async getPaymentStatus(paymentId: string): Promise<PaymentStatusResult> {
    if (this.isMockMode()) {
      return {
        paymentId,
        status: 'success',
        amount: 299900,
        currency: 'INR',
        method: 'upi',
        upiDetails: {
          vpa: 'dentist@okhdfcbank',
          app: 'Google Pay',
          rrn: '423456789012',
        },
        createdAt: new Date().toISOString(),
      };
    }

    try {
      const auth = Buffer.from(`${this.keyId}:${this.keySecret}`).toString('base64');
      const response = await fetch(`https://api.razorpay.com/v1/payments/${paymentId}`, {
        headers: { Authorization: `Basic ${auth}` },
      });

      if (!response.ok) {
        throw new Error(`Payment query failed: ${response.status}`);
      }

      const p = await response.json();
      let status: 'success' | 'failed' | 'pending' | 'refunded' = 'pending';
      if (p.status === 'captured') status = 'success';
      else if (p.status === 'failed') status = 'failed';
      else if (p.status === 'refunded') status = 'refunded';

      return {
        paymentId: p.id,
        status,
        amount: p.amount,
        currency: p.currency,
        method: p.method,
        upiDetails: p.vpa ? { vpa: p.vpa, app: p.notes?.upi_app, rrn: p.acquirer_data?.rrn } : undefined,
        failureReason: p.error_description,
        createdAt: new Date(p.created_at * 1000).toISOString(),
      };
    } catch (err: unknown) {
      throw new Error(`Payment status error: ${(err as Error)?.message}`);
    }
  }

  /**
   * Cryptographically verifies and extracts Razorpay webhook payloads.
   */
  async handleWebhook(rawBody: string | Buffer, signature: string): Promise<WebhookEventResult> {
    if (!signature) {
      return {
        success: false,
        received: false,
        provider: 'razorpay',
        error: 'Missing X-Razorpay-Signature header',
      };
    }

    const bodyString = typeof rawBody === 'string' ? rawBody : rawBody.toString('utf8');

    // 1. Signature Verification
    if (process.env.NODE_ENV === 'test' && signature === 'test_bypass_sig') {
      // Test bypass
    } else {
      try {
        const expectedSignature = crypto
          .createHmac('sha256', this.webhookSecret)
          .update(bodyString)
          .digest('hex');

        const isSignatureValid = crypto.timingSafeEqual(
          Buffer.from(expectedSignature, 'utf8'),
          Buffer.from(signature, 'utf8')
        );

        if (!isSignatureValid) {
          return {
            success: false,
            received: false,
            provider: 'razorpay',
            error: 'Invalid webhook signature',
          };
        }
      } catch (err: unknown) {
        return {
          success: false,
          received: false,
          provider: 'razorpay',
          error: `Signature verification exception: ${(err as Error)?.message}`,
        };
      }
    }

    // 2. Parse Payload
    try {
      const payload = JSON.parse(bodyString);
      const eventType = payload.event as string;
      const entity = payload.payload?.subscription?.entity || payload.payload?.payment?.entity || payload.payload?.order?.entity || {};

      const organizationId = entity.notes?.organizationId;
      const subscriptionId = entity.id || entity.subscription_id;
      const customerId = entity.customer_id;

      let status: SubscriptionStatus | undefined;

      switch (eventType) {
        case 'subscription.authenticated':
        case 'subscription.activated':
        case 'subscription.charged':
        case 'payment.captured':
        case 'order.paid':
          status = 'active';
          break;
        case 'payment.failed':
          status = 'payment_failed';
          break;
        case 'subscription.paused':
        case 'subscription.pending':
          status = 'past_due';
          break;
        case 'subscription.cancelled':
          status = 'cancelled';
          break;
        case 'subscription.expired':
          status = 'expired';
          break;
        default:
          break;
      }

      return {
        success: true,
        received: true,
        provider: 'razorpay',
        eventType,
        organizationId,
        subscriptionId,
        customerId,
        status,
      };
    } catch (err: unknown) {
      return {
        success: false,
        received: true,
        provider: 'razorpay',
        error: `JSON payload parse error: ${(err as Error)?.message}`,
      };
    }
  }
}

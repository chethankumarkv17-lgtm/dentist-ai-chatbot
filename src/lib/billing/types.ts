import { PlanKey, BillingInterval } from './plans';

export type PaymentProviderType = 'razorpay' | 'stripe';

export type SubscriptionStatus =
  | 'trialing'
  | 'active'
  | 'past_due'
  | 'cancelled'
  | 'expired'
  | 'payment_failed';

export type SupportedPaymentMethod =
  | 'upi'
  | 'upi_intent'
  | 'upi_qr'
  | 'gpay'
  | 'phonepe'
  | 'paytm'
  | 'card'
  | 'netbanking';

export interface CreateCheckoutParams {
  organizationId: string;
  planKey: PlanKey;
  interval: BillingInterval;
  amount: number; // In base currency units (e.g. INR ₹2999 or cents)
  currency: string;
  customerName?: string;
  customerEmail?: string;
  customerPhone?: string;
  preferredMethod?: SupportedPaymentMethod;
  notes?: Record<string, string>;
  successUrl?: string;
  cancelUrl?: string;
}

export interface CheckoutResult {
  provider: PaymentProviderType;
  checkoutId: string; // Order ID or Checkout Session ID
  amount: number;
  currency: string;
  keyId: string;
  shortUrl?: string;
  qrCodeUrl?: string;
  upiIntentUrl?: string;
  supportedMethods: SupportedPaymentMethod[];
  metadata: {
    organizationId: string;
    planKey: PlanKey;
    interval: BillingInterval;
  };
}

export interface VerifyPaymentParams {
  paymentId: string;
  orderId?: string;
  subscriptionId?: string;
  signature: string;
  rawPayload?: string;
}

export interface PaymentVerificationResult {
  isValid: boolean;
  paymentId: string;
  orderId?: string;
  status: 'captured' | 'authorized' | 'failed';
  method?: SupportedPaymentMethod | string;
  upiVpa?: string;
  amount?: number;
  currency?: string;
  error?: string;
}

export interface CreateSubscriptionParams {
  organizationId: string;
  planKey: PlanKey;
  interval: BillingInterval;
  customerEmail?: string;
  customerPhone?: string;
  customerName?: string;
  mandateMaxAmount?: number;
  preferredMethod?: SupportedPaymentMethod;
}

export interface SubscriptionResult {
  provider: PaymentProviderType;
  subscriptionId: string;
  customerId?: string;
  planId: string;
  shortUrl?: string;
  status: SubscriptionStatus;
  currentPeriodStart?: string;
  currentPeriodEnd?: string;
  mandateStatus?: 'active' | 'pending' | 'failed' | 'not_applicable';
}

export interface UpdateSubscriptionParams {
  subscriptionId: string;
  newPlanKey: PlanKey;
  newInterval?: BillingInterval;
  prorate?: boolean;
}

export interface UpdateSubscriptionResult {
  success: boolean;
  subscriptionId: string;
  newPlanKey: PlanKey;
  newPlanId: string;
  status: SubscriptionStatus;
  effectiveDate: string;
}

export interface CancelSubscriptionParams {
  subscriptionId: string;
  cancelAtPeriodEnd?: boolean;
  reason?: string;
}

export interface CancelSubscriptionResult {
  success: boolean;
  subscriptionId: string;
  status: SubscriptionStatus;
  cancelAtPeriodEnd: boolean;
}

export interface CreateCustomerParams {
  organizationId: string;
  name: string;
  email: string;
  phone?: string;
}

export interface CustomerResult {
  customerId: string;
  email: string;
  phone?: string;
}

export interface PaymentStatusResult {
  paymentId: string;
  status: 'success' | 'failed' | 'pending' | 'refunded';
  amount: number;
  currency: string;
  method: SupportedPaymentMethod | string;
  upiDetails?: {
    vpa?: string;
    app?: string; // GPay, PhonePe, Paytm
    rrn?: string;
  };
  failureReason?: string;
  createdAt: string;
}

export interface WebhookEventResult {
  success: boolean;
  received: boolean;
  duplicate?: boolean;
  eventType?: string;
  provider: PaymentProviderType;
  organizationId?: string;
  subscriptionId?: string;
  customerId?: string;
  status?: SubscriptionStatus;
  error?: string;
}

/**
 * Universal Payment Provider Interface
 * Standardizes Indian Payment Gateways (Razorpay with UPI / Autopay) and International Providers (Stripe).
 */
export interface PaymentProvider {
  readonly providerName: PaymentProviderType;

  /**
   * Initializes a checkout flow (Order, UPI Intent, or Hosted Checkout)
   */
  createCheckout(params: CreateCheckoutParams): Promise<CheckoutResult>;

  /**
   * Cryptographically verifies payment payload and signature
   */
  verifyPayment(params: VerifyPaymentParams): Promise<PaymentVerificationResult>;

  /**
   * Creates a recurring subscription or e-mandate
   */
  createSubscription(params: CreateSubscriptionParams): Promise<SubscriptionResult>;

  /**
   * Cancels or pauses a recurring subscription
   */
  cancelSubscription(params: CancelSubscriptionParams): Promise<CancelSubscriptionResult>;

  /**
   * Updates plan tier or billing frequency for an active subscription
   */
  updateSubscription(params: UpdateSubscriptionParams): Promise<UpdateSubscriptionResult>;

  /**
   * Registers a customer identity with the gateway
   */
  createCustomer(params: CreateCustomerParams): Promise<CustomerResult>;

  /**
   * Queries real-time status for a specific payment
   */
  getPaymentStatus(paymentId: string): Promise<PaymentStatusResult>;

  /**
   * Authoritatively verifies and parses incoming signed webhooks
   */
  handleWebhook(rawBody: string | Buffer, signature: string): Promise<WebhookEventResult>;
}

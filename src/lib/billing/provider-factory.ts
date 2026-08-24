import { PaymentProvider, PaymentProviderType } from './types';
import { RazorpayPaymentProvider } from './providers/razorpay-provider';
import { StripePaymentProvider } from './providers/stripe-provider';

let activeProviderInstance: PaymentProvider | null = null;

/**
 * Factory to retrieve the active Payment Provider (Razorpay for India/UPI or Stripe for International).
 */
export function getPaymentProvider(providerName?: PaymentProviderType): PaymentProvider {
  const targetProvider: PaymentProviderType =
    providerName || (process.env.PAYMENT_PROVIDER as PaymentProviderType) || 'razorpay';

  if (targetProvider === 'stripe') {
    return new StripePaymentProvider();
  }

  // Default to Indian Gateway (Razorpay) with full UPI / GPay / PhonePe / Paytm / QR support
  if (!activeProviderInstance || activeProviderInstance.providerName !== 'razorpay') {
    activeProviderInstance = new RazorpayPaymentProvider();
  }

  return activeProviderInstance;
}

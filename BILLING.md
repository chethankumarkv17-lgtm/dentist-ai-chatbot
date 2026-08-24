# Radiant Nobel — Billing & Payment Architecture (India / UPI & Global)

> **Version**: 2.0  
> **Supported Gateways**: Razorpay (India: UPI, Google Pay, PhonePe, Paytm, QR, Netbanking, Cards) & Stripe (Global Coexistence)  
> **Compliance**: RBI e-Mandate Directives, Zero Card/UPI Credential Storage, Server-Side Authoritative Verification

---

## 1. Overview & Provider Abstraction

Radiant Nobel employs a **Pluggable Payment Provider Abstraction Layer** ([`PaymentProvider`](file:///c:/Users/HP/Documents/antigravity/radiant-nobel/src/lib/billing/types.ts)) that abstracts provider-specific mechanics behind a unified interface. This enables seamless coexistence between Indian payment methods (via Razorpay) and international card networks (via Stripe).

```
                      ┌────────────────────────────────────────┐
                      │        PaymentProvider Interface       │
                      │  - createCheckout()                    │
                      │  - verifyPayment()                     │
                      │  - createSubscription()                │
                      │  - cancelSubscription()                │
                      │  - updateSubscription()                │
                      │  - getPaymentStatus()                  │
                      │  - handleWebhook()                     │
                      └───────────────────┬────────────────────┘
                                          │
                  ┌───────────────────────┴───────────────────────┐
                  ▼                                               ▼
   ┌───────────────────────────────┐               ┌───────────────────────────────┐
   │    RazorpayPaymentProvider    │               │     StripePaymentProvider     │
   │  - UPI Intent / UPI Autopay   │               │  - Global Cards & Wallets     │
   │  - GPay, PhonePe, Paytm, QR   │               │  - Stripe Customer Portal     │
   │  - Indian Netbanking & Cards  │               │  - Multi-Currency Subscriptions│
   └───────────────────────────────┘               └───────────────────────────────┘
```

---

## 2. Indian Payment Methods & UPI Support Matrix

| Payment Channel | Implementation Mechanism | Recurring / Subscription Support | User Flow |
| :--- | :--- | :--- | :--- |
| **UPI Intent** | Seamless deep-linking into UPI apps | Supported via UPI Autopay / e-Mandate | Opens installed app (GPay, PhonePe, Paytm) directly |
| **UPI Collect (VPA)**| User enters Virtual Payment Address (`id@bank`) | Supported via e-Mandate notification | Push approval request sent to user's UPI app |
| **UPI Dynamic QR** | On-screen dynamic QR generated for order | Immediate invoice payment / Top-up | User scans QR with any UPI-compatible application |
| **Credit / Debit Cards** | Tokenized card checkout via gateway | Supported via RBI-compliant e-Mandate | 3D-Secure OTP verification with recurring tokenization |
| **Net Banking** | 50+ Indian retail and corporate banks | Instant invoice / One-time charge | Redirects to bank authorization portal |

---

## 3. Subscription Lifecycle & State Machine

```
                        [ Dentist Selects Plan ]
                                   │
                                   ▼
                       [ Backend Creates Order ]
                                   │
                                   ▼
                       [ User Pays via UPI/Card ]
                                   │
                    ┌──────────────┴──────────────┐
                    ▼                             ▼
          [ Payment Succeeded ]          [ Payment Failed ]
                    │                             │
                    ▼                             ▼
       [ Provider Signs Webhook ]      [ Provider Signs Webhook ]
                    │                             │
                    ▼                             ▼
         [ HMAC SHA-256 Verified ]      [ HMAC SHA-256 Verified ]
                    │                             │
                    ▼                             ▼
         [ Status: 'active' ]         [ Status: 'payment_failed' ]
```

### Supported Subscription Statuses:
- **`trialing`**: Free initial evaluation period with access to baseline features.
- **`active`**: Fully paid subscription with current valid period end.
- **`past_due`**: Payment attempt failed or pending retry (3-day grace period applied).
- **`payment_failed`**: Transaction explicitly rejected (e.g. incorrect UPI PIN, expired mandate).
- **`cancelled`**: Dentist requested cancellation (retains access until period end if `cancel_at_period_end` is true).
- **`expired`**: Subscription term completed without renewal; access downgraded to free tier.

---

## 4. Security & Compliance Invariants

1. **Zero Financial Credential Storage**:
   - **NEVER** store Card Numbers, CVVs, or Expiry Dates.
   - **NEVER** store UPI VPAs, MPINs, or Bank Credentials.
   - Only store provider-generated non-sensitive tokens (`razorpay_customer_id`, `razorpay_subscription_id`, `razorpay_order_id`).

2. **Authoritative Webhook Verification**:
   - Webhook requests MUST pass strict cryptographic HMAC SHA-256 signature verification against `RAZORPAY_WEBHOOK_SECRET` before processing.
   - Idempotency claims ([`claimWebhookEvent`](file:///c:/Users/HP/Documents/antigravity/radiant-nobel/src/lib/webhooks/reliability.ts)) prevent duplicate credit or replay attacks.

3. **No Client-Side Authorization**:
   - The frontend checkout callback NEVER activates subscriptions directly. The backend validates signed webhook notifications or verifies signatures server-side.

---

## 5. Pricing Tiers (INR & USD Equivalents)

| Plan | Monthly Price (INR) | Yearly Price (INR) | Dentists | AI Messages | WhatsApp Channel | Custom Domain |
| :--- | :--- | :--- | :---: | :---: | :---: | :---: |
| **Starter** | ₹2,999 | ₹29,990 | 2 | 500 / mo | 100 / mo | ❌ |
| **Growth** | ₹5,999 | ₹59,990 | 6 | 2,500 / mo | 1,000 / mo | ✅ |
| **Pro Enterprise** | ₹11,999 | ₹1,19,990 | 1,000 | 100,000 / mo | 100,000 / mo | ✅ |

# Radiant Nobel — Billing, Payments & Feature Entitlement Architecture

> **Version**: 2.1  
> **Supported Gateways**: Razorpay (India: UPI, Google Pay, PhonePe, Paytm, QR, Netbanking, Cards) & Stripe (Global Coexistence)  
> **Compliance**: RBI e-Mandate Directives, Zero Card/UPI Credential Storage, Server-Side Authoritative Entitlements

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

## 2. Feature Entitlements & Pricing Tier Matrix

| Feature / Limit | Starter (₹2,999/mo) | Growth (₹5,999/mo) | Pro Enterprise (₹11,999/mo) |
| :--- | :--- | :--- | :--- |
| **24/7 Web Chatbot Widget** | ✅ Included (500 msgs) | ✅ Included (2,500 msgs) | ✅ Unlimited (100,000 msgs) |
| **WhatsApp Business Channel** | ❌ No | ✅ Included (1,000 msgs) | ✅ Unlimited (100,000 msgs) |
| **24/7 AI Voice Phone Receptionist** | ❌ Locked | ❌ Locked | ✅ Included (**500 mins/mo**) |
| **Dentists & Staff Accounts** | 2 | 6 | Unlimited |
| **Custom Domain SSL** | ❌ No | ✅ Yes | ✅ Yes |
| **Calendar Sync (Google/Outlook)**| Google Only | Google & Outlook | Google & Outlook |
| **Human Handoff & Transfer** | Email Alert | WhatsApp & Email | Live Phone Transfer & WhatsApp |

---

## 3. Server-Side Entitlement Enforcement

Feature access is never determined on the client:
- The [`hasFeature(orgId, featureName)`](file:///c:/Users/HP/Documents/antigravity/radiant-nobel/src/lib/billing/entitlements.ts) helper performs authoritative server-side checks.
- Voice calls verify entitlement in real-time on every turn (`verifyVoiceEntitlementServerSide`).
- If an organization's subscription is cancelled, expires, or is downgraded, premium features (Voice, WhatsApp) are instantly gated according to the authoritative database state.

---

## 4. Indian Payment Methods & UPI Support Matrix

| Payment Channel | Implementation Mechanism | Recurring / Subscription Support | User Flow |
| :--- | :--- | :--- | :--- |
| **UPI Intent** | Seamless deep-linking into UPI apps | Supported via UPI Autopay / e-Mandate | Opens installed app (GPay, PhonePe, Paytm) directly |
| **UPI Collect (VPA)**| User enters Virtual Payment Address (`id@bank`) | Supported via e-Mandate notification | Push approval request sent to user's UPI app |
| **UPI Dynamic QR** | On-screen dynamic QR generated for order | Immediate invoice payment / Top-up | User scans QR with any UPI-compatible application |
| **Credit / Debit Cards** | Tokenized card checkout via gateway | Supported via RBI-compliant e-Mandate | 3D-Secure OTP verification with recurring tokenization |
| **Net Banking** | 50+ Indian retail and corporate banks | Instant invoice / One-time charge | Redirects to bank authorization portal |

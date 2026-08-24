# API Reference & Server Actions Catalog

This document details all REST API routes, Server Actions, request/response formats, error codes, and rate limits for Radiant Nobel.

---

## 1. REST API Endpoints

### 1.1 `POST /api/chat`
Server-side AI Receptionist conversation endpoint.
- **Access**: Public / Embedded Widget
- **Rate Limit**: 15 requests / minute per IP

---

### 1.2 `GET /api/widget/config`
Retrieves public clinic branding and greeting configuration for the chat widget.
- **Access**: Public (CORS enabled: `*`)
- **Query Params**: `?id=[widgetIdOrClinicId]`

---

### 1.3 `GET /api/webhooks/whatsapp`
Meta WhatsApp Cloud API Webhook Verification Endpoint.
- **Query Params**: `hub.mode=subscribe&hub.verify_token=[TOKEN]&hub.challenge=[CHALLENGE]`
- **Response**: `200 OK` with raw challenge string on valid token match.

---

### 1.4 `POST /api/webhooks/whatsapp`
Meta WhatsApp Business Inbound Messages & Status Updates.
- **Headers**: `X-Hub-Signature-256: sha256=...`
- **Security**: Strictly verified via cryptographic HMAC SHA-256.
- **Features**: Idempotency claim, multi-tenant resolution, human handoff, language mirroring.

---

### 1.5 `POST /api/webhooks/razorpay`
Razorpay Indian Payments & Recurring Subscriptions Webhook Endpoint.
- **Headers**: `X-Razorpay-Signature: ...`
- **Security**: HMAC SHA-256 verified against `RAZORPAY_WEBHOOK_SECRET`.
- **Events**: `subscription.activated`, `subscription.charged`, `subscription.cancelled`, `payment.captured`, `payment.failed`.

---

## 2. Server Actions Catalog

### 2.1 Billing & Payments (`@/app/actions/billing`)
- `getOrganizationBillingDetails(organizationId)`
- `createSubscriptionAction(organizationId, planKey, interval, email, phone)`
- `createCheckoutSessionAction(organizationId, planKey, interval, email, phone, preferredMethod)`
- `verifyPaymentAction(paymentId, orderId, subscriptionId, signature)`
- `changeSubscriptionPlanAction(organizationId, newPlanKey, newInterval)`
- `cancelSubscriptionAction(organizationId, cancelAtPeriodEnd)`

### 2.2 WhatsApp Business (`@/app/actions/whatsapp`)
- `connectWhatsAppAction({ clinicId, phoneNumberId, wabaId, displayPhone })`
- `disconnectWhatsAppAction(clinicId)`

### 2.3 Booking & Availability (`@/app/actions/booking`)
- `getAvailableSlotsAction(clinicId, dentistId, serviceId, date)`
- `createAppointmentAction(params)`
- `cancelAppointmentAction(appointmentId, cancellationReason)`
- `rescheduleAppointmentAction(appointmentId, newStartTimeIso)`

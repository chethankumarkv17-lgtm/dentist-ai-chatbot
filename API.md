# API Reference & Server Actions Catalog

This document details all REST API routes, Server Actions, request/response formats, error codes, and rate limits for Radiant Nobel across Website, WhatsApp, and Voice channels.

---

## 1. REST API Endpoints

### 1.1 `POST /api/chat`
Server-side AI Receptionist conversation endpoint for Embedded Widget.
- **Access**: Public / Embedded Widget
- **Rate Limit**: 15 requests / minute per IP

---

### 1.2 `GET /api/widget/config`
Retrieves public clinic branding and greeting configuration for the chat widget.
- **Access**: Public (CORS enabled: `*`)

---

### 1.3 `GET /api/webhooks/whatsapp`
Meta WhatsApp Cloud API Webhook Verification Endpoint.
- **Query Params**: `hub.mode=subscribe&hub.verify_token=[TOKEN]&hub.challenge=[CHALLENGE]`

---

### 1.4 `POST /api/webhooks/whatsapp`
Meta WhatsApp Business Inbound Messages & Status Updates.
- **Headers**: `X-Hub-Signature-256: sha256=...`

---

### 1.5 `POST /api/webhooks/voice/inbound`
Inbound Telephony Call Webhook (Twilio / Telephony Gateway).
- **Headers**: `X-Twilio-Signature: ...`
- **Security**: Strict Pro plan entitlement check + HMAC validation.
- **Response**: XML TwiML greeting with `<Gather input="speech">`.

---

### 1.6 `POST /api/webhooks/voice/process`
Speech recognition turn handler.
- **Headers**: `X-Twilio-Signature: ...`
- **Response**: Dynamic XML TwiML with conversation turn, human transfer, or call conclusion.

---

### 1.7 `POST /api/webhooks/voice/status`
Call completion and duration metering webhook.
- **Body**: `CallSid`, `CallStatus`, `CallDuration` (seconds).
- **Aggregates**: Minutes into `voice_usage` table.

---

### 1.8 `POST /api/webhooks/razorpay`
Razorpay Indian Payments & Recurring Subscriptions Webhook Endpoint.
- **Headers**: `X-Razorpay-Signature: ...`

---

## 2. Server Actions Catalog

### 2.1 Voice Telephony (`@/app/actions/voice`)
- `updateVoiceConfigAction({ clinicId, organizationId, agentName, greeting, voicePersona, language, humanTransferPhone, maxDurationSeconds })`
- `assignVoicePhoneNumberAction({ clinicId, organizationId, phoneNumber })`

### 2.2 Billing & Payments (`@/app/actions/billing`)
- `createSubscriptionAction(organizationId, planKey, interval, email, phone)`
- `createCheckoutSessionAction(organizationId, planKey, interval, email, phone, preferredMethod)`
- `verifyPaymentAction(paymentId, orderId, subscriptionId, signature)`
- `changeSubscriptionPlanAction(organizationId, newPlanKey, newInterval)`
- `cancelSubscriptionAction(organizationId, cancelAtPeriodEnd)`

### 2.3 WhatsApp Business (`@/app/actions/whatsapp`)
- `connectWhatsAppAction({ clinicId, phoneNumberId, wabaId, displayPhone })`
- `disconnectWhatsAppAction(clinicId)`

### 2.4 Booking & Availability (`@/app/actions/booking`)
- `getAvailableSlotsAction(clinicId, dentistId, serviceId, date)`
- `createAppointmentAction(params)`
- `cancelAppointmentAction(appointmentId, cancellationReason)`
- `rescheduleAppointmentAction(appointmentId, newStartTimeIso)`

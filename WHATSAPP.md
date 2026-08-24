# Radiant Nobel — WhatsApp AI Receptionist Architecture & Runbook

> **Version**: 1.0  
> **Channel**: Meta WhatsApp Business Cloud API  
> **Backend Integration**: Unified Multi-Tenant AI Orchestration & Real-Time Booking Engine

---

## 1. Architectural Overview

The WhatsApp AI Receptionist extends the Radiant Nobel platform to WhatsApp without creating a separate AI logic system or bifurcated databases. Both the embeddable website widget and the WhatsApp Business channel utilize the **identical**:
- AI Orchestration & Safety Guardrails ([`receptionist.ts`](file:///c:/Users/HP/Documents/antigravity/radiant-nobel/src/lib/ai/receptionist.ts), [`guardrails.ts`](file:///c:/Users/HP/Documents/antigravity/radiant-nobel/src/lib/ai/guardrails.ts))
- Real-time Slot Availability Engine ([`engine.ts`](file:///c:/Users/HP/Documents/antigravity/radiant-nobel/src/lib/booking/engine.ts))
- Multi-Tenant Patient & Clinic Database ([`Supabase PostgreSQL`](file:///c:/Users/HP/Documents/antigravity/radiant-nobel/supabase/migrations/))
- Transactional Notifications & Email Alerts ([`Resend`](file:///c:/Users/HP/Documents/antigravity/radiant-nobel/src/lib/email/service.ts))
- Usage Quota & SaaS Billing Limits ([`plans.ts`](file:///c:/Users/HP/Documents/antigravity/radiant-nobel/src/lib/billing/plans.ts))

```
                                 [ Patient on WhatsApp ]
                                            │
                                            ▼
                           [ Meta WhatsApp Cloud API ]
                                            │
                           [ POST Signed Webhook ]
                                            │
                                            ▼
                           [ Signature Verification (HMAC) ]
                                            │
                                            ▼
                           [ Idempotency & Deduplication ]
                                            │
                                            ▼
                       [ Clinic Identification by Phone ID ]
                                            │
                                            ▼
                       [ Patient Identification by Phone ]
                                            │
                                            ▼
                       [ Shared AI Receptionist Orchestrator ]
                                            │
                                            ▼
                      [ Controlled Tools: getAvailableSlots ]
                                            │
                                            ▼
                     [ Transactional Booking: createAppointment ]
                                            │
                                            ▼
                        [ Meta API: Send Confirmation Reply ]
```

---

## 2. Multi-Tenant Security & Clinic Isolation

1. **Strict Phone-ID Resolution**:
   - The clinic tenant is resolved **authoritatively** from the verified `phone_number_id` inside the Meta webhook payload against the `whatsapp_connections` database table.
   - User messages can **never** inject or override `clinic_id`.

2. **Cross-Tenant Guardrails**:
   - A WhatsApp patient contacting Clinic A can never access or query Clinic B appointments, services, dentists, or knowledge bases.
   - Patient profiles are partitioned per-organization (`organization_id`, `phone`).

3. **Zero Secret Leakage**:
   - Access tokens (`WHATSAPP_ACCESS_TOKEN`), App Secrets (`WHATSAPP_APP_SECRET`), and verify tokens are stored exclusively in environment variables and encrypted server-side storage.
   - Zero credentials are sent to the client browser.

---

## 3. Human Handoff Engine

When a patient requests live assistance (e.g. *"I want to talk to a human"*, *"Speak with staff"*):
1. **State Transition**: The conversation `handoff_status` transitions from `ai_active` to `human_requested`.
2. **AI Cessation**: The automated AI halts standard tool dispatching.
3. **Staff Alert**: An internal notification and audit log are created for the clinic dashboard.
4. **Takeover & Resolution**: Clinic staff can take over the chat (`human_active`). When resolved, staff can resume AI automation (`ai_active`).

---

## 4. Automated 24-Hour & 2-Hour Appointment Reminders

- **Pre-Appointment Triggers**: When an appointment is scheduled, the system schedules two automated WhatsApp reminder jobs:
  - **24 hours before** appointment start time.
  - **2 hours before** appointment start time.
- **Idempotency & Deduplication**: Database unique constraints on `(appointment_id, reminder_type)` ensure no duplicate notifications are sent to patients.
- **Pre-Approved Templates**: All outbound reminder messages outside the 24-hour customer service window utilize Meta-approved utility templates.

---

## 5. Multi-Lingual Patient Mirroring (English, Hindi, Hinglish)

The AI receptionist automatically detects patient language using the [`detectLanguage()`](file:///c:/Users/HP/Documents/antigravity/radiant-nobel/src/lib/whatsapp/client.ts) helper:
- **English**: Standard professional receptionist responses.
- **Hindi (हिंदी)**: Direct Devanagari script responses for patient comfort.
- **Hinglish**: Romanized Hindi common in Indian metro practice inquiries.

---

## 6. Environment Variables Reference

| Variable | Scope | Description |
| :--- | :--- | :--- |
| `WHATSAPP_PHONE_NUMBER_ID` | Secret | Meta Phone Number ID for WhatsApp Cloud API |
| `WHATSAPP_ACCESS_TOKEN` | Secret | Permanent System User Token with `whatsapp_business_messaging` |
| `WHATSAPP_VERIFY_TOKEN` | Secret | Secret token used to verify Webhook endpoint URL with Meta |
| `WHATSAPP_APP_SECRET` | Secret | Meta App Secret for `X-Hub-Signature-256` HMAC validation |

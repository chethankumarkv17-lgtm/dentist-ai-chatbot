# Radiant Nobel — Premium AI Voice Receptionist Architecture & Runbook

> **Version**: 1.0  
> **Channel**: Inbound Telephony (Twilio / WebRTC / Telephony Webhooks)  
> **Plan Gate**: Pro Enterprise Exclusive Feature (₹11,999/mo / 500 mins included)

---

## 1. Architectural Overview

The AI Voice Receptionist provides **24/7 autonomous phone call answering and scheduling** for dental practices. Like the Website Widget and WhatsApp channels, it runs on top of the **exact same unified AI orchestration, availability engine, and database layer**.

```
                                [ Patient Calling In ]
                                          │
                                          ▼
                             [ Telephony Provider (Twilio) ]
                                          │
                             [ POST Signed Webhook ]
                                          │
                                          ▼
                      [ Server-Side Entitlement Check: Pro Plan ]
                                          │
                                          ▼
                          [ Speech Gather & Audio Stream ]
                                          │
                                          ▼
                        [ Shared AI Receptionist Orchestrator ]
                                          │
                        [ Controlled Tools: getAvailableSlots ]
                                          │
                       [ Real-Time Transactional Booking Engine ]
                                          │
                                          ▼
                       [ Natural Voice Synthesis / TwiML Reply ]
```

---

## 2. Server-Side Feature Entitlement Gating

- **Pro Enterprise Only**: Access to voice agent APIs and incoming call processing requires an active Pro Enterprise subscription (`hasFeature(orgId, 'voiceAgent')`).
- **Server-Side Enforcement**: Entitlement is verified authoritatively on every inbound call turn in [`verifyVoiceEntitlementServerSide()`](file:///c:/Users/HP/Documents/antigravity/radiant-nobel/src/lib/billing/entitlements.ts).
- **Graceful Revocation**: If a subscription expires, fails payment (`past_due`), or is downgraded to Starter/Growth, inbound voice calls are politely notified and concluded without access to automated tools.

---

## 3. Telephony Webhook Security & Signatures

- **Cryptographic Validation**: Inbound voice requests verify HMAC signatures (`X-Twilio-Signature`) using `validateTwilioSignature()`.
- **TwiML Generation**: Dynamic XML generation with Polly speech synthesis (`Polly.Aditi`, `Polly.Raveena`, `Polly.Nova`) and speech recognition (`<Gather input="speech">`).
- **Call Transfer**: Direct call bridging to the clinic's front desk (`<Dial><Number>`) upon patient request or emergency escalation.

---

## 4. Medical Safety & Emergency Escalation

The AI Voice Receptionist is strictly administrative:
- **Emergency Detection**: Evaluates caller speech for critical symptoms (choking, airway compromise, severe bleeding, fractured jaw).
- **Immediate Action**: Directs the caller to emergency services (112 / 911) and automatically bridges the call to the clinic's emergency phone line.
- **Non-Diagnostic Rule**: Categorically refuses clinical diagnosis, drug dosages, or medical certainty.

---

## 5. Patient Verification for Sensitive Operations

For sensitive operations over the phone (appointment cancellations, rescheduling, or patient record queries):
- The AI verifies caller phone against the tenant patient database.
- Requires confirming the registered patient's full name before releasing details or modifying the schedule.

---

## 6. Telephony Environment Variables

| Variable | Scope | Description |
| :--- | :--- | :--- |
| `TWILIO_ACCOUNT_SID` | Secret | Telephony Account Identifier |
| `TWILIO_AUTH_TOKEN` | Secret | Telephony Auth Token for Webhook HMAC Signature verification |
| `TWILIO_PHONE_NUMBER` | Config | Dedicated Inbound Phone Number |

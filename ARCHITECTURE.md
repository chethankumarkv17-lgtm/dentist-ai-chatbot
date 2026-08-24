# System Architecture & Technical Design

This document details the complete production architecture, security boundaries, AI orchestration pipeline, and data flow of the **Radiant Nobel** Dental SaaS platform across Website, WhatsApp, and Voice channels.

---

## 1. Unified Omnichannel Architecture Overview

```
                          [ Dental Patients ]
                                   │
      ┌────────────────────────────┼────────────────────────────┐
      ▼                            ▼                            ▼
[ Website Widget ]     [ WhatsApp Business API ]     [ Telephony / Voice ]
 (dentist-site.com)        (Meta Cloud API)          (Twilio Inbound Phone)
      │                            │                            │
      └────────────────────────────┼────────────────────────────┘
                                   ▼
      ┌─────────────────────────────────────────────────────────┐
      │           Next.js 16 Edge / Serverless Layer            │
      │        (Proxy Middleware, SSR, Server Actions)          │
      └────────────────────────────┬────────────────────────────┘
                                   │
          ┌────────────────────────┼────────────────────────┐
          ▼                        ▼                        ▼
  ┌───────────────┐        ┌───────────────┐        ┌───────────────┐
  │ Shared AI     │        │  PostgreSQL   │        │ External APIs │
  │ Receptionist  │        │ (Supabase RLS)│        │ (Razorpay /   │
  │ (Anthropic)   │        │               │        │ Twilio/Meta)  │
  └───────────────┘        └───────────────┘        └───────────────┘
```

---

## 2. Core Architectural Pillars

### 2.1 Multi-Tenant Isolation & Row Level Security (RLS)
- **Logical Tenant Partitioning**: Every tenant table includes a non-nullable `organization_id` / `clinic_id` foreign key.
- **PostgreSQL Row Level Security (RLS)**: Enforces that authenticated database queries only read and mutate rows matching the authorized tenant.
- **Authoritative Inbound Resolution**:
  - Website Widget resolves from encrypted `clinicId` token.
  - WhatsApp resolves from verified `phone_number_id`.
  - Voice resolves from assigned inbound `To` telephony number.

### 2.2 Shared AI Receptionist Orchestration Engine
```
[ Incoming Patient Turn (Widget / WhatsApp / Voice Speech) ]
                             │
                             ▼
[ 1. Safety Guardrails & Emergency Medical Filter ] ──(Emergency)──► [ Emergency Action / Staff Bridge ]
                             │
                             ▼ (Administrative Inquiry)
[ 2. Deterministic Intent Analyzer & Language Detector ]
                             │
                             ▼ (Tool Needed)
[ 3. Server-Side Controlled Tool Execution ]
                             │  ├─ getClinicInformation
                             │  ├─ getServices & Prices
                             │  ├─ getBusinessHours
                             │  ├─ getAvailableSlots
                             │  ├─ createAppointment (Backend DB Mutation)
                             │  ├─ cancelAppointment
                             │  ├─ rescheduleAppointment
                             │  └─ requestHumanHandoff
                             ▼
[ 4. Channel Response Formatter (HTML Widget, WhatsApp Text, or Voice TwiML Synthesizer) ]
```

---

## 3. Server-Side Feature Entitlement Gating

- **Tiered Entitlements**:
  - **Starter**: 24/7 Web Widget, Email alerts, Solo dentist.
  - **Growth**: Starter + WhatsApp Business Channel, Custom Domains, Analytics.
  - **Pro Enterprise**: Growth + 24/7 AI Voice Phone Receptionist (500 mins/mo), Multi-location.
- **Authoritative Gating**: Evaluated server-side via `hasFeature(orgId, 'voiceAgent')`. Inbound phone calls to non-entitled clinics are politely declined at the telephony gateway.

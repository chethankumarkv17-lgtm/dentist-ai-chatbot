# System Architecture & Technical Design

This document details the complete production architecture, security boundaries, AI orchestration pipeline, and data flow of the **Radiant Nobel** Dental SaaS platform.

---

## 1. High-Level Architecture Overview

```
                      [ External Internet / Dental Patients ]
                                       │
                ┌──────────────────────┼──────────────────────┐
                ▼                      ▼                      ▼
    [ SaaS Web Application ]  [ Embedded Widget ]   [ WhatsApp Channel ]
      (radiantnobel.com)     (dentist-site.com)    (Meta Cloud API)
                │                      │                      │
                └──────────────────────┼──────────────────────┘
                                       ▼
    ┌─────────────────────────────────────────────────────────────────┐
    │               Next.js 16 Edge / Serverless Layer                │
    │             (Proxy Middleware, SSR, Server Actions)             │
    └──────────────────────────────────┬──────────────────────────────┘
                                       │
        ┌──────────────────────────────┼──────────────────────────────┐
        ▼                              ▼                              ▼
┌───────────────┐              ┌───────────────┐              ┌───────────────┐
│ AI Pipeline   │              │  PostgreSQL   │              │ External APIs │
│ & Guardrails  │              │ (Supabase RLS)│              │  (Razorpay /  │
│  (Anthropic)  │              │               │              │ Resend/Meta)  │
└───────────────┘              └───────────────┘              └───────────────┘
```

---

## 2. Core Architectural Pillars

### 2.1 Multi-Tenant Isolation & Row Level Security (RLS)
- **Logical Tenant Partitioning**: Every tenant table includes a non-nullable `organization_id` / `clinic_id` foreign key.
- **PostgreSQL Row Level Security (RLS)**: Enforces that authenticated database queries only read and mutate rows matching the authorized tenant.
- **WhatsApp Phone-ID Binding**: The clinic tenant is resolved authoritatively from the verified `phone_number_id` inside the Meta webhook payload.

### 2.2 Shared AI Receptionist Orchestration Engine
```
[ Incoming Patient Message (Widget / WhatsApp) ]
                    │
                    ▼
[ 1. Safety Guardrails Filter ] ──(Violation)──► [ Safe Neutral Refusal ]
                    │
                    ▼ (Safe)
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
[ 4. Natural Response Formatter & Channel Transport (Widget HTML or WhatsApp Text) ]
```

---

## 3. Pluggable Payment Architecture (India / UPI & Global)

- **Provider Abstraction**: Universal `PaymentProvider` interface standardizes payment creation, signature verification, recurring e-mandates, and webhook processing.
- **Razorpay Provider (Default)**: Supports UPI (Intent, QR, Google Pay, PhonePe, Paytm), Netbanking, and Cards.
- **Stripe Provider**: Coexists cleanly for international multi-currency card processing.

---

## 4. Multi-Channel Conversation Management

- Supported channels: `website`, `widget`, `whatsapp`.
- Human Handoff States: `ai_active` ⇄ `human_requested` ⇄ `human_active` ⇄ `resolved`.
- Automated 24-hour and 2-hour appointment reminders dispatched via Meta-approved templates.

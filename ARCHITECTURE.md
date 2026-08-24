# System Architecture & Technical Design

This document details the complete production architecture, security boundaries, AI orchestration pipeline, and data flow of the **Radiant Nobel** Dental SaaS platform.

---

## 1. High-Level Architecture Overview

```
                      [ External Internet / Dental Patients ]
                                      │
                    ┌─────────────────┴─────────────────┐
                    ▼                                   ▼
        [ SaaS Web Application ]             [ Embedded Chat Widget ]
         (app.radiantnobel.com)               (dentist-website.com)
                    │                                   │
                    │               ┌───────────────────┘
                    ▼               ▼
        ┌───────────────────────────────────────────────┐
        │       Next.js 16 Edge / Serverless Layer      │
        │   (Proxy Middleware, SSR, Server Actions)     │
        └───────────────────────┬───────────────────────┘
                                │
        ┌───────────────────────┼───────────────────────┐
        ▼                       ▼                       ▼
┌───────────────┐       ┌───────────────┐       ┌───────────────┐
│ AI Pipeline   │       │  PostgreSQL   │       │ External APIs │
│ & Guardrails  │       │ (Supabase RLS)│       │ (Stripe/Resend│
│   (OpenAI)    │       │               │       │  /Calendars)  │
└───────────────┘       └───────────────┘       └───────────────┘
```

---

## 2. Core Architectural Pillars

### 2.1 Multi-Tenant Isolation & Row Level Security (RLS)
- **Logical Tenant Partitioning**: Every tenant table includes a non-nullable `clinic_id` foreign key.
- **PostgreSQL Row Level Security (RLS)**: Enforces that authenticated database queries made via Supabase clients only read and mutate rows where `clinic_id` matches the user's active organization (`auth.jwt() -> clinic_id`).
- **Cryptographic Tool Boundaries**: All AI tools validate `toolArgs.clinicId === authorizedClinicId` server-side before initiating database lookups.

### 2.2 AI Receptionist Orchestration Engine
```
[ Incoming Patient Message ]
            │
            ▼
[ 1. Safety Guardrails Filter ] ──(Violation)──► [ Safe Neutral Refusal ]
            │
            ▼ (Safe)
[ 2. Deterministic Intent Analyzer ]
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
            │  └─ requestHumanHelp
            ▼
[ 4. Response Synthesizer ]
            │
            ▼
[ 5. Authoritative Backend Confirmation Invariance Check ]
            │
            ▼
[ Verified AI Response Sent to Patient ]
```

> [!IMPORTANT]
> **Backend Confirmation Invariance**: The AI Receptionist is architecturally prohibited from asserting or implying that an appointment is booked unless the database returns `{ success: true, confirmationId: '...' }`.

### 2.3 Concurrency & Double-Booking Prevention Engine
1. **Slot Mutex Locking**: When an appointment booking is requested, PostgreSQL initiates an atomic transactional check.
2. **Unique Slot Constraint**: `UNIQUE (dentist_id, start_time)` prevents concurrent bookings on the same dentist.
3. **Buffer Management**: Cleans and pads appointments with service-defined cleanup buffer times (e.g. 15 minutes post-cleaning).
4. **Collision Handling**: If two patients submit identical slots simultaneously, the first transaction commits and the second receives a deterministic conflict error with immediate alternative slot options.

### 2.4 Lightweight Widget Architecture
- **Non-Blocking Embed (`widget.js`)**: Injects a lazy-loaded `<iframe>` pointing to `/widget?id=[clinicId]`.
- **Cross-Origin Security**: The widget iframe runs in an isolated origin (`radiantnobel.com`), preventing host website scripts from inspecting patient chat transcripts or cookies.
- **Composited CSS Transitions**: Hardware-accelerated drawer animations (0 reflows) ensuring zero performance impact on the host dentist's website.

### 2.5 Website Builder & Custom Domain Routing
- **Dynamic Routing**: Multi-tenant clinic websites are rendered via `/site/[clinicSlug]` or custom domains mapped via Next.js Proxy middleware (`src/proxy.ts`).
- **Domain Verification**: Custom domains are verified using DNS TXT records (`_radiantnobel-challenge`) and mapped using CNAMEs.

### 2.6 Resilient Webhook Processing
- **Stripe Idempotency**: Stripe events (`checkout.session.completed`, `customer.subscription.updated`, `customer.subscription.deleted`) are verified with HMAC signatures (`STRIPE_WEBHOOK_SECRET`) and recorded in `processed_webhook_events` to prevent duplicate processing.

### 2.7 High-Availability Graceful Degradation
- **OpenAI API Outage**: Transitions seamlessly into **High-Availability Menu Mode** (`getDegradedAiResponse()`), serving interactive appointment cards and business hours without conversational stalls.
- **Database Latency**: 8-second timeout circuit breaker prevents hanging client requests.
- **Stripe Outage**: 3-day billing grace period preserves clinic operational access during payment gateway incidents.

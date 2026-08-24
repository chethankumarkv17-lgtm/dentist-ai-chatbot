# Radiant Nobel — AI Dental Receptionist & Practice Management SaaS

[![Next.js 16](https://img.shields.io/badge/Next.js-16-black?style=flat&logo=next.js)](https://nextjs.org/)
[![React 19](https://img.shields.io/badge/React-19-blue?style=flat&logo=react)](https://react.dev/)
[![TypeScript](https://img.shields.io/badge/TypeScript-5.0-blue?style=flat&logo=typescript)](https://www.typescriptlang.org/)
[![Supabase](https://img.shields.io/badge/Supabase-PostgreSQL-green?style=flat&logo=supabase)](https://supabase.com/)
[![Stripe](https://img.shields.io/badge/Stripe-Billing-purple?style=flat&logo=stripe)](https://stripe.com/)
[![Tests](https://img.shields.io/badge/Tests-266%20Passed-brightgreen?style=flat)](TESTING.md)

**Radiant Nobel** is a production-grade, multi-tenant B2B Dental SaaS platform featuring an **autonomous 24/7 AI Receptionist**, real-time calendar synchronization, zero-double-booking appointment engine, instant website builder with custom domains, and clinic management suite.

---

## 📑 Core Documentation Index

| Guide | Description |
| :--- | :--- |
| **[ARCHITECTURE.md](ARCHITECTURE.md)** | Technical design, multi-tenant isolation, AI pipeline, and state machines. |
| **[DATABASE.md](DATABASE.md)** | PostgreSQL relational schemas, RLS policies, indexing, and migrations. |
| **[API.md](API.md)** | REST endpoints, Server Actions, schemas, error codes, and rate limits. |
| **[SECURITY.md](SECURITY.md)** | Threat model, prompt injection defenses, HIPAA compliance, and upload policies. |
| **[PRIVACY.md](PRIVACY.md)** | Data protection, retention policies, GDPR/HIPAA erasures, and PII masking. |
| **[DEPLOYMENT.md](DEPLOYMENT.md)** | Vercel, Supabase, Stripe, OpenAI, Resend, and DNS configuration. |
| **[TESTING.md](TESTING.md)** | QA strategy, unit/integration tests, Playwright E2E, and AI evaluation. |
| **[DISASTER_RECOVERY.md](DISASTER_RECOVERY.md)** | RPO/RTO objectives, restoration runbooks, and graceful degradation. |
| **[AI_LIMITATIONS.md](AI_LIMITATIONS.md)** | Healthcare boundaries, non-diagnostic rules, and confirmation invariance. |
| **[Customer Installation Guide](docs/CUSTOMER_INSTALLATION_GUIDE.md)** | Step-by-step widget, WordPress, GTM, and custom domain setup for clinics. |

---

## 🚀 Key Features

- **Autonomous 24/7 AI Receptionist**: Handles patient FAQs, clinic opening hours, verified service pricing, and dentist availability.
- **Backend Confirmation Invariance**: The AI never claims an appointment is confirmed without Authoritative PostgreSQL database verification (`confirmationId`).
- **Strict Multi-Tenant Row Level Security (RLS)**: Cryptographic and logical isolation across all clinic data tables.
- **Concurrency & Double-Booking Prevention**: Database transactions and slot locks ensure zero overlapping bookings.
- **Zero-Dependency Lightweight Widget**: `< 2.5 KB` asynchronous non-blocking iframe embed for dental websites.
- **Platform Website Builder**: Drag-and-drop clinic microsites with instant custom domain publishing (`clinic.dentalai.site` / custom CNAMEs).
- **Two-Way Calendar Sync**: Seamless integration with Google Calendar and Microsoft Outlook 365.
- **Stripe Billing & Tier Enforcements**: Automated recurring subscriptions (Starter, Professional, Enterprise) with usage metering.
- **Platform Admin Control Center**: Super-admin health telemetry, clinic provisioning, support ticket desks, and audit logs.

---

## 🛠️ Local Development Setup

### 1. Prerequisites
- **Node.js** >= 20.x
- **npm** >= 10.x
- **Supabase CLI** (optional for local PostgreSQL)

### 2. Installation
```bash
git clone https://github.com/your-org/radiant-nobel.git
cd radiant-nobel
npm install
```

### 3. Environment Variables
Copy `.env.example` to `.env.local` and populate the required API keys:
```bash
cp .env.example .env.local
```

Key environment variables:
```env
NEXT_PUBLIC_APP_URL="http://localhost:3000"
NEXT_PUBLIC_SUPABASE_URL="https://your-project.supabase.co"
NEXT_PUBLIC_SUPABASE_ANON_KEY="your-anon-key"
SUPABASE_SERVICE_ROLE_KEY="your-service-role-key"

OPENAI_API_KEY="sk-..."
STRIPE_SECRET_KEY="sk_test_..."
STRIPE_WEBHOOK_SECRET="whsec_..."
RESEND_API_KEY="re_..."
```

### 4. Running the Development Server
```bash
npm run dev
```
Open [http://localhost:3000](http://localhost:3000) to view the application.

---

## 🧪 Testing & Verification Pipeline

```bash
# Run ESLint validation
npm run lint

# Run TypeScript typechecking
npm run typecheck

# Run Vitest test suite (31 files, 266 tests)
npm run test

# Run Playwright End-to-End browser tests
npm run test:e2e

# Build production bundles
npm run build
```

---

## 📄 License
Proprietary — All rights reserved.

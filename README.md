# Radiant Nobel — AI Dental Receptionist & Practice Management SaaS

[![Next.js 16](https://img.shields.io/badge/Next.js-16-black?style=flat&logo=next.js)](https://nextjs.org/)
[![React 19](https://img.shields.io/badge/React-19-blue?style=flat&logo=react)](https://react.dev/)
[![TypeScript](https://img.shields.io/badge/TypeScript-5.0-blue?style=flat&logo=typescript)](https://www.typescriptlang.org/)
[![Supabase](https://img.shields.io/badge/Supabase-PostgreSQL-green?style=flat&logo=supabase)](https://supabase.com/)
[![Razorpay](https://img.shields.io/badge/Razorpay-UPI%20%26%20Cards-blue?style=flat)](https://razorpay.com/)
[![WhatsApp](https://img.shields.io/badge/WhatsApp-Cloud%20API-green?style=flat&logo=whatsapp)](https://business.whatsapp.com/)
[![Voice](https://img.shields.io/badge/Voice%20AI-24%2F7%20Telephony-purple?style=flat)](VOICE.md)
[![Anthropic](https://img.shields.io/badge/Anthropic-Claude%203.5-orange?style=flat)](https://anthropic.com/)
[![Tests](https://img.shields.io/badge/Tests-382%20Passed-brightgreen?style=flat)](TESTING.md)

**Radiant Nobel** is a production-grade, multi-tenant B2B Dental SaaS platform featuring an **autonomous 24/7 AI Receptionist across Website Widget, WhatsApp, and Voice Phone Channels**, real-time calendar synchronization, zero-double-booking appointment engine, instant website builder with custom domains, Razorpay Indian Payments (UPI, GPay, PhonePe, Paytm, QR, Netbanking), and clinic management suite.

---

## 📑 Core Documentation Index

| Guide | Description |
| :--- | :--- |
| **[ARCHITECTURE.md](ARCHITECTURE.md)** | Technical design, multi-tenant isolation, AI pipeline, and state machines. |
| **[VOICE.md](VOICE.md)** | 24/7 AI Voice Phone Receptionist, telephony webhooks, and feature gating. |
| **[WHATSAPP.md](WHATSAPP.md)** | WhatsApp Business Cloud API setup, multi-tenant isolation, human handoff, and reminders. |
| **[BILLING.md](BILLING.md)** | Pluggable payment provider abstraction, UPI flows, e-mandates, and feature entitlements. |
| **[DATABASE.md](DATABASE.md)** | PostgreSQL relational schemas, RLS policies, indexing, and migrations. |
| **[API.md](API.md)** | REST endpoints, Server Actions, schemas, error codes, and rate limits. |
| **[SECURITY.md](SECURITY.md)** | Threat model, prompt injection defenses, HIPAA compliance, and upload policies. |
| **[PRIVACY.md](PRIVACY.md)** | Data protection, retention policies, GDPR/HIPAA erasures, and PII masking. |
| **[DEPLOYMENT.md](DEPLOYMENT.md)** | Vercel, Supabase, Razorpay, Anthropic, WhatsApp Cloud API, Resend configuration. |
| **[TESTING.md](TESTING.md)** | QA strategy, unit/integration tests, Playwright E2E, and AI evaluation. |
| **[DISASTER_RECOVERY.md](DISASTER_RECOVERY.md)** | RPO/RTO objectives, restoration runbooks, and graceful degradation. |
| **[AI_LIMITATIONS.md](AI_LIMITATIONS.md)** | Healthcare boundaries, non-diagnostic rules, and confirmation invariance. |
| **[Customer Installation Guide](docs/CUSTOMER_INSTALLATION_GUIDE.md)** | Step-by-step widget, WordPress, GTM, and custom domain setup for clinics. |

---

## 🚀 Key Features

- **Omnichannel AI Receptionist (Website, WhatsApp, Voice)**: Handles patient FAQs, clinic opening hours, verified service pricing, and dentist availability across web chat, official WhatsApp Business accounts, and inbound phone lines.
- **Unified Single AI & Booking Backend**: All 3 channels utilize the exact same booking tools, availability logic, and patient deduplication.
- **24/7 AI Voice Phone Receptionist (Pro Enterprise)**: Answers clinic phone calls with natural conversational speech, books appointments in real-time, and transfers emergencies directly to front desk staff.
- **Server-Side Feature Entitlements**: Strict server-side plan gating ensures premium capabilities cannot be unlocked by client manipulation.
- **Human Staff Handoff**: Patients can request human assistance, triggering automated call transfer or WhatsApp handoff.
- **Automated WhatsApp Reminders**: 24-hour and 2-hour pre-appointment template reminders with duplicate avoidance.
- **Indian Payment & UPI Support (Razorpay)**: UPI Intent, QR Code, Google Pay, PhonePe, Paytm, Netbanking, and Cards with recurring e-mandates.
- **Multi-Tenant Row Level Security (RLS)**: Strict database partitioning ensures Clinic A never accesses Clinic B records.
- **Backend Confirmation Invariance**: The AI never claims an appointment is booked without Authoritative PostgreSQL database confirmation (`confirmationId`).
- **Platform Website Builder**: Drag-and-drop clinic microsites with instant custom domain publishing.
- **Two-Way Calendar Sync**: Seamless integration with Google Calendar and Microsoft Outlook 365.

---

## 🛠️ Local Development Setup

### 1. Prerequisites
- **Node.js** >= 20.x
- **npm** >= 10.x

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

### 4. Run Development Server
```bash
npm run dev
```
Open **[http://localhost:3000](http://localhost:3000)** in your browser.

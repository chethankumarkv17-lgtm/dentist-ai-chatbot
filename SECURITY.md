# Radiant Nobel — Security Policy & System Architecture

Radiant Nobel is designed with a defense-in-depth, privacy-first security model to safeguard dental clinic operations, staff credentials, and patient booking interactions across Website, WhatsApp, and Voice channels.

---

## 1. Reporting a Vulnerability

We take the security of our platform and patient data seriously. If you discover a security vulnerability, please report it responsibly:

- **Email**: `security@radiantnobel.com`
- **Response SLA**: Initial triage within 24 hours. Critical issues prioritized immediately.
- **Disclosure Policy**: Coordinated vulnerability disclosure without modifying real patient or clinic records.

---

## 2. Core Security Pillars & Defenses

### A. Multi-Tenant Isolation & Row-Level Security (RLS)
- **Tenant Scoping**: All database queries are partitioned by `organization_id` or `clinic_id`.
- **Inbound Channel Binding**:
  - WhatsApp resolves strictly from verified `phone_number_id`.
  - Voice resolves strictly from assigned inbound telephony number.
- **Cross-Tenant Access Prevention**: Strict checks prevent Clinic A from reading or modifying Clinic B's appointments, services, patients, or AI knowledge.

### B. Server-Side Feature Entitlement Gating
- **Pro Plan Enforcement**: Premium features like Voice AI are protected by authoritative server-side checks (`hasFeature(orgId, 'voiceAgent')`). Client state cannot bypass plan gates.
- **Immediate Revocation**: Subscription downgrades or payment failures instantly revoke voice and premium API capabilities server-side.

### C. AI Receptionist Safety & Guardrails
- **Prompt Injection & Voice Jailbreak Neutralization**: Inbound speech and text turns are filtered against jailbreaks, prompt extractions, and developer mode escapes.
- **Medical Boundary Enforcement**: The AI is strictly restricted to administrative clinic inquiries and scheduling. It categorically refuses medical diagnoses, drug prescriptions, and dangerous DIY treatment instructions.
- **Controlled Tool Execution**: Direct SQL execution and unconfirmed booking claims are impossible.

### D. Webhook Reliability & Cryptographic Verification
- **Razorpay**: HMAC-SHA256 signatures verified against `RAZORPAY_WEBHOOK_SECRET`.
- **WhatsApp**: `X-Hub-Signature-256` HMAC verified against `WHATSAPP_APP_SECRET`.
- **Telephony / Twilio**: `X-Twilio-Signature` verified against `TWILIO_AUTH_TOKEN`.
- **Idempotency Mutex**: Inbound events deduplicated using PostgreSQL locks.

### E. Financial & Payment Security Invariants
- **Zero Card / UPI Credential Storage**: No credit/debit card numbers, CVVs, UPI VPAs, MPINs, or banking passwords are ever collected or stored on our servers.

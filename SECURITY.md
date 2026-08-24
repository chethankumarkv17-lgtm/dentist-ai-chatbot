# Radiant Nobel — Security Policy & System Architecture

Radiant Nobel is designed with a defense-in-depth, privacy-first security model to safeguard dental clinic operations, staff credentials, and patient booking interactions across Website and WhatsApp channels.

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
- **WhatsApp Phone-ID Binding**: The clinic tenant is resolved strictly from the verified `phone_number_id` inside the Meta webhook payload.
- **Cross-Tenant Access Prevention**: Strict checks prevent Clinic A from reading or modifying Clinic B's appointments, services, patients, or AI knowledge.

### B. Authentication & Authorization
- **Super Admin Protection**: Platform admin routes (`/admin/*`) strictly require `requirePlatformAdmin()`, verifying real database profiles and authenticated metadata claims.
- **No Hidden Backdoors**: No debug bypasses, test tokens, or master overrides exist in the production codebase.
- **Role-Based Access Control (RBAC)**: Supports `owner`, `admin`, and `member` roles.

### C. AI Receptionist Safety & Guardrails
- **Prompt Injection & Jailbreak Neutralization**: Incoming chat messages are filtered against prompt injection, developer mode escapes, and system prompt extraction attacks.
- **Medical Boundary Enforcement**: The AI is strictly restricted to administrative clinic inquiries and scheduling. It categorically refuses medical diagnoses, drug prescriptions, and dangerous DIY treatment instructions.
- **Controlled Tool Execution**: The AI interacts with the backend exclusively via controlled tool calls (`getAvailableSlots`, `createAppointment`). Direct SQL execution and unconfirmed booking claims are impossible.

### D. Secure File Uploads & Asset Protection
- **Binary Magic Byte Inspection**: Uploaded logos and photos are validated by true binary magic numbers (`FF D8 FF` for JPEG, `89 50 4E 47` for PNG, `RIFF...WEBP` for WebP) rather than browser-supplied `Content-Type` headers.
- **Path Traversal Prevention**: Filenames are sanitized and path traversal sequences (`../`, `..\`) are stripped.

### E. Webhook Reliability & Idempotency
- **Cryptographic Verification**:
  - Razorpay webhooks verify HMAC-SHA256 signatures against `RAZORPAY_WEBHOOK_SECRET`.
  - WhatsApp webhooks verify `X-Hub-Signature-256` HMAC against `WHATSAPP_APP_SECRET`.
- **Concurrency & Idempotency Mutex**: Incoming events are claimed and deduplicated using database locks to prevent duplicate appointment creation, duplicate subscriptions, or double billing.

### F. Financial & Payment Security Invariants
- **Zero Card / UPI Credential Storage**: No credit/debit card numbers, CVVs, UPI VPAs, MPINs, or banking passwords are ever collected, processed directly, or stored on our servers.
- **Server-Side Authoritative Verification**: Frontend checkout callbacks never directly activate subscriptions without cryptographic backend validation.

### G. Patient Privacy & Data Minimization
- **Minimal Collection**: Collects only name, phone, email, and requested service. No medical history or diagnostic charts are collected or stored.
- **Right to Erasure & Portability**: Clinics can trigger machine-readable JSON exports and permanently anonymize patient records upon request.

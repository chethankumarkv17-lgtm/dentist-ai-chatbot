# Radiant Nobel — Security Policy & System Architecture

Radiant Nobel is designed with a defense-in-depth, privacy-first security model to safeguard dental clinic operations, staff credentials, and patient booking interactions.

---

## 1. Reporting a Vulnerability

We take the security of our platform and patient data seriously. If you discover a security vulnerability, please report it responsibly:

- **Email**: `security@radiantnobel.com`
- **Response SLA**: Initial triage within 24 hours. Critical issues prioritized immediately.
- **Disclosure Policy**: We kindly ask security researchers to practice coordinated vulnerability disclosure and avoid accessing or modifying real patient/clinic records.

---

## 2. Core Security Pillars & Defenses

### A. Multi-Tenant Isolation & Row-Level Security (RLS)
- **Tenant Scoping**: All database queries are partitioned by `organization_id` or `clinic_id`.
- **Cross-Tenant Access Prevention**: Strict checks prevent Clinic A from reading, modifying, or deleting Clinic B's appointments, services, support tickets, or uploaded assets.
- **IDOR Protection**: All mutations verify organizational ownership before updating or deleting records.

### B. Authentication & Authorization
- **Super Admin Protection**: Platform admin routes (`/admin/*`) strictly require `requirePlatformAdmin()`, verifying real database profiles and authenticated metadata claims.
- **No Hidden Backdoors**: No debug bypasses, test tokens, or master overrides exist in the production codebase.
- **Role-Based Access Control (RBAC)**: Support tickets and clinic settings enforce `owner`, `admin`, and `member` roles.

### C. AI Receptionist Safety & Guardrails
- **Prompt Injection & Jailbreak Neutralization**: Incoming chat messages are filtered against prompt injection, developer mode escapes, and system prompt extraction attacks.
- **Medical Boundary Enforcement**: The AI is strictly restricted to administrative clinic inquiries and scheduling. It categorically refuses medical diagnoses, drug prescriptions, and dangerous DIY treatment instructions.
- **Controlled Tool Execution**: The AI interacts with the backend exclusively via controlled tool calls (`getAvailableSlots`, `createAppointment`). The AI never directly accesses the database and cannot fabricate bookings.

### D. Secure File Uploads & Asset Protection
- **Binary Magic Byte Inspection**: Uploaded logos and photos are validated by true binary magic numbers (`FF D8 FF` for JPEG, `89 50 4E 47` for PNG, `RIFF...WEBP` for WebP) rather than browser-supplied `Content-Type` headers.
- **Anti-Executable & Polyglot Defense**: Blocks scripts, executables, SVGs with script tags, and PHP webshells.
- **Path Traversal Prevention**: Filenames are sanitized and path traversal sequences (`../`, `..\`) are stripped.
- **Strict Size Limits**: 2MB for logos, 5MB for clinic/dentist images.

### E. Webhook Reliability & Idempotency
- **Cryptographic Verification**: Stripe webhooks verify HMAC-SHA256 signatures before processing.
- **Concurrency & Idempotency Mutex**: Incoming events are claimed and deduplicated using database locks to prevent duplicate appointment creation, duplicate subscriptions, or double billing.
- **Out-of-Order Protection**: Stale events arriving out of sequence are detected via event creation timestamps and ignored.

### F. Rate Limiting & Abuse Prevention
- **Multi-Layer Sliding Windows**: Enforces limits on IP, authenticated user, clinic, and burst request rates.
- **AI Quota & Circuit Breakers**: Monthly plan quotas (Starter: 500 msgs, Growth: 2,500 msgs, Pro: 10,000 msgs) trigger alerts at 80% and automated circuit-breaker restriction at 100%.

### G. Patient Privacy & Data Minimization
- **Minimal Collection**: Collects only name, phone, email, and requested service. No medical history, diagnostic charts, or payment card numbers are collected or stored.
- **PII Scrubbing**: Analytics metadata and notification logs are stripped of patient PII prior to persistence.
- **Right to Erasure & Portability**: Clinics can trigger machine-readable JSON exports and permanently anonymize patient records upon request.
- **Configurable Retention**: Automatic database purging of expired appointments and chat transcripts.

---

## 3. Cryptography & Secrets Management

- **Data in Transit**: Enforced TLS 1.3 across all public endpoints and API integrations.
- **Data at Rest**: AES-256 encryption across storage buckets and database volumes.
- **Secret Hygiene**: Zero hardcoded production secrets or private keys in source control. All credentials are provided via secure environment variables (`STRIPE_SECRET_KEY`, `RESEND_API_KEY`, `OPENAI_API_KEY`, `SUPABASE_SERVICE_ROLE_KEY`).

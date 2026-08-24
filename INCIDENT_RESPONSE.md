# Radiant Nobel — Production Incident Response Plan & Runbooks

This document outlines the standard operating procedures, severity classifications, and operational runbooks for resolving production incidents across the Radiant Nobel platform.

---

## 1. Incident Severity Classifications & SLAs

| Severity | Definition | Target Response | Target Resolution | Examples |
| :--- | :--- | :--- | :--- | :--- |
| **P1 — Critical** | Total platform outage, database unreachable, widespread data integrity risk. | **< 15 minutes** | **< 2 hours** | PostgreSQL cluster offline, unhandled data loss, total AI receptionist failure. |
| **P2 — Major** | Core feature degraded for multiple clinics (billing, appointment booking, widget). | **< 30 minutes** | **< 4 hours** | Stripe webhook failure streak, booking engine latency > 3000ms, Google OAuth down. |
| **P3 — Minor** | Partial feature impairment with viable workaround, isolated clinic bug. | **< 2 hours** | **< 24 hours** | Email delivery retry delays, single dentist calendar sync desync. |
| **P4 — Low** | Non-critical bug, cosmetic dashboard glitch, documentation typo. | **< 24 hours** | Next Sprint | UI table alignment issue, minor analytics rounding error. |

---

## 2. Incident Response Workflow

```
[Trigger / Alert] ──> [Triage Severity] ──> [Containment & Mitigation] ──> [Root Cause Fix] ──> [Verification] ──> [Post-Mortem]
```

1. **Detection**: Alerts triggered via `checkAndTriggerCriticalAlerts()`, Admin System Health dashboard, or error log monitors.
2. **Triage**: Platform Admin verifies active alerts, identifies impacted clinics, and declares incident severity level.
3. **Containment**: Apply circuit breakers, rate limits, or failover fallback paths to prevent cascading failures.
4. **Remediation**: Deploy hotfix or restore services according to subsystem runbooks below.
5. **Verification**: Run diagnostic health check from `/admin/system-health` and verify end-to-end booking flow.
6. **Post-Mortem**: Publish blameless RCA within 48 hours for all P1 and P2 incidents.

---

## 3. Subsystem Runbooks

### Runbook 1: AI Assistant Outage & LLM Rate Limiting
- **Symptoms**: AI chat failure alert (`AI_FAILURE_SPIKE`), chat latency > 2000ms, 429 upstream rate limit errors.
- **Triage Steps**:
  1. Inspect `/admin/system-health` for error type `AI_FAILURE`.
  2. Verify OpenAI API status and platform quota balance.
  3. Check clinic rate limiters in `src/lib/limits/rate-limiter.ts` to identify anomalous traffic spikes.
- **Remediation**:
  - The fallback reception handler (`src/lib/ai/receptionist.ts`) automatically falls back to rule-based menu responses if the upstream LLM fails.
  - Temporarily throttle non-essential traffic or increase upstream API tier.

### Runbook 2: Stripe Billing Webhooks Disruption
- **Symptoms**: `WEBHOOK_FAILURE_STREAK` alert, subscription statuses not updating after checkout.
- **Triage Steps**:
  1. Inspect failed webhook records in `/admin/system-health` or `/admin/subscriptions`.
  2. Check webhook signature verification errors in `src/lib/billing/webhook-handler.ts`.
  3. Verify `STRIPE_WEBHOOK_SECRET` environment variable matching Stripe dashboard endpoint.
- **Remediation**:
  - Fix secret mismatch or endpoint URL.
  - Trigger automatic webhook re-delivery from Stripe Dashboard. The platform's idempotency engine (`src/lib/webhooks/reliability.ts`) will safely process events without duplicates.

### Runbook 3: Database Connection Pool Saturation
- **Symptoms**: `DATABASE_UNREACHABLE` alert, API latency p95 > 2500ms, connection timeout errors.
- **Triage Steps**:
  1. Check database CPU, memory, and active connection pool in Supabase Dashboard.
  2. Identify long-running queries or un-indexed searches.
- **Remediation**:
  - Restart connection pooling proxy or increase pool allocation.
  - Kill stuck transactions via Supabase SQL Editor.

### Runbook 4: Email Delivery / Resend Disruption
- **Symptoms**: `EMAIL_FAILURE` logs, clinic notifications pending.
- **Triage Steps**:
  1. Check `notification_logs` for status `failed`.
  2. Verify Resend API Key and verified sending domain DNS records (SPF, DKIM, DMARC).
- **Remediation**:
  - Fix DNS records or update API token.
  - Re-run background email retry job (`sendEmailNotification()` with idempotency key).

---

## 4. Blameless Post-Mortem Template

```markdown
# Incident Post-Mortem: [Incident Title]
**Date**: YYYY-MM-DD
**Severity**: P1 / P2
**Duration**: X hours Y minutes
**Impacted Services**: [AI Receptionist / Booking / Billing / Database]

### 1. Incident Summary
Brief 2-3 sentence overview of what happened and the patient/clinic impact.

### 2. Timeline (UTC)
- **HH:MM** - Incident triggered / First alert dispatched.
- **HH:MM** - Incident acknowledged by on-call engineer.
- **HH:MM** - Root cause identified.
- **HH:MM** - Mitigation deployed.
- **HH:MM** - System fully operational verified.

### 3. Root Cause Analysis (5 Whys)
Why did this occur and what safety checks were missing?

### 4. Action Items & Preventative Measures
- [ ] Action item 1 (Owner, Target Date)
- [ ] Action item 2 (Owner, Target Date)
```

# Quality Assurance & Testing Strategy

Radiant Nobel maintains a **zero-regression testing standard** across all critical healthcare and financial flows: booking integrity, multi-tenant isolation, AI receptionist accuracy, Stripe billing, and accessibility.

---

## 1. Testing Pyramid & Tooling

```
            ▲
           / \
          / E2E \       Playwright (Browser user flows)
         /───────\
        / AI Eval \     Vitest (18 AI Quality & Safety Scenarios)
       /───────────\
      / Integration \   Vitest (Multi-tenant RLS, Webhooks, Booking Engine)
     /───────────────\
    /   Unit Tests    \ Vitest (Guardrails, Timezones, Pricing, Schemas)
   ─────────────────────
```

- **Unit & Integration Tests**: Vitest (`npm run test`)
- **End-to-End (E2E) Browser Tests**: Playwright (`npm run test:e2e`)
- **Static Analysis & Linting**: ESLint (`npm run lint`)
- **Type Safety**: TypeScript Strict Mode (`npm run typecheck`)

---

## 2. Test Suite Directory Catalog (31 Test Files, 266 Tests)

| Component Area | Test File | Verified Functionality |
| :--- | :--- | :--- |
| **AI Evaluation** | `src/lib/ai/ai-evaluation.test.ts` | 18 AI Quality scenarios, prompt injection, medical refusal, backend confirmation invariance. |
| **AI Receptionist** | `src/lib/ai/receptionist.test.ts` | Intent extraction, tool call resolution, conversational synthesis. |
| **AI Safety** | `src/lib/ai/safety.test.ts` | Regex jailbreak interception, PII exfiltration defense. |
| **Booking Engine** | `src/lib/booking/booking.test.ts` | Slot generation, buffer management, timezone alignment. |
| **Concurrency** | `src/lib/booking/concurrency.test.ts` | Concurrent double-booking prevention under load. |
| **Calendar Sync** | `src/lib/calendar/calendar.test.ts` | Google & Outlook token exchange and 2-way event syncing. |
| **Billing & Stripe** | `src/lib/billing/billing.test.ts` | Webhook idempotency, tier activations, 3-day grace period. |
| **Full Lifecycle** | `src/lib/qa/full-lifecycle.test.ts` | Complete end-to-end integration flow from signup to booking to erasure. |
| **Performance** | `src/lib/performance/performance.test.ts` | In-memory cache hit/miss, TTL expiration, 100 concurrent requests. |
| **Accessibility & SEO** | `src/lib/seo/seo-accessibility.test.ts` | Sitemap priorities, privacy robots.txt, Schema.org Dentist JSON-LD. |
| **Disaster Recovery** | `src/lib/backup/backup.test.ts` | Checksum verification, database restoration simulation. |
| **Upload Security** | `src/lib/uploads/security.test.ts` | Magic-byte MIME validation, webshell and polyglot rejection. |
| **Privacy & GDPR** | `src/lib/privacy/privacy.test.ts` | Anonymization cascades, patient export bundles. |
| **E2E Playwright** | `tests/*.spec.ts` | Browser authentication, appointment booking, dashboard navigation. |

---

## 3. Running Test Suites

```bash
# Run all unit and integration tests
npm run test

# Run tests in watch mode during development
npx vitest

# Run specific AI evaluation suite
npx vitest run src/lib/ai/ai-evaluation.test.ts

# Run Playwright End-to-End browser tests
npm run test:e2e

# Run full production pipeline
npm run lint && npm run typecheck && npm run test && npm run build
```

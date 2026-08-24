# Production Deployment & Infrastructure Guide

This guide details the step-by-step production deployment process for Radiant Nobel across Vercel, Supabase, Stripe, OpenAI, Resend, and DNS providers.

---

## 1. Architecture Infrastructure

- **Frontend & Serverless**: Vercel (Next.js 16 Edge / Serverless)
- **Database & Auth**: Supabase Managed PostgreSQL
- **Payments & Billing**: Stripe
- **AI Orchestration**: OpenAI API
- **Transactional Email**: Resend
- **DNS & Edge Routing**: Cloudflare / Vercel DNS

---

## 2. Environment Variables Master Reference

| Variable | Scope | Description |
| :--- | :--- | :--- |
| `NEXT_PUBLIC_APP_URL` | Public | Production base URL (e.g. `https://radiantnobel.com`) |
| `NEXT_PUBLIC_SUPABASE_URL`| Public | Supabase project endpoint |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | Public | Supabase anonymous client API key |
| `SUPABASE_SERVICE_ROLE_KEY` | **Secret** | Supabase service role key (bypasses RLS for admin tasks) |
| `OPENAI_API_KEY` | **Secret** | OpenAI API key with GPT-4o access |
| `STRIPE_SECRET_KEY` | **Secret** | Live Stripe API secret key |
| `STRIPE_WEBHOOK_SECRET` | **Secret** | Live Stripe webhook HMAC signing secret |
| `NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY` | Public | Live Stripe publishable key |
| `RESEND_API_KEY` | **Secret** | Resend API key for transactional booking emails |
| `UPSTASH_REDIS_REST_URL`| **Secret** | Optional Upstash Redis endpoint for edge rate limiting |
| `UPSTASH_REDIS_REST_TOKEN`| **Secret** | Optional Upstash Redis authentication token |

---

## 3. Step-by-Step Deployment Runbook

### Step 1: Provision Supabase PostgreSQL
1. Create a new Supabase project in the target region.
2. Under **Database Settings**, copy the Connection String and API Keys.
3. Apply migrations in sequence using the Supabase CLI or SQL Editor:
```bash
supabase db push
# Or apply migrations from /supabase/migrations/ in order
```

### Step 2: Configure Stripe
1. Create products for the subscription tiers:
   - **Starter**: `$99/month`
   - **Professional**: `$199/month`
   - **Enterprise**: `$399/month`
2. Add a Webhook Endpoint in the Stripe Dashboard pointing to:
   `https://radiantnobel.com/api/webhooks/stripe`
3. Select the events:
   - `checkout.session.completed`
   - `customer.subscription.updated`
   - `customer.subscription.deleted`
   - `invoice.payment_failed`
4. Copy the Webhook Signing Secret (`whsec_...`) to `STRIPE_WEBHOOK_SECRET`.

### Step 3: Configure Resend Domain
1. In Resend Dashboard, add and verify your sending domain (e.g. `mail.radiantnobel.com`).
2. Add the required SPF, DKIM, and DMARC DNS records.
3. Set `RESEND_API_KEY`.

### Step 4: Deploy to Vercel
1. Import the repository into Vercel.
2. Select **Next.js** framework preset.
3. Configure all Production Environment Variables under **Project Settings $\rightarrow$ Environment Variables**.
4. Trigger production deployment:
```bash
vercel --prod
```

### Step 5: Configure Custom Domains & Wildcard DNS
1. Add root domain `radiantnobel.com` and `www.radiantnobel.com`.
2. Add wildcard domain `*.radiantnobel.com` for tenant clinic subdomains.
3. For custom clinic domains (e.g. `dentalclinic.com`), configure DNS:
   - **Type**: `CNAME`
   - **Name**: `@` or `booking`
   - **Value**: `cname.vercel-dns.com`

---

## 4. Pre-Launch Verification Checklist

- [ ] Supabase RLS is enabled on all 18 tables.
- [ ] Database migrations up to `20260823000012_phase34_performance_indexes.sql` applied.
- [ ] Stripe live mode webhooks receiving 200 OK responses.
- [ ] OpenAI API rate limits and spend quotas verified.
- [ ] Resend email delivery verified with DKIM/SPF passing.
- [ ] Non-blocking widget embed script tested on external HTTPS host.
- [ ] Automated tests pass: `npm run lint && npm run typecheck && npm run test && npm run build`.

# Production Deployment & Infrastructure Guide

This guide details the step-by-step production deployment process for Radiant Nobel across Vercel, Supabase, Razorpay, Anthropic, Resend, and Meta WhatsApp Business API.

---

## 1. Architecture Infrastructure

- **Frontend & Serverless**: Vercel (Next.js 16 Edge / Serverless)
- **Database & Auth**: Supabase Managed PostgreSQL
- **Payments & Billing**: Razorpay (India: UPI / Cards / Netbanking) & Stripe (Global Coexistence)
- **AI Orchestration**: Anthropic API (Claude 3.5 Sonnet / Haiku)
- **Transactional Email**: Resend
- **WhatsApp Channel**: Meta WhatsApp Business Cloud API
- **DNS & Edge Routing**: Cloudflare / Vercel DNS

---

## 2. Environment Variables Master Reference

| Variable | Scope | Description |
| :--- | :--- | :--- |
| `NEXT_PUBLIC_APP_URL` | Public | Production base URL (e.g. `https://radiantnobel.com`) |
| `NEXT_PUBLIC_SUPABASE_URL`| Public | Supabase project endpoint |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | Public | Supabase anonymous client API key |
| `SUPABASE_SERVICE_ROLE_KEY` | **Secret** | Supabase service role key (bypasses RLS for admin tasks) |
| `ANTHROPIC_API_KEY` | **Secret** | Anthropic API key for Claude AI Receptionist |
| `RAZORPAY_KEY_ID` | **Secret** | Live Razorpay Key ID |
| `RAZORPAY_KEY_SECRET` | **Secret** | Live Razorpay Key Secret |
| `RAZORPAY_WEBHOOK_SECRET` | **Secret** | Live Razorpay Webhook HMAC signing secret |
| `NEXT_PUBLIC_RAZORPAY_KEY_ID` | Public | Razorpay Key ID exposed to frontend checkout modal |
| `WHATSAPP_PHONE_NUMBER_ID` | **Secret** | Meta Cloud API Phone Number ID |
| `WHATSAPP_ACCESS_TOKEN` | **Secret** | Meta Cloud API System User Access Token |
| `WHATSAPP_VERIFY_TOKEN` | **Secret** | Meta Webhook Verification Token (`hub.verify_token`) |
| `WHATSAPP_APP_SECRET` | **Secret** | Meta App Secret for `X-Hub-Signature-256` HMAC verification |
| `RESEND_API_KEY` | **Secret** | Resend API key for transactional booking emails |
| `RESEND_FROM_EMAIL` | Public/Config | Verified sender address (e.g. `appointments@radiantnobel.com`) |

---

## 3. Step-by-Step Deployment Runbook

### Step 1: Provision Supabase PostgreSQL
1. Create a new Supabase project in the target region (e.g. `ap-south-1` Mumbai).
2. Under **Database Settings**, copy the Connection String and API Keys.
3. Apply migrations in sequence using the Supabase CLI or SQL Editor:
```bash
supabase db push
# Or apply migrations from /supabase/migrations/ in order
```

### Step 2: Configure Razorpay (India / UPI Gateway)
1. In the Razorpay Dashboard (**Settings** > **API Keys**), generate Key ID and Key Secret.
2. In **Subscriptions** > **Plans**, create plans matching the tier definitions:
   - **Starter**: `₹2,999/month` (`plan_starter_monthly`)
   - **Growth**: `₹5,999/month` (`plan_growth_monthly`)
   - **Pro Enterprise**: `₹11,999/month` (`plan_pro_monthly`)
3. Add a Webhook Endpoint in Razorpay Dashboard pointing to:
   `https://radiantnobel.com/api/webhooks/razorpay`
4. Enable webhook events:
   - `subscription.activated`
   - `subscription.charged`
   - `subscription.cancelled`
   - `subscription.paused`
   - `payment.captured`
   - `payment.failed`
5. Copy the Webhook Secret to `RAZORPAY_WEBHOOK_SECRET`.

### Step 3: Configure Meta WhatsApp Business Cloud API
1. Create a Meta Developer App under **Business** type.
2. Add the **WhatsApp** product to your App.
3. In **WhatsApp** > **Configuration**, set Webhook URL:
   `https://radiantnobel.com/api/webhooks/whatsapp`
4. Set the Verification Token to match `WHATSAPP_VERIFY_TOKEN`.
5. Subscribe to the `messages` webhook field.

### Step 4: Configure Anthropic & Resend
1. In Anthropic Console, create an API key with Claude access and set `ANTHROPIC_API_KEY`.
2. In Resend, add and verify your custom sending domain with SPF, DKIM, and DMARC DNS records.

### Step 5: Deploy to Vercel
1. Link your GitHub repository to Vercel.
2. Configure all environment variables from the master reference table above.
3. Run the automated production deployment.

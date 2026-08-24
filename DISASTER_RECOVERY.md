# Radiant Nobel — Backup & Disaster Recovery (DR) Plan

This document outlines the backup infrastructure, data retention schedules, Recovery Point/Time Objectives (RPO/RTO), step-by-step restoration procedures, and graceful degradation strategies for Radiant Nobel.

---

## 1. RPO and RTO Targets

| Metric | Target | Description |
| :--- | :--- | :--- |
| **Recovery Point Objective (RPO)** | **< 5 minutes** | Maximum allowable data loss. Powered by Continuous Write-Ahead Logging (WAL) and Point-In-Time Recovery (PITR). |
| **Recovery Time Objective (RTO)** | **< 30 minutes** | Maximum allowable time to restore full platform availability following a major infrastructure failure. |
| **Storage Asset RPO** | **< 1 hour** | Geo-replicated asset backup for clinic logos and dentist headshots. |

---

## 2. Backup Schedules & Retention Policy

1. **Continuous Point-In-Time Recovery (PITR)**:
   - Continuous WAL streaming to encrypted cloud storage.
   - Granular second-by-second rollback capability retained for **30 days**.
2. **Daily Logical Database Dumps**:
   - Automated full database exports executed daily at `02:00 UTC`.
   - Client-side AES-256 encrypted and stored across multi-region object storage (`us-east-1` and `eu-central-1`).
   - Retained for **90 days**.
3. **Weekly Immutable Cold Archives**:
   - GPG-signed logical snapshots created weekly.
   - Retained in WORM (Write Once, Read Many) cold storage for **1 year** for compliance and business continuity.

---

## 3. Step-by-Step Restoration Procedure

### A. Point-In-Time Recovery (PITR) via Supabase
1. Log into the Supabase Infrastructure Management Console.
2. Select the target database cluster -> **Database** -> **Backups** -> **Point in Time**.
3. Select the desired restore timestamp (e.g. `2026-08-23T14:30:00Z` right before incident onset).
4. Launch the PITR restoration to a new database instance.
5. Update Vercel production environment variables (`DATABASE_URL`, `SUPABASE_SERVICE_ROLE_KEY`) to point to the restored instance.
6. Trigger a zero-downtime redeployment.

### B. Command-Line Logical Restoration (`pg_restore`)
```bash
# 1. Download and decrypt the latest verified backup archive
gpg --decrypt radiant_backup_20260823.sql.gpg > backup.sql

# 2. Run verification tool to validate manifest and table schemas
npm run verify-backup -- --file=backup.sql

# 3. Restore to target PostgreSQL instance
PGPASSWORD=$RESTORE_DB_PASSWORD pg_restore \
  -h $RESTORE_DB_HOST \
  -U postgres \
  -d postgres \
  --clean \
  --if-exists \
  --no-owner \
  --no-privileges \
  backup.sql

# 4. Verify record counts and run system diagnostic
npm run test:dr-restore
```

---

## 4. Failure Scenario Analysis & Graceful Degradation

### Scenario 1: Primary Database Cluster Outage
- **Immediate Effect**: Read/write queries fail.
- **Graceful Degradation**:
  - Edge caching serves static marketing pages, Help Center articles, and widget scripts.
  - Connection pooling proxy attempts automated exponential backoff reconnects (up to 3 retries).
  - Next.js dynamic routes render a user-friendly maintenance banner instead of raw 500 error traces.
- **Remediation**: Promote hot standby read replica in secondary availability zone.

### Scenario 2: Vercel Edge Deployment Failure
- **Immediate Effect**: Global edge routing interruption or bad code deployment.
- **Graceful Degradation**:
  - Vercel's immutable deployment architecture preserves historical build SHAs.
  - DNS Anycast automatically redirects traffic to healthy edge nodes.
- **Remediation**: Instant one-click rollback in Vercel Deployment dashboard to the prior verified SHA.

### Scenario 3: Stripe Payment Gateway Downtime
- **Immediate Effect**: Checkout sessions fail to initialize; webhook delivery delayed.
- **Graceful Degradation**:
  - **3-Day Subscription Grace Period**: Existing active clinics are not locked out or restricted if billing status checks fail.
  - Webhooks from Stripe are held in Stripe's retry queue (retry up to 72 hours).
  - Webhook deduplication engine (`src/lib/webhooks/reliability.ts`) prevents duplicate charges upon service restoration.

### Scenario 4: OpenAI API / LLM Outage
- **Immediate Effect**: AI chat receptionist inference calls return 500 or timeout.
- **Graceful Degradation**:
  - The AI engine automatically switches to **High-Availability Menu Mode** (`getDegradedAiResponse()`).
  - Structured service menus and direct booking buttons are rendered directly into the chat widget so patients can still schedule appointments without conversation stalling.

### Scenario 5: Email Provider (Resend) Outage
- **Immediate Effect**: Outgoing appointment confirmation and reminder emails fail.
- **Graceful Degradation**:
  - Email notification state is logged as `failed` with idempotent retry tracking.
  - Background retry worker retries delivery with exponential backoff once the provider recovers.
  - In-app dashboard notifications display confirmation status independently.

### Scenario 6: Custom Domain DNS Misconfiguration
- **Immediate Effect**: Patient visiting `www.customdentalclinic.com` receives DNS NXDOMAIN.
- **Graceful Degradation**:
  - The clinic's primary platform subdomain (`[slug].radiantnobel.com`) remains continuously active.
  - Widget embed code functions independently on any WordPress or third-party host regardless of apex DNS issues.

---

## 5. Disaster Recovery Testing & Verification

- **Quarterly Restoration Drills**: Platform engineers conduct simulated disaster recovery exercises every 90 days.
- **Automated Verification**: CI pipeline verifies backup manifest schemas, checksums, and staging database restorations (`src/lib/backup/backup.test.ts`).

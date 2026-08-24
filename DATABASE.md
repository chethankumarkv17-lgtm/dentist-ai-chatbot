# Database Schema & Relational Architecture

This document details the PostgreSQL database schema, Row Level Security (RLS) policies, indexes, and migrations for the Radiant Nobel Dental SaaS platform.

---

## 1. Entity-Relationship Overview

```
┌─────────────────────────────────┐
│             clinics             │
│ (id, name, slug, timezone, ...) │
└────────────────┬────────────────┘
                 │ 1:N
 ┌───────────────┼───────────────────────────────┬───────────────────────────────┐
 │               │                               │                               │
 ▼               ▼                               ▼                               ▼
┌──────────────┐┌──────────────┐┌──────────────┐┌──────────────┐┌──────────────┐┌──────────────┐
│ clinic_      ││ dentists     ││ services     ││ business_    ││ conversations││ subscriptions│
│ members      ││ (id, name,   ││ (id, name,   ││ hours        ││ (id, status, ││ (id, stripe_ │
│ (user_id,    ││  specialty)  ││  price, dur) ││ (day, open,  ││  created_at) ││  sub_id, ...)│
│  role)       │└──────┬───────┘└──────┬───────┘│  close)      │└──────┬───────┘└──────────────┘
└──────────────┘       │               │        └──────────────┘       │
                       │               │                               ▼
                       ▼               ▼                       ┌──────────────┐
               ┌───────────────────────────────┐               │ messages     │
               │         appointments          │               │ (content,    │
               │ (patient_name, start, status) │               │  sender_type)│
               └───────────────────────────────┘               └──────────────┘
```

---

## 2. Table Schemas & Constraints

### 2.1 Core Multi-Tenant Tables

#### `clinics`
Stores clinic organizations.
- `id` (UUID, Primary Key)
- `name` (TEXT, Not Null)
- `slug` (TEXT, Unique, Not Null)
- `phone` (TEXT)
- `email` (TEXT)
- `address` (TEXT)
- `timezone` (TEXT, Default 'UTC')
- `created_at` (TIMESTAMPTZ, Default NOW())
- `updated_at` (TIMESTAMPTZ, Default NOW())

#### `users` / `clinic_members`
Maps Supabase authenticated users to clinics with Role-Based Access Control (`owner`, `admin`, `dentist`, `receptionist`).
- `id` (UUID, Primary Key)
- `user_id` (UUID, References `auth.users(id)` ON DELETE CASCADE)
- `clinic_id` (UUID, References `clinics(id)` ON DELETE CASCADE)
- `role` (TEXT, Check: `role IN ('owner', 'admin', 'dentist', 'receptionist')`)

---

### 2.2 Practice Management & Availability

#### `services`
Dental procedure catalog and durations.
- `id` (UUID, Primary Key)
- `clinic_id` (UUID, References `clinics(id)` ON DELETE CASCADE)
- `name` (TEXT, Not Null)
- `description` (TEXT)
- `duration_minutes` (INTEGER, Default 30)
- `buffer_time_minutes` (INTEGER, Default 10)
- `price` (NUMERIC(10,2))
- `is_active` (BOOLEAN, Default true)
- `is_bookable` (BOOLEAN, Default true)

#### `dentists`
Practitioners working at the clinic.
- `id` (UUID, Primary Key)
- `clinic_id` (UUID, References `clinics(id)` ON DELETE CASCADE)
- `name` (TEXT, Not Null)
- `email` (TEXT)
- `phone` (TEXT)
- `specialty` (TEXT, Default 'General Dentistry')
- `bio` (TEXT)
- `is_active` (BOOLEAN, Default true)

#### `business_hours`
Clinic-level weekly opening and closing schedules.
- `id` (UUID, Primary Key)
- `clinic_id` (UUID, References `clinics(id)` ON DELETE CASCADE)
- `day_of_week` (INTEGER, Check: `day_of_week BETWEEN 0 AND 6`)
- `open_time` (TIME, Not Null)
- `close_time` (TIME, Not Null)

#### `dentist_availability`
Individual dentist working shifts.
- `id` (UUID, Primary Key)
- `dentist_id` (UUID, References `dentists(id)` ON DELETE CASCADE)
- `day_of_week` (INTEGER, Check: `day_of_week BETWEEN 0 AND 6`)
- `start_time` (TIME, Not Null)
- `end_time` (TIME, Not Null)

#### `appointments`
Authoritative booking records.
- `id` (UUID, Primary Key)
- `clinic_id` (UUID, References `clinics(id)` ON DELETE CASCADE)
- `dentist_id` (UUID, References `dentists(id)` ON DELETE RESTRICT)
- `service_id` (UUID, References `services(id)` ON DELETE RESTRICT)
- `patient_name` (TEXT, Not Null)
- `patient_email` (TEXT, Not Null)
- `patient_phone` (TEXT, Not Null)
- `start_time` (TIMESTAMPTZ, Not Null)
- `end_time` (TIMESTAMPTZ, Not Null)
- `status` (TEXT, Check: `status IN ('confirmed', 'cancelled', 'completed', 'rescheduled')`)
- `confirmation_id` (TEXT, Unique, Not Null)
- `created_at` (TIMESTAMPTZ, Default NOW())
- **Constraint**: `UNIQUE (dentist_id, start_time)` (Prevents double booking)

---

### 2.3 AI Receptionist & Telemetry

#### `conversations` & `messages`
Stores AI receptionist conversation transcripts with automatic retention pruning.
- `conversations`: `id`, `clinic_id`, `status`, `created_at`, `updated_at`
- `messages`: `id`, `conversation_id`, `sender_type ('patient'|'ai'|'staff')`, `content`, `created_at`

#### `knowledge_faqs`
Clinic-specific FAQ knowledge base for AI query resolution.
- `id`, `clinic_id`, `category`, `question`, `answer`, `is_published`

#### `system_metrics` & `system_error_logs`
Production telemetry, latency monitoring, and error reporting.

---

## 3. Row Level Security (RLS) Policy Summary

| Table | Policy Name | Access Condition |
| :--- | :--- | :--- |
| `clinics` | `clinic_tenant_isolation` | `id IN (SELECT clinic_id FROM clinic_members WHERE user_id = auth.uid())` |
| `services` | `services_tenant_isolation` | `clinic_id IN (SELECT clinic_id FROM clinic_members WHERE user_id = auth.uid())` |
| `dentists` | `dentists_tenant_isolation` | `clinic_id IN (SELECT clinic_id FROM clinic_members WHERE user_id = auth.uid())` |
| `appointments` | `appointments_tenant_isolation` | `clinic_id IN (SELECT clinic_id FROM clinic_members WHERE user_id = auth.uid())` |
| `conversations` | `conversations_tenant_isolation`| `clinic_id IN (SELECT clinic_id FROM clinic_members WHERE user_id = auth.uid())` |
| `support_tickets`| `support_tenant_isolation` | `clinic_id IN (SELECT clinic_id FROM clinic_members WHERE user_id = auth.uid())` |

---

## 4. Migrations Catalog

1. `20260823000000_initial_schema.sql`: Core clinic, auth, services, dentists, appointments schema.
2. `20260823000001_phase13_config.sql`: Business hours, knowledge FAQs, and site builder tables.
3. `20260823000001_rls_policies.sql`: Tenant RLS isolation policies across all tables.
4. `20260823000002_phase20_calendar.sql`: Google & Outlook calendar sync tokens.
5. `20260823000003_phase21_billing.sql`: Stripe customer, subscription, and pricing tier mapping.
6. `20260823000004_phase22_webhook_reliability.sql`: Processed webhook idempotency records.
7. `20260823000005_phase23_usage_limits.sql`: Usage tracking and plan quota meters.
8. `20260823000006_phase24_analytics.sql`: Event tracking and daily metric rollups.
9. `20260823000007_phase25_platform_admin.sql`: Super-admin audit logging.
10. `20260823000008_phase26_support.sql`: Clinic support desk tickets and notes.
11. `20260823000009_phase27_privacy.sql`: Account, organization, and patient GDPR/HIPAA erasure cascade rules.
12. `20260823000010_phase28_secure_uploads.sql`: File attachment security and metadata validation.
13. `20260823000011_phase30_monitoring.sql`: Error logging and system health metrics.
14. `20260823000012_phase34_performance_indexes.sql`: Composite and B-tree performance indexes.

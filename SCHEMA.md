# Database Schema Documentation

This document describes the PostgreSQL schema designed for the Dental AI SaaS platform. 
The schema strongly enforces multi-tenancy, data integrity, and strict booking constraints at the database level.

## Key Design Principles
*   **Multi-tenancy:** Uses `organization_id` at the root of tenant-owned tables.
*   **RLS (Row Level Security):** Enabled on all tables. Policies will dynamically secure rows based on `auth.uid()` and `organization_id`.
*   **UUIDs:** Used for all primary keys to obscure IDs and ensure global uniqueness across distributed data.
*   **Prevent Double Booking:** The `appointments` table uses an EXCLUDE constraint backed by a GiST index (`btree_gist` extension required) to guarantee that overlapping time slots for the same `dentist_id` cannot exist (unless cancelled).

## Tables

### Core Multi-tenancy
*   **`organizations`**: The top-level tenant. 
*   **`profiles`**: Linked to `auth.users`. Stores basic user info.
*   **`organization_members`**: Link table mapping profiles to organizations with a `role` (owner, admin, member).

### Clinic & Staff Management
*   **`clinics`**: Physical locations tied to an organization.
*   **`staff`**: Clinic employees.
*   **`dentists`**: Practitioners who can receive bookings. Linked to clinics.
*   **`services`**: Procedures offered at a clinic (with duration and price).

### Scheduling & Availability
*   **`business_hours`**: Default open/close times per clinic.
*   **`dentist_availability`**: Specific working hours for each dentist.
*   **`blocked_times`**: Overrides/time-offs where dentists cannot be booked.
*   **`holidays`**: Clinic-level closures.

### Patients & Appointments
*   **`patients`**: Customers booking appointments, siloed by organization.
*   **`appointments`**: The actual booked slots. Contains an EXCLUDE constraint:
    ```sql
    EXCLUDE USING gist (dentist_id WITH =, tsrange(start_time, end_time) WITH &&) WHERE (status != 'cancelled')
    ```
*   **`appointment_events`**: Audit trail of changes to an appointment.

### AI Chatbot
*   **`chatbot_settings`**: Configuration and theming per clinic.
*   **`clinic_faqs`**: Knowledge base items for the AI to ingest.
*   **`conversations` & `messages`**: Transcript history between the patient and AI.

### Website Builder (Path B)
*   **`clinic_websites`**: Template settings and metadata for hosted websites.
*   **`website_pages`**: The dynamic content pages for a clinic's website.
*   **`website_domains`**: Custom domains and verification status.
*   **`website_installations`**: Audit table verifying where the widget has been installed.

### Billing & Usage
*   **`plans` & `subscriptions`**: Stripe integration mapping.
*   **`usage_records`**: Tracking appointment counts per billing cycle.
*   **`ai_usage`**: Tracking token usage for cost analysis.

### Notifications & Logs
*   **`notifications` & `notification_events`**: Record of SMS/Emails sent via Resend.
*   **`audit_logs`**: Crucial system changes for security compliance.
*   **`calendar_connections`**: OAuth tokens for syncing with external calendars.
*   **`webhook_events`**: Idempotent webhook tracking for Stripe.

## Development Seed Data
A development `seed.sql` file has been provided to bootstrap the local Supabase environment with dummy data. **This data is hardcoded and must never be run against a production environment.**

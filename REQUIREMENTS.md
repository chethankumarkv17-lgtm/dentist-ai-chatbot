# Requirements Document

## Product Purpose
A production-ready B2B SaaS platform for dental clinics. The system provides an AI dental receptionist and appointment booking system to handle patient queries and scheduling.

## Target Customer
Dental clinics seeking to automate their front-desk operations (answering common questions and booking appointments) via an AI assistant.

## Two Customer Paths
1.  **Path A (Existing Website):** Dentist signs up, configures their clinic/services, and installs a chatbot snippet (JS/iframe) on their pre-existing website.
2.  **Path B (Needs Website):** Dentist signs up, selects a dental website template provided by the platform, configures it, and publishes a hosted website with the chatbot automatically integrated.
*Both paths share the exact same underlying booking engine, database, and AI system.*

## User Roles
*   **Platform Admin:** Manages global SaaS settings, subscriptions, and platform health.
*   **Clinic Admin / Dentist:** Manages clinic profile, staff (dentists), services, availability, and views appointments.
*   **Patient:** End-user interacting with the AI chatbot to ask questions and book appointments.

## Core Features
*   Multi-tenant clinic organization and management.
*   Service and staff (dentist) configuration.
*   Working hours and availability scheduling.
*   AI Chatbot receptionist (OpenAI based).
*   Real-time appointment booking engine.
*   Embeddable chatbot widget architecture.
*   Website builder for Path B customers.
*   Notifications and confirmations.
*   Analytics and billing.

## Non-Goals
*   The AI will NOT diagnose patients or prescribe medication.
*   The system will NOT unnecessarily collect comprehensive medical histories.
*   The AI will NOT invent (hallucinate) clinic info, prices, or availability.

## Technical Architecture
*   **Frontend:** Next.js App Router, TypeScript, Tailwind CSS, shadcn/ui.
*   **Backend:** Next.js Server Actions / Route Handlers.
*   **Database:** PostgreSQL + Supabase.
*   **Chatbot:** Isolated iframe/widget UI with a secure backend.

## External Services
*   **Supabase:** Database, Authentication, Row Level Security.
*   **OpenAI:** AI language model.
*   **Stripe:** Payments and subscriptions.
*   **Resend:** Email notifications.
*   **Vercel:** Deployment and hosting.

## Security Requirements
*   Never trust browser-supplied IDs or authorization values.
*   Validate all authorization server-side.
*   Strict multi-tenant data segregation (Clinic A cannot access Clinic B data).
*   AI never directly writes to the database; it calls strictly validated backend tools.
*   No secrets exposed in the widget or frontend.

## Privacy Requirements
*   Collect minimum necessary patient information.
*   Strict separation of clinic data.
*   Create robust privacy and data-control architecture.

## Testing Requirements
*   Vitest for unit/integration.
*   Playwright for E2E.
*   Mandatory linting, typechecking, and production builds passing before considering any phase complete.

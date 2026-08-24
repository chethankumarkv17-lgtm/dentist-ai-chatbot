# Radiant Nobel — Data Privacy & Retention Policy

Radiant Nobel is built upon **privacy-by-design** principles to protect patient confidentiality, clinic operational records, and staff credentials.

---

## 1. Data Minimization & Collection Boundaries

- **Essential Booking Fields Only**: We only collect the bare minimum fields required for appointment coordination: Patient Name, Email, Phone Number, Selected Service, and Preferred Time Slot.
- **Zero Sensitive Medical Records**: The platform explicitly **does not store** electronic health records (EHR), dental radiographs, detailed diagnostic charts, insurance social security numbers, or payment card numbers.
- **No Unnecessary PHI Logging**: System error logs and analytics pipelines automatically mask and sanitize patient identifiers before persistence.

---

## 2. AI Receptionist Privacy Safeguards

- **No Model Training on Patient Chats**: OpenAI API zero-data-retention agreements ensure patient conversations are never used to train foundational AI models.
- **Strict Receptionist Scope**: The AI is bounded to appointment scheduling and clinic FAQs. If a patient shares sensitive clinical symptoms, the AI redirects to an in-person dental exam and does not store the clinical commentary in open logs.
- **Session Lifespans**: Transient conversation contexts are purged upon session completion.

---

## 3. Data Retention & Automatic Pruning

Clinics can configure their data retention lifecycle directly in the Dashboard:
- **Chat Transcripts**: Retained for 30, 90, or 180 days (default: 90 days), after which messages are permanently deleted via automated cron jobs.
- **Completed Appointments**: Retained according to state/jurisdiction dental practice record mandates.
- **Audit Logs**: Retained for 365 days for forensic tracking.

---

## 4. Patient Rights & Data Subject Access Requests (DSAR)

### A. Right to Access & Data Export
Clinics can generate a machine-readable JSON/CSV bundle of a patient's booking history and communication logs via `exportPatientData()`.

### B. Right to Erasure / Anonymization
Upon patient request, clinic admins can invoke `deletePatientData()` to:
1. Redact patient full name to `[Anonymized Patient]`.
2. Scramble email and telephone numbers with irreversible hashes.
3. Permanently purge associated chat messages and upload attachments.

### C. Organization & Account Deletion
- **User Account Deletion**: Completely removes the staff profile from Supabase Auth and `clinic_members`.
- **Clinic Organization Deletion**: Triggers an authoritative cascade deletion across `services`, `dentists`, `appointments`, `conversations`, `messages`, `knowledge_faqs`, and storage buckets.

---

## 5. Compliance Verification Notice

> [!NOTE]
> While Radiant Nobel implements technical safeguards aligned with HIPAA Security Rule specifications, GDPR Chapter III rights, and state privacy acts, dental practices must maintain their own Business Associate Agreements (BAAs) and independent legal compliance audits.

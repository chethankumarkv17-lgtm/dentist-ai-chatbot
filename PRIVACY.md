# Radiant Nobel — Data Privacy & Retention Policy

Radiant Nobel is built upon **privacy-by-design** principles to protect patient confidentiality, clinic operational records, and staff credentials across Website, WhatsApp, and Voice channels.

---

## 1. Data Minimization & Collection Boundaries

- **Essential Booking Fields Only**: We only collect the bare minimum fields required for appointment coordination: Patient Name, Email, Phone Number, Selected Service, and Preferred Time Slot.
- **Voice Privacy Controls**:
  - Voice calls store only necessary metadata (`caller_phone`, `duration_seconds`, `status`, `outcome`, `appointment_id`).
  - No raw caller audio recordings are stored by default.
  - Call transcripts are partitioned with strict RLS access controls and excluded from normal application logs.
- **WhatsApp Privacy Controls**: When a patient messages on WhatsApp, only their phone number and display profile name are stored.
- **Zero Sensitive Financial or Medical Records**: No EHR, dental radiographs, payment cards, or UPI credentials stored.

---

## 2. AI Receptionist Privacy Safeguards

- **Anthropic Claude Zero Data Retention**: Enterprise API privacy guarantees ensure patient conversations are never used to train foundational AI models.
- **Strict Receptionist Scope**: The AI is bounded to appointment scheduling and clinic FAQs. Clinical commentary is never logged in public telemetry.

---

## 3. Data Retention & Automatic Pruning

Clinics can configure their data retention lifecycle directly in the Dashboard:
- **Chat & Voice Transcripts**: Retained for 30, 90, or 180 days (default: 90 days), after which messages are permanently deleted.
- **Completed Appointments**: Retained according to state/jurisdiction dental practice record mandates.
- **Audit Logs**: Retained for 365 days for forensic tracking.

---

## 4. Patient Rights & Data Subject Access Requests (DSAR)

### A. Right to Access & Data Export
Clinics can generate a machine-readable JSON/CSV bundle of a patient's booking history and communication logs via `exportPatientData()`.

### B. Right to Erasure / Anonymization
Upon patient request, clinic admins can permanently anonymize patient records and purge associated transcripts.

### C. Organization & Account Deletion
Completely removes clinic records, bookings, and connections across all storage buckets and databases.

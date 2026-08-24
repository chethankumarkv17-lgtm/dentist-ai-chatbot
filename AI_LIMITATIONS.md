# Radiant Nobel — AI Receptionist Quality, Safety & Limitations

This document details the operational boundaries, safety guardrails, hallucination prevention mechanisms, and known limitations of the Radiant Nobel AI Dental Receptionist.

---

## 1. System Scope & Role Definition

The AI Receptionist is an **administrative healthcare assistant** designed to:
- Greet patients and answer clinic FAQs (hours, address, parking, insurance).
- Present verified dental services and pricing from the clinic database.
- Query real-time dentist shift availability (`getAvailableSlots`).
- Assist patients in booking, rescheduling, and cancelling dental visits.
- Escalate emergencies or complex patient requests to front-desk staff (`requestHumanHelp`).

---

## 2. Strict Healthcare & Safety Guardrails

### A. Medical Diagnosis & Prescription Refusal
- **Limitation**: The AI is strictly prohibited from diagnosing clinical conditions, assessing radiographs/photos, or prescribing medications (e.g., antibiotics, painkillers).
- **Behavior**: Any diagnostic or prescription inquiry immediately returns a medical disclaimer and offers to schedule an in-person clinical exam with a licensed dentist.

### B. Dangerous DIY Treatment Intervention
- **Behavior**: Inquiries involving self-extractions (pliers, string), household bleach whitening, or home lancing of dental abscesses are intercepted immediately with emergency safety warnings.

### C. Emergency & Acute Trauma Triage
- **Behavior**: Patients reporting acute trauma, uncontrolled bleeding, or severe pain are directed immediately to emergency medical care and flagged for staff intervention (`requestHumanHelp`).

---

## 3. Hallucination Prevention & The Backend Confirmation Rule

> [!IMPORTANT]
> **Backend Confirmation Invariance**: The AI must **never** claim or imply that an appointment has been booked or confirmed unless the backend database has returned an authoritative `{ success: true, confirmationId: '...' }` payload.

1. **No Phantom Bookings**: If a slot is taken or a database mutex lock fails, the AI explicitly reports that the slot is unavailable and offers alternative verified times.
2. **Verified Service Catalog Only**: The AI only references services, durations, and prices stored in PostgreSQL. It will never invent procedures (e.g., brain surgery, cosmetic tattoos) or alter fees.
3. **No Direct Database Access**: The AI operates exclusively through controlled, server-validated tools (`executeTool()`).

---

## 4. Security & Privacy Guardrails

| Threat Vector | Mitigation Strategy |
| :--- | :--- |
| **Prompt Injection & Jailbreaks** | Multi-pattern regex filter intercepting instruction overrides, DAN modes, and developer mode attempts before LLM evaluation. |
| **System Prompt Extraction** | Blocks requests to reveal hidden prompts, internal instructions, or system messages. |
| **Data Exfiltration & HIPAA Probing** | Rejects any attempt to query, list, or dump records belonging to other patients. |
| **Cross-Tenant Probing** | Cryptographically and logically isolates clinic context; validates `authorizedClinicId === toolArgs.clinicId` before every tool call. |
| **Harassment & Malicious Input** | Responds neutrally and professionally to abusive or toxic user input without escalating. |
| **Spam / Message Loops** | Detects repeated user messages within conversation history and provides scoped front-desk guidance. |
| **Excessive Payload Floods** | Enforces a maximum character limit (3,000 chars) to prevent context buffer overflow. |

---

## 5. Graceful Degradation & Outage Handling

- **OpenAI API Outage**: The system automatically transitions to **High-Availability Menu Mode** (`getDegradedAiResponse()`), providing interactive buttons for service selection, opening hours, and direct booking slots without conversational stall.
- **Database Connection Latency**: Server-side 8-second timeout circuit breaker prevents hanging patient chats.
- **Burst Spike Protection**: Sliding-window rate limiters block abusive IP bursts (>15 requests/minute).

---

## 6. Continuous Evaluation & Quality Testing

All safety policies, tool execution pathways, and boundary rules are verified continuously via automated Vitest test suites:
- [`src/lib/ai/ai-evaluation.test.ts`](file:///c:/Users/HP/Documents/antigravity/radiant-nobel/src/lib/ai/ai-evaluation.test.ts)
- [`src/lib/ai/safety.test.ts`](file:///c:/Users/HP/Documents/antigravity/radiant-nobel/src/lib/ai/safety.test.ts)
- [`src/lib/ai/receptionist.test.ts`](file:///c:/Users/HP/Documents/antigravity/radiant-nobel/src/lib/ai/receptionist.test.ts)

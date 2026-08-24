# API Reference & Server Actions Catalog

This document details all REST API routes, Server Actions, request/response formats, error codes, and rate limits for Radiant Nobel.

---

## 1. REST API Endpoints

### 1.1 `POST /api/chat`
Server-side AI Receptionist conversation endpoint.

- **Access**: Public / Embedded Widget
- **Rate Limit**: 15 requests / minute per IP
- **Request Body**:
```json
{
  "clinicId": "UUID",
  "message": "Can I book a teeth cleaning for tomorrow?",
  "conversationId": "conv-123456 (optional)",
  "history": [
    { "role": "user", "content": "Hi" },
    { "role": "assistant", "content": "Hello! How can I assist you today?" }
  ]
}
```
- **Response (200 OK)**:
```json
{
  "success": true,
  "reply": "We have the following openings on 2026-08-25: 09:00 AM, 11:00 AM, 02:00 PM. Would you like to book one of these times?",
  "conversationId": "conv-123456",
  "toolCallsExecuted": [
    {
      "tool": "getAvailableSlots",
      "args": { "clinicId": "...", "date": "2026-08-25" },
      "result": { "success": true, "data": { "slots": [...] } }
    }
  ]
}
```

---

### 1.2 `GET /api/widget/config`
Retrieves public clinic branding and greeting configuration for the chat widget.

- **Access**: Public (CORS enabled: `*`)
- **Cache-Control**: `public, s-maxage=300, stale-while-revalidate=600`
- **Query Params**: `?id=[widgetIdOrClinicId]`
- **Response (200 OK)**:
```json
{
  "clinicName": "Downtown Smile Dental",
  "themeColor": "#007BFF",
  "verified": true,
  "greeting": "Hello! How can I help you book an appointment today?"
}
```

---

### 1.3 `POST /api/upload`
Secure multipart file upload endpoint (logos, dentist photos, clinic images).

- **Access**: Authenticated Clinic Staff
- **Max Size**: 5 MB (Images: JPEG, PNG, WebP)
- **Validation**: Magic-byte signature detection (rejects executable files disguised with fake extensions).
- **Response (200 OK)**:
```json
{
  "success": true,
  "url": "https://storage.radiantnobel.com/clinics/c1/logo-172447.webp",
  "filename": "clinic-logo.webp",
  "size": 142050,
  "mimeType": "image/webp"
}
```

---

### 1.4 `POST /api/webhooks/stripe`
Idempotent Stripe subscription webhook receiver.

- **Access**: Stripe Webhook Service (`stripe-signature` HMAC verification)
- **Handled Events**:
  - `checkout.session.completed` $\rightarrow$ Activates subscription tier.
  - `customer.subscription.updated` $\rightarrow$ Updates plan status / seats.
  - `customer.subscription.deleted` $\rightarrow$ Downgrades to free / cancellation grace period.
  - `invoice.payment_failed` $\rightarrow$ Enters 3-day billing grace period.

---

## 2. Server Actions Catalog

### 2.1 Appointments & Booking (`src/app/actions/public-booking.ts`)
- `getPublicAvailability(clinicSlug, serviceId, dentistId, date)`: Returns bookable non-overlapping slots.
- `submitPublicBooking(clinicSlug, serviceId, dentistId, startTime, patientDetails)`: Atomically commits booking with confirmation ID.

### 2.2 Custom Domains (`src/app/actions/domains.ts`)
- `addCustomDomain(clinicId, domain)`: Registers custom domain for verification.
- `verifyDomainStatus(clinicId, domain)`: Checks DNS CNAME and TXT challenge records.
- `removeCustomDomain(clinicId, domain)`: Unbinds custom domain.

### 2.3 Privacy & Data Management (`src/app/actions/privacy.ts`)
- `deleteAccount()`: Erases authenticated user record.
- `deleteOrganization(clinicId)`: Cascades complete deletion of clinic, appointments, and transcripts.
- `deletePatientData(clinicId, patientEmailOrPhone)`: Redacts patient PII and past bookings.
- `exportPatientData(clinicId, patientEmailOrPhone)`: Generates exportable JSON data bundle.

---

## 3. Error Codes & HTTP Status Codes

| Code | HTTP Status | Description |
| :--- | :--- | :--- |
| `UNAUTHORIZED` | 401 | Missing or invalid authentication token. |
| `FORBIDDEN` | 403 | Attempted cross-tenant access or role restriction. |
| `SLOT_UNAVAILABLE`| 409 | Requested appointment slot was booked concurrently. |
| `INVALID_FILE_TYPE`| 400 | Uploaded file failed magic-byte MIME validation. |
| `PAYLOAD_TOO_LARGE`| 413 | Uploaded file or message exceeds maximum limit. |
| `RATE_LIMITED` | 429 | Exceeded IP rate limit threshold. |

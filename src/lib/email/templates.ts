/**
 * Responsive, clean, professional healthcare SaaS email templates for dental appointments.
 */

export interface EmailTemplatePayload {
  clinicName: string;
  clinicPhone?: string;
  clinicAddress?: string;
  patientName: string;
  dentistName: string;
  serviceName: string;
  startTimeFormatted: string;
  endTimeFormatted?: string;
  confirmationId?: string;
  reason?: string;
}

export function baseEmailWrapper(title: string, bodyContent: string, clinicName: string, clinicAddress?: string, clinicPhone?: string): { html: string; text: string } {
  const html = `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>${title}</title>
  <style>
    body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; background-color: #f8fafc; color: #1e293b; margin: 0; padding: 24px; }
    .container { max-width: 580px; margin: 0 auto; background: #ffffff; border-radius: 12px; border: 1px solid #e2e8f0; overflow: hidden; box-shadow: 0 4px 6px -1px rgba(0,0,0,0.05); }
    .header { background: #0284c7; color: #ffffff; padding: 24px 32px; text-align: center; }
    .header h1 { margin: 0; font-size: 22px; font-weight: 700; }
    .content { padding: 32px; font-size: 15px; line-height: 1.6; }
    .card { background: #f1f5f9; border-radius: 8px; padding: 18px; margin: 20px 0; border-left: 4px solid #0284c7; }
    .card-item { margin: 6px 0; }
    .card-label { font-weight: 600; color: #475569; }
    .footer { background: #f8fafc; padding: 20px 32px; font-size: 13px; color: #64748b; text-align: center; border-top: 1px solid #e2e8f0; }
  </style>
</head>
<body>
  <div class="container">
    <div class="header">
      <h1>${clinicName}</h1>
    </div>
    <div class="content">
      ${bodyContent}
    </div>
    <div class="footer">
      <p style="margin: 4px 0;"><strong>${clinicName}</strong></p>
      ${clinicAddress ? `<p style="margin: 4px 0;">${clinicAddress}</p>` : ''}
      ${clinicPhone ? `<p style="margin: 4px 0;">Phone: ${clinicPhone}</p>` : ''}
      <p style="margin-top: 12px; font-size: 11px; color: #94a3b8;">Automated message from your dental care provider.</p>
    </div>
  </div>
</body>
</html>
  `.trim();

  const text = `
${clinicName.toUpperCase()}
--------------------------------------------------
${title}

${bodyContent.replace(/<[^>]+>/g, ' ').replace(/\s+/g, ' ').trim()}

--------------------------------------------------
${clinicName}
${clinicAddress || ''}
${clinicPhone ? `Phone: ${clinicPhone}` : ''}
  `.trim();

  return { html, text };
}

// 1. Appointment Confirmation
export function renderAppointmentConfirmationEmail(data: EmailTemplatePayload): { subject: string; html: string; text: string } {
  const subject = `Confirmed: Your Appointment at ${data.clinicName}`;
  const body = `
    <h2 style="margin-top: 0; color: #0f172a;">Appointment Confirmed</h2>
    <p>Dear ${data.patientName},</p>
    <p>Your upcoming dental visit has been officially confirmed. We look forward to providing you with exceptional care.</p>
    
    <div class="card">
      <div class="card-item"><span class="card-label">Service:</span> ${data.serviceName}</div>
      <div class="card-item"><span class="card-label">Dentist:</span> Dr. ${data.dentistName}</div>
      <div class="card-item"><span class="card-label">Date & Time:</span> ${data.startTimeFormatted}</div>
      ${data.confirmationId ? `<div class="card-item"><span class="card-label">Reference ID:</span> ${data.confirmationId}</div>` : ''}
    </div>

    <p>Please arrive 10 minutes prior to your scheduled time. If you need to reschedule or have any questions, feel free to reach out to us.</p>
  `;

  const { html, text } = baseEmailWrapper(subject, body, data.clinicName, data.clinicAddress, data.clinicPhone);
  return { subject, html, text };
}

// 2. Appointment Cancellation
export function renderAppointmentCancellationEmail(data: EmailTemplatePayload): { subject: string; html: string; text: string } {
  const subject = `Cancelled: Appointment at ${data.clinicName}`;
  const body = `
    <h2 style="margin-top: 0; color: #b91c1c;">Appointment Cancelled</h2>
    <p>Dear ${data.patientName},</p>
    <p>This message confirms that your scheduled dental appointment has been cancelled.</p>
    
    <div class="card" style="border-left-color: #ef4444;">
      <div class="card-item"><span class="card-label">Service:</span> ${data.serviceName}</div>
      <div class="card-item"><span class="card-label">Dentist:</span> Dr. ${data.dentistName}</div>
      <div class="card-item"><span class="card-label">Original Time:</span> ${data.startTimeFormatted}</div>
      ${data.reason ? `<div class="card-item"><span class="card-label">Reason:</span> ${data.reason}</div>` : ''}
    </div>

    <p>Whenever you are ready to book a new appointment, you can visit our online booking portal or give our front desk a call.</p>
  `;

  const { html, text } = baseEmailWrapper(subject, body, data.clinicName, data.clinicAddress, data.clinicPhone);
  return { subject, html, text };
}

// 3. Appointment Rescheduling
export function renderAppointmentReschedulingEmail(data: EmailTemplatePayload): { subject: string; html: string; text: string } {
  const subject = `Rescheduled: Your New Appointment Time at ${data.clinicName}`;
  const body = `
    <h2 style="margin-top: 0; color: #0284c7;">Appointment Rescheduled</h2>
    <p>Dear ${data.patientName},</p>
    <p>Your dental appointment has been successfully updated to a new time slot.</p>
    
    <div class="card">
      <div class="card-item"><span class="card-label">Service:</span> ${data.serviceName}</div>
      <div class="card-item"><span class="card-label">Dentist:</span> Dr. ${data.dentistName}</div>
      <div class="card-item"><span class="card-label">New Date & Time:</span> <strong>${data.startTimeFormatted}</strong></div>
      ${data.confirmationId ? `<div class="card-item"><span class="card-label">Reference ID:</span> ${data.confirmationId}</div>` : ''}
    </div>

    <p>We look forward to seeing you at your new scheduled time!</p>
  `;

  const { html, text } = baseEmailWrapper(subject, body, data.clinicName, data.clinicAddress, data.clinicPhone);
  return { subject, html, text };
}

// 4. Clinic Booking Notification (Internal Staff Alert)
export function renderClinicBookingNotificationEmail(data: EmailTemplatePayload): { subject: string; html: string; text: string } {
  const subject = `[New Booking Alert] ${data.patientName} - ${data.serviceName}`;
  const body = `
    <h2 style="margin-top: 0; color: #0f172a;">New Patient Booking Received</h2>
    <p>A new appointment has been scheduled via the AI / website booking system.</p>
    
    <div class="card">
      <div class="card-item"><span class="card-label">Patient:</span> ${data.patientName}</div>
      <div class="card-item"><span class="card-label">Service:</span> ${data.serviceName}</div>
      <div class="card-item"><span class="card-label">Dentist:</span> Dr. ${data.dentistName}</div>
      <div class="card-item"><span class="card-label">Date & Time:</span> ${data.startTimeFormatted}</div>
      ${data.confirmationId ? `<div class="card-item"><span class="card-label">Appointment ID:</span> ${data.confirmationId}</div>` : ''}
    </div>

    <p>Please ensure all records and operatories are prepared accordingly.</p>
  `;

  const { html, text } = baseEmailWrapper(subject, body, data.clinicName, data.clinicAddress, data.clinicPhone);
  return { subject, html, text };
}

// 5. Appointment Reminder
export function renderAppointmentReminderEmail(data: EmailTemplatePayload): { subject: string; html: string; text: string } {
  const subject = `Reminder: Upcoming Dental Appointment at ${data.clinicName}`;
  const body = `
    <h2 style="margin-top: 0; color: #0284c7;">Upcoming Visit Reminder</h2>
    <p>Dear ${data.patientName},</p>
    <p>This is a friendly reminder of your scheduled dental appointment tomorrow.</p>
    
    <div class="card">
      <div class="card-item"><span class="card-label">Service:</span> ${data.serviceName}</div>
      <div class="card-item"><span class="card-label">Dentist:</span> Dr. ${data.dentistName}</div>
      <div class="card-item"><span class="card-label">Date & Time:</span> ${data.startTimeFormatted}</div>
      ${data.confirmationId ? `<div class="card-item"><span class="card-label">Reference ID:</span> ${data.confirmationId}</div>` : ''}
    </div>

    <p>If you have any dental insurance changes or need directions, please contact our office prior to your arrival.</p>
  `;

  const { html, text } = baseEmailWrapper(subject, body, data.clinicName, data.clinicAddress, data.clinicPhone);
  return { subject, html, text };
}

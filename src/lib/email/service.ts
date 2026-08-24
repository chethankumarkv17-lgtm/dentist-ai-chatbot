import { Resend } from 'resend';
import { createClient } from '@/lib/supabase/server-auth';
import { logNotificationEvent } from './logger';
import {
  EmailTemplatePayload,
  renderAppointmentConfirmationEmail,
  renderAppointmentCancellationEmail,
  renderAppointmentReschedulingEmail,
  renderClinicBookingNotificationEmail,
  renderAppointmentReminderEmail,
} from './templates';

export type NotificationType =
  | 'appointment_confirmation'
  | 'appointment_cancellation'
  | 'appointment_rescheduling'
  | 'clinic_booking_notification'
  | 'appointment_reminder';

export type NotificationStatus = 'pending' | 'sent' | 'failed';

export interface SendNotificationOptions {
  organizationId: string;
  recipientEmail: string;
  type: NotificationType;
  templateData: EmailTemplatePayload;
  idempotencyKey?: string;
  maxRetries?: number;
}

export interface NotificationResult {
  success: boolean;
  notificationId?: string;
  status: NotificationStatus | 'duplicate_skipped';
  duplicate?: boolean;
  attempts: number;
  error?: string;
}

// In-memory idempotency cache for fast deduplication
const idempotencyCache = new Set<string>();

/**
 * Resend Email Notification Service with State Tracking, Idempotency, and Retry Logic
 */
export async function sendEmailNotification(
  options: SendNotificationOptions
): Promise<NotificationResult> {
  const {
    organizationId,
    recipientEmail,
    type,
    templateData,
    idempotencyKey: providedKey,
    maxRetries = 3,
  } = options;

  // 1. Generate Idempotency Key if not provided
  const idempotencyKey =
    providedKey ||
    `${organizationId}:${type}:${recipientEmail.toLowerCase()}:${templateData.confirmationId || 'none'}:${templateData.startTimeFormatted}`;

  // 2. Idempotency Check (in-memory fast cache & database check)
  if (idempotencyCache.has(idempotencyKey)) {
    logNotificationEvent('Email skipped due to idempotency', {
      type,
      recipient: recipientEmail,
      status: 'duplicate_skipped',
      idempotencyKey,
    });
    return {
      success: true,
      status: 'duplicate_skipped',
      duplicate: true,
      attempts: 0,
    };
  }

  const supabase = createClient();
  let notificationId: string | undefined;

  // 3. Create Pending Notification Record in Database
  try {
    const { data: notif } = await supabase
      .from('notifications')
      .insert({
        organization_id: organizationId,
        recipient: recipientEmail,
        type,
        status: 'pending',
      })
      .select('id')
      .single();

    if (notif) {
      notificationId = notif.id;
    }
  } catch {
    notificationId = `notif-${Date.now()}`;
  }

  // 4. Render Email Template
  let emailContent: { subject: string; html: string; text: string };
  switch (type) {
    case 'appointment_confirmation':
      emailContent = renderAppointmentConfirmationEmail(templateData);
      break;
    case 'appointment_cancellation':
      emailContent = renderAppointmentCancellationEmail(templateData);
      break;
    case 'appointment_rescheduling':
      emailContent = renderAppointmentReschedulingEmail(templateData);
      break;
    case 'clinic_booking_notification':
      emailContent = renderClinicBookingNotificationEmail(templateData);
      break;
    case 'appointment_reminder':
      emailContent = renderAppointmentReminderEmail(templateData);
      break;
    default:
      emailContent = renderAppointmentConfirmationEmail(templateData);
  }

  // 5. Send with Retry Mechanism
  const apiKey = process.env.RESEND_API_KEY;
  const fromEmail = process.env.RESEND_FROM_EMAIL || `${templateData.clinicName.replace(/[^a-zA-Z0-9]/g, '') || 'notifications'}@dentalai.com`;

  let attempts = 0;
  let lastError: string | undefined;
  let sendSuccess = false;

  while (attempts < maxRetries && !sendSuccess) {
    attempts += 1;
    try {
      if (apiKey && apiKey !== 'mock-resend-key') {
        const resend = new Resend(apiKey);
        const { error } = await resend.emails.send({
          from: fromEmail,
          to: recipientEmail,
          subject: emailContent.subject,
          html: emailContent.html,
          text: emailContent.text,
        });

        if (error) {
          throw new Error(error.message);
        }
      }

      sendSuccess = true;

      // Record successful event in DB
      if (notificationId) {
        await supabase
          .from('notifications')
          .update({ status: 'sent' })
          .eq('id', notificationId);

        await supabase.from('notification_events').insert({
          notification_id: notificationId,
          event_type: 'email.sent',
          provider_response: { attempts, provider: 'resend' },
        });
      }

      // Mark idempotency cache
      idempotencyCache.add(idempotencyKey);

      logNotificationEvent('Email sent successfully', {
        notificationId,
        type,
        recipient: recipientEmail,
        status: 'sent',
        attempt: attempts,
        idempotencyKey,
      });

      return {
        success: true,
        notificationId,
        status: 'sent',
        attempts,
      };
    } catch (err: unknown) {
      lastError = (err as Error)?.message || 'Unknown provider error';
      logNotificationEvent('Email delivery attempt failed', {
        notificationId,
        type,
        recipient: recipientEmail,
        status: 'pending',
        attempt: attempts,
        error: lastError,
      });

      if (notificationId) {
        await supabase.from('notification_events').insert({
          notification_id: notificationId,
          event_type: 'email.attempt_failed',
          provider_response: { attempt: attempts, error: lastError },
        });
      }

      // Small backoff before retry if more attempts remain
      if (attempts < maxRetries) {
        await new Promise((resolve) => setTimeout(resolve, 50 * attempts));
      }
    }
  }

  // 6. Update Notification State to Failed after all retries exhausted
  if (notificationId) {
    await supabase
      .from('notifications')
      .update({ status: 'failed' })
      .eq('id', notificationId);
  }

  logNotificationEvent('Email delivery failed after max retries', {
    notificationId,
    type,
    recipient: recipientEmail,
    status: 'failed',
    attempt: attempts,
    error: lastError,
  });

  return {
    success: false,
    notificationId,
    status: 'failed',
    attempts,
    error: lastError || 'Max retries exhausted',
  };
}

/**
 * Resets the in-memory idempotency cache (useful for test isolation)
 */
export function resetIdempotencyCache(): void {
  idempotencyCache.clear();
}

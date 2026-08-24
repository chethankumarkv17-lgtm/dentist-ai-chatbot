import { createClient } from '@/lib/supabase/server-auth';
import { WhatsAppClient } from './client';
import { buildAppointmentReminderTemplate } from './templates';

export interface ReminderJob {
  id: string;
  appointmentId: string;
  clinicId: string;
  patientId: string;
  recipientPhone: string;
  reminderType: '24h' | '2h';
  scheduledFor: string;
  status: 'scheduled' | 'sent' | 'delivered' | 'failed';
}

/**
 * Schedules 24h and 2h pre-appointment WhatsApp reminders for a newly confirmed booking.
 */
export async function scheduleAppointmentReminders(params: {
  appointmentId: string;
  clinicId: string;
  patientId: string;
  patientPhone: string;
  appointmentStartTimeIso: string;
}): Promise<{ scheduled: number }> {
  const { appointmentId, clinicId, patientId, patientPhone, appointmentStartTimeIso } = params;
  const supabase = createClient();
  const startTime = new Date(appointmentStartTimeIso).getTime();

  const reminder24hTime = new Date(startTime - 24 * 60 * 60 * 1000).toISOString();
  const reminder2hTime = new Date(startTime - 2 * 60 * 60 * 1000).toISOString();
  const now = Date.now();

  const remindersToInsert = [];

  // Only schedule if the reminder time is in the future
  if (new Date(reminder24hTime).getTime() > now) {
    remindersToInsert.push({
      appointment_id: appointmentId,
      clinic_id: clinicId,
      patient_id: patientId,
      recipient_phone: patientPhone,
      reminder_type: '24h',
      scheduled_for: reminder24hTime,
      status: 'scheduled',
    });
  }

  if (new Date(reminder2hTime).getTime() > now) {
    remindersToInsert.push({
      appointment_id: appointmentId,
      clinic_id: clinicId,
      patient_id: patientId,
      recipient_phone: patientPhone,
      reminder_type: '2h',
      scheduled_for: reminder2hTime,
      status: 'scheduled',
    });
  }

  if (remindersToInsert.length === 0) return { scheduled: 0 };

  try {
    await supabase
      .from('whatsapp_reminders')
      .upsert(remindersToInsert, { onConflict: 'appointment_id,reminder_type' });

    return { scheduled: remindersToInsert.length };
  } catch (err: unknown) {
    console.error('Failed to schedule WhatsApp reminders:', err);
    return { scheduled: 0 };
  }
}

/**
 * Dispatches all pending reminders that are currently due.
 */
export async function dispatchDueWhatsAppReminders(): Promise<{ sentCount: number; failedCount: number }> {
  const supabase = createClient();
  const nowIso = new Date().toISOString();

  // Fetch pending reminders scheduled for <= now
  const { data: dueReminders } = await supabase
    .from('whatsapp_reminders')
    .select('id, appointment_id, clinic_id, recipient_phone, reminder_type, appointments(start_time, clinics(name), dentists(name), services(name))')
    .eq('status', 'scheduled')
    .lte('scheduled_for', nowIso)
    .limit(50);

  if (!dueReminders || dueReminders.length === 0) {
    return { sentCount: 0, failedCount: 0 };
  }

  let sentCount = 0;
  let failedCount = 0;
  const whatsapp = new WhatsAppClient();

  for (const r of dueReminders) {
    const rawAppt = r.appointments as unknown;
    const appt = (Array.isArray(rawAppt) ? rawAppt[0] : rawAppt) as Record<string, unknown> | null;
    const rawClinic = appt?.clinics as unknown;
    const clinic = (Array.isArray(rawClinic) ? rawClinic[0] : rawClinic) as Record<string, unknown> | null;

    const clinicName = (clinic?.name as string) || 'Dental Clinic';
    const dateFormatted = appt?.start_time ? new Date(appt.start_time as string).toLocaleString() : 'Scheduled Time';

    try {
      const components = buildAppointmentReminderTemplate({
        clinicName,
        datetime: dateFormatted,
      });

      const sendResult = await whatsapp.sendTemplateMessage(
        r.recipient_phone,
        'appointment_reminder',
        'en',
        components
      );

      await supabase
        .from('whatsapp_reminders')
        .update({
          status: 'sent',
          provider_message_id: sendResult.message_id,
          sent_at: new Date().toISOString(),
        })
        .eq('id', r.id);

      sentCount++;
    } catch (err: unknown) {
      console.error(`Failed to send WhatsApp reminder ${r.id}:`, err);
      await supabase
        .from('whatsapp_reminders')
        .update({
          status: 'failed',
          error_message: (err as Error)?.message || 'Delivery error',
        })
        .eq('id', r.id);

      failedCount++;
    }
  }

  return { sentCount, failedCount };
}

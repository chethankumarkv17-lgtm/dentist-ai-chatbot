import { z } from 'zod';
import { createClient } from '@/lib/supabase/server-auth';
import { getAvailableSlots as engineGetAvailableSlots } from '@/lib/booking/engine';
import { sendEmailNotification } from '@/lib/email/service';

// ==========================================
// TOOL SCHEMAS & DEFINITIONS
// ==========================================

export const GetClinicInformationSchema = z.object({
  clinicId: z.string().min(1, 'Clinic ID is required'),
});

export const GetServicesSchema = z.object({
  clinicId: z.string().min(1, 'Clinic ID is required'),
});

export const GetDentistsSchema = z.object({
  clinicId: z.string().min(1, 'Clinic ID is required'),
});

export const GetBusinessHoursSchema = z.object({
  clinicId: z.string().min(1, 'Clinic ID is required'),
});

export const GetAvailableSlotsSchema = z.object({
  clinicId: z.string().min(1, 'Clinic ID is required'),
  dentistId: z.string().min(1, 'Dentist ID is required'),
  serviceId: z.string().min(1, 'Service ID is required'),
  date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, 'Date must be in YYYY-MM-DD format'),
});

export const CreateAppointmentSchema = z.object({
  clinicId: z.string().min(1, 'Clinic ID is required'),
  patientName: z.string().min(1, 'Patient name is required'),
  patientPhone: z.string().min(5, 'Valid patient phone is required'),
  patientEmail: z.string().email('Valid patient email is required'),
  dentistId: z.string().min(1, 'Dentist ID is required'),
  serviceId: z.string().min(1, 'Service ID is required'),
  startTime: z.string().datetime('Start time must be ISO datetime'),
});

export const GetPatientAppointmentsSchema = z.object({
  clinicId: z.string().min(1, 'Clinic ID is required'),
  patientPhoneOrEmail: z.string().min(1, 'Patient phone or email is required'),
});

export const CancelAppointmentSchema = z.object({
  clinicId: z.string().min(1, 'Clinic ID is required'),
  appointmentId: z.string().min(1, 'Appointment ID is required'),
  patientPhoneOrEmail: z.string().min(1, 'Patient phone or email is required for verification'),
});

export const RescheduleAppointmentSchema = z.object({
  clinicId: z.string().min(1, 'Clinic ID is required'),
  appointmentId: z.string().min(1, 'Appointment ID is required'),
  newStartTime: z.string().datetime('New start time must be ISO datetime'),
  patientPhoneOrEmail: z.string().min(1, 'Patient phone or email is required for verification'),
});

export const RequestHumanHelpSchema = z.object({
  clinicId: z.string().min(1, 'Clinic ID is required'),
  reason: z.string().optional(),
  patientContact: z.string().optional(),
  conversationId: z.string().optional(),
});

export const GetClinicFaqsSchema = z.object({
  clinicId: z.string().min(1, 'Clinic ID is required'),
  query: z.string().optional(),
});

export interface ToolDefinition {
  name: string;
  description: string;
  schema: z.ZodType<unknown>;
}

export const CONTROLLED_TOOLS: Record<string, ToolDefinition> = {
  getClinicInformation: {
    name: 'getClinicInformation',
    description: 'Retrieve verified clinic profile details such as name, address, phone, email, and timezone.',
    schema: GetClinicInformationSchema as z.ZodType<unknown>,
  },
  getServices: {
    name: 'getServices',
    description: 'Retrieve the verified list of active dental services, durations, descriptions, and published prices.',
    schema: GetServicesSchema as z.ZodType<unknown>,
  },
  getDentists: {
    name: 'getDentists',
    description: 'Retrieve the list of active dentists, their specialties, and bio details.',
    schema: GetDentistsSchema as z.ZodType<unknown>,
  },
  getBusinessHours: {
    name: 'getBusinessHours',
    description: 'Retrieve official clinic opening and closing business hours for each day of the week.',
    schema: GetBusinessHoursSchema as z.ZodType<unknown>,
  },
  getClinicFaqs: {
    name: 'getClinicFaqs',
    description: 'Retrieve approved clinic frequently asked questions (FAQs) regarding insurance, parking, procedures, and policies.',
    schema: GetClinicFaqsSchema as z.ZodType<unknown>,
  },
  getAvailableSlots: {
    name: 'getAvailableSlots',
    description: 'Calculate real available appointment slots for a specific dentist, service, and date.',
    schema: GetAvailableSlotsSchema as z.ZodType<unknown>,
  },
  createAppointment: {
    name: 'createAppointment',
    description: 'Officially book an appointment on the backend. Only call this when patient details, date, time, dentist, and service are confirmed.',
    schema: CreateAppointmentSchema as z.ZodType<unknown>,
  },
  getPatientAppointments: {
    name: 'getPatientAppointments',
    description: 'Look up active and upcoming appointments for a patient using their phone number or email.',
    schema: GetPatientAppointmentsSchema as z.ZodType<unknown>,
  },
  cancelAppointment: {
    name: 'cancelAppointment',
    description: 'Cancel an existing appointment after verifying patient identity.',
    schema: CancelAppointmentSchema as z.ZodType<unknown>,
  },
  rescheduleAppointment: {
    name: 'rescheduleAppointment',
    description: 'Reschedule an existing appointment to a new validated time slot.',
    schema: RescheduleAppointmentSchema as z.ZodType<unknown>,
  },
  requestHumanHelp: {
    name: 'requestHumanHelp',
    description: 'Escalate conversation or request human front-desk staff assistance for complex, medical, or emergency questions.',
    schema: RequestHumanHelpSchema as z.ZodType<unknown>,
  },
};

// ==========================================
// CONTROLLED TOOL EXECUTORS (BACKEND ONLY)
// ==========================================

export async function executeTool(name: string, args: unknown): Promise<{ success: boolean; data?: unknown; error?: string }> {
  const toolDef = CONTROLLED_TOOLS[name];
  if (!toolDef) {
    return { success: false, error: `Unknown tool '${name}'. Available tools: ${Object.keys(CONTROLLED_TOOLS).join(', ')}` };
  }

  // Validate args with schema
  const parsed = toolDef.schema.safeParse(args);
  if (!parsed.success) {
    return {
      success: false,
      error: `Malformed parameters for tool '${name}': ${parsed.error.issues.map(i => `${i.path.join('.')}: ${i.message}`).join(', ')}`,
    };
  }

  const supabase = createClient();

  try {
    switch (name) {
      case 'getClinicInformation': {
        const { clinicId } = parsed.data as z.infer<typeof GetClinicInformationSchema>;
        const { data, error } = await supabase
          .from('clinics')
          .select('id, name, timezone, address, phone, email')
          .eq('id', clinicId)
          .single();

        if (error || !data) {
          return { success: false, error: 'Clinic information could not be found.' };
        }
        return { success: true, data };
      }

      case 'getServices': {
        const { clinicId } = parsed.data as z.infer<typeof GetServicesSchema>;
        const { data, error } = await supabase
          .from('services')
          .select('id, name, description, duration_minutes, buffer_time_minutes, price, is_active, is_bookable')
          .eq('clinic_id', clinicId)
          .eq('is_active', true)
          .eq('is_bookable', true);

        if (error || !data) {
          return { success: false, error: 'Failed to retrieve services.' };
        }
        return { success: true, data };
      }

      case 'getDentists': {
        const { clinicId } = parsed.data as z.infer<typeof GetDentistsSchema>;
        const { data, error } = await supabase
          .from('dentists')
          .select('id, name, specialty, bio, is_active')
          .eq('clinic_id', clinicId)
          .eq('is_active', true);

        if (error || !data) {
          return { success: false, error: 'Failed to retrieve dentists.' };
        }
        return { success: true, data };
      }

      case 'getBusinessHours': {
        const { clinicId } = parsed.data as z.infer<typeof GetBusinessHoursSchema>;
        const { data, error } = await supabase
          .from('business_hours')
          .select('day_of_week, open_time, close_time')
          .eq('clinic_id', clinicId)
          .order('day_of_week', { ascending: true });

        const { data: clinic } = await supabase
          .from('clinics')
          .select('timezone')
          .eq('id', clinicId)
          .single();

        if (error || !data) {
          return { success: false, error: 'Failed to retrieve business hours.' };
        }
        return {
          success: true,
          data: {
            timezone: clinic?.timezone || 'UTC',
            hours: data,
          },
        };
      }

      case 'getClinicFaqs': {
        const { clinicId, query } = parsed.data as z.infer<typeof GetClinicFaqsSchema>;
        const { data, error } = await supabase
          .from('clinic_faqs')
          .select('id, question, answer')
          .eq('clinic_id', clinicId)
          .order('created_at', { ascending: true });

        if (error || !data) {
          return { success: false, error: 'Failed to retrieve clinic FAQs.' };
        }

        if (query) {
          const lowerQ = query.toLowerCase();
          const filtered = data.filter(
            f => f.question.toLowerCase().includes(lowerQ) || f.answer.toLowerCase().includes(lowerQ)
          );
          return { success: true, data: { faqs: filtered.length > 0 ? filtered : data } };
        }

        return { success: true, data: { faqs: data } };
      }

      case 'getAvailableSlots': {
        const { clinicId, dentistId, serviceId, date } = parsed.data as z.infer<typeof GetAvailableSlotsSchema>;
        const slotResult = await engineGetAvailableSlots(clinicId, dentistId, serviceId, date);
        if (!slotResult.success) {
          return { success: false, error: slotResult.error || 'Failed to compute available slots.' };
        }
        return { success: true, data: { slots: slotResult.slots || [] } };
      }

      case 'createAppointment': {
        const {
          clinicId,
          patientName,
          patientPhone,
          patientEmail,
          dentistId,
          serviceId,
          startTime,
        } = parsed.data as z.infer<typeof CreateAppointmentSchema>;

        // 1. Verify Clinic & Organization
        const { data: clinic } = await supabase
          .from('clinics')
          .select('id, name, organization_id, email, phone, address')
          .eq('id', clinicId)
          .single();

        if (!clinic) {
          return { success: false, error: 'Invalid clinic specified.' };
        }

        // 2. Verify Service
        const { data: service } = await supabase
          .from('services')
          .select('id, name, duration_minutes, is_active, is_bookable')
          .eq('id', serviceId)
          .eq('clinic_id', clinicId)
          .single();

        if (!service || !service.is_active || !service.is_bookable) {
          return { success: false, error: 'Invalid or inactive service specified.' };
        }

        // 3. Verify Dentist
        const { data: dentist } = await supabase
          .from('dentists')
          .select('id, name, is_active')
          .eq('id', dentistId)
          .eq('clinic_id', clinicId)
          .single();

        if (!dentist || !dentist.is_active) {
          return { success: false, error: 'Invalid or inactive dentist specified.' };
        }

        // 4. Re-check slot availability on backend
        const targetDate = startTime.split('T')[0];
        const availResult = await engineGetAvailableSlots(clinicId, dentistId, serviceId, targetDate);
        if (!availResult.success || !availResult.slots) {
          return { success: false, error: availResult.error || 'Could not verify slot availability.' };
        }

        const matchingSlot = availResult.slots.find(s => s.start === startTime);
        if (!matchingSlot) {
          return {
            success: false,
            error: 'The requested appointment slot is no longer available. Please choose a different time.',
          };
        }

        // 5. Find or Create Patient Record
        const nameParts = patientName.trim().split(' ');
        const firstName = nameParts[0] || 'Patient';
        const lastName = nameParts.slice(1).join(' ') || 'Customer';

        let patientId: string | null = null;
        const { data: existingPatient } = await supabase
          .from('patients')
          .select('id')
          .eq('organization_id', clinic.organization_id)
          .eq('email', patientEmail)
          .maybeSingle();

        if (existingPatient) {
          patientId = existingPatient.id;
        } else {
          const { data: newPatient, error: pErr } = await supabase
            .from('patients')
            .insert({
              organization_id: clinic.organization_id,
              first_name: firstName,
              last_name: lastName,
              email: patientEmail,
              phone: patientPhone,
            })
            .select('id')
            .single();

          if (pErr || !newPatient) {
            return { success: false, error: 'Failed to record patient information.' };
          }
          patientId = newPatient.id;
        }

        // 6. Create appointment with conflict check
        const { data: appt, error: apptError } = await supabase
          .from('appointments')
          .insert({
            clinic_id: clinicId,
            patient_id: patientId,
            dentist_id: dentistId,
            service_id: serviceId,
            start_time: matchingSlot.start,
            end_time: matchingSlot.end,
            status: 'confirmed',
          })
          .select('id, start_time, end_time, status')
          .single();

        if (apptError) {
          if (apptError.message?.includes('duplicate') || apptError.message?.includes('overlapping')) {
            return { success: false, error: 'Double booking detected. This slot was just taken by another patient.' };
          }
          return { success: false, error: apptError.message || 'Failed to create appointment.' };
        }

        // Asynchronously dispatch Email Notifications (Confirmation + Clinic Alert)
        const templateData = {
          clinicName: clinic.name,
          patientName: `${firstName} ${lastName}`,
          dentistName: dentist.name,
          serviceName: service.name,
          startTimeFormatted: matchingSlot.start,
          endTimeFormatted: matchingSlot.end,
          confirmationId: appt?.id,
        };

        // Patient Confirmation Email
        sendEmailNotification({
          organizationId: clinic.organization_id,
          recipientEmail: patientEmail,
          type: 'appointment_confirmation',
          templateData,
        }).catch(() => {});

        // Clinic Staff Alert Email
        if (clinic.email) {
          sendEmailNotification({
            organizationId: clinic.organization_id,
            recipientEmail: clinic.email,
            type: 'clinic_booking_notification',
            templateData,
          }).catch(() => {});
        }

        return {
          success: true,
          data: {
            confirmationId: appt?.id || 'APPT-CONFIRMED',
            status: 'confirmed',
            clinicName: clinic.name,
            dentistName: dentist.name,
            serviceName: service.name,
            startTime: matchingSlot.start,
            endTime: matchingSlot.end,
            patientName: `${firstName} ${lastName}`,
          },
        };
      }

      case 'getPatientAppointments': {
        const { clinicId, patientPhoneOrEmail } = parsed.data as z.infer<typeof GetPatientAppointmentsSchema>;
        
        // Find patient first
        const isEmail = patientPhoneOrEmail.includes('@');
        const query = supabase.from('patients').select('id, first_name, last_name');
        const { data: patients } = isEmail
          ? await query.eq('email', patientPhoneOrEmail)
          : await query.eq('phone', patientPhoneOrEmail);

        if (!patients || patients.length === 0) {
          return { success: true, data: { appointments: [] } };
        }

        const patientIds = patients.map(p => p.id);
        const { data: appointments } = await supabase
          .from('appointments')
          .select('id, start_time, end_time, status, dentist_id, service_id')
          .eq('clinic_id', clinicId)
          .in('patient_id', patientIds)
          .neq('status', 'cancelled')
          .order('start_time', { ascending: true });

        return { success: true, data: { appointments: appointments || [] } };
      }

      case 'cancelAppointment': {
        const { clinicId, appointmentId, patientPhoneOrEmail } = parsed.data as z.infer<typeof CancelAppointmentSchema>;

        const { data: appt } = await supabase
          .from('appointments')
          .select('id, patient_id, clinic_id, status, start_time')
          .eq('id', appointmentId)
          .eq('clinic_id', clinicId)
          .single();

        if (!appt) {
          return { success: false, error: 'Appointment not found for this clinic.' };
        }

        // Verify patient ownership
        const { data: patient } = await supabase
          .from('patients')
          .select('id, email, phone, first_name, last_name')
          .eq('id', appt.patient_id)
          .single();

        const isOwner = patient && (
          patient.email?.toLowerCase() === patientPhoneOrEmail.toLowerCase() ||
          patient.phone === patientPhoneOrEmail
        );

        if (!isOwner) {
          return { success: false, error: 'Verification failed. Phone or email does not match appointment record.' };
        }

        const { error } = await supabase
          .from('appointments')
          .update({ status: 'cancelled' })
          .eq('id', appointmentId);

        if (error) {
          return { success: false, error: 'Failed to cancel appointment in database.' };
        }

        // Fetch clinic for email metadata
        const { data: clinic } = await supabase
          .from('clinics')
          .select('id, name, organization_id, phone, address')
          .eq('id', clinicId)
          .single();

        if (patient.email && clinic) {
          sendEmailNotification({
            organizationId: clinic.organization_id,
            recipientEmail: patient.email,
            type: 'appointment_cancellation',
            templateData: {
              clinicName: clinic.name,
              patientName: `${patient.first_name || 'Patient'} ${patient.last_name || ''}`.trim(),
              dentistName: 'Clinic Specialist',
              serviceName: 'Scheduled Dental Procedure',
              startTimeFormatted: appt.start_time || 'Scheduled Appointment',
              confirmationId: appointmentId,
            },
          }).catch(() => {});
        }

        return {
          success: true,
          data: {
            appointmentId,
            status: 'cancelled',
            message: 'Appointment has been successfully cancelled.',
          },
        };
      }

      case 'rescheduleAppointment': {
        const { clinicId, appointmentId, newStartTime, patientPhoneOrEmail } = parsed.data as z.infer<typeof RescheduleAppointmentSchema>;

        const { data: appt } = await supabase
          .from('appointments')
          .select('id, patient_id, dentist_id, service_id, clinic_id')
          .eq('id', appointmentId)
          .eq('clinic_id', clinicId)
          .single();

        if (!appt) {
          return { success: false, error: 'Appointment not found for this clinic.' };
        }

        // Verify patient ownership
        const { data: patient } = await supabase
          .from('patients')
          .select('id, email, phone, first_name, last_name')
          .eq('id', appt.patient_id)
          .single();

        const isOwner = patient && (
          patient.email?.toLowerCase() === patientPhoneOrEmail.toLowerCase() ||
          patient.phone === patientPhoneOrEmail
        );

        if (!isOwner) {
          return { success: false, error: 'Verification failed. Phone or email does not match appointment record.' };
        }

        // Verify new slot
        const targetDate = newStartTime.split('T')[0];
        const availResult = await engineGetAvailableSlots(clinicId, appt.dentist_id, appt.service_id, targetDate);
        if (!availResult.success || !availResult.slots) {
          return { success: false, error: availResult.error || 'Could not compute availability.' };
        }

        const slotMatches = availResult.slots.find(s => s.start === newStartTime);
        if (!slotMatches) {
          return { success: false, error: 'The requested new slot is not available.' };
        }

        const { error } = await supabase
          .from('appointments')
          .update({
            start_time: slotMatches.start,
            end_time: slotMatches.end,
            status: 'confirmed',
          })
          .eq('id', appointmentId);

        if (error) {
          return { success: false, error: 'Failed to update appointment in database.' };
        }

        // Fetch clinic for email metadata
        const { data: clinic } = await supabase
          .from('clinics')
          .select('id, name, organization_id, phone, address')
          .eq('id', clinicId)
          .single();

        if (patient.email && clinic) {
          sendEmailNotification({
            organizationId: clinic.organization_id,
            recipientEmail: patient.email,
            type: 'appointment_rescheduling',
            templateData: {
              clinicName: clinic.name,
              patientName: `${patient.first_name || 'Patient'} ${patient.last_name || ''}`.trim(),
              dentistName: 'Clinic Specialist',
              serviceName: 'Scheduled Dental Procedure',
              startTimeFormatted: slotMatches.start,
              endTimeFormatted: slotMatches.end,
              confirmationId: appointmentId,
            },
          }).catch(() => {});
        }

        return {
          success: true,
          data: {
            appointmentId,
            newStartTime: slotMatches.start,
            newEndTime: slotMatches.end,
            status: 'confirmed',
            message: 'Appointment has been successfully rescheduled.',
          },
        };
      }

      case 'requestHumanHelp': {
        const { clinicId, reason, patientContact, conversationId } = parsed.data as z.infer<typeof RequestHumanHelpSchema>;

        try {
          // In real system, write to staff notification queue / alert
          await supabase
            .from('notifications')
            .insert({
              clinic_id: clinicId,
              type: 'human_escalation',
              title: 'Patient Requested Human Assistance',
              message: reason || 'Patient requested assistance from clinic staff.',
              details: { patientContact, conversationId },
            });
        } catch {
          // Notifications queue is best-effort
        }

        return {
          success: true,
          data: {
            escalated: true,
            message: 'A front desk staff member has been notified and will assist you shortly.',
          },
        };
      }

      default:
        return { success: false, error: `Unhandled tool '${name}'.` };
    }
  } catch (err: unknown) {
    return {
      success: false,
      error: `Tool execution failed unexpectedly: ${(err as Error)?.message || 'Unknown error'}`,
    };
  }
}

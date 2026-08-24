import { createClient } from '@/lib/supabase/server-auth';

export interface CallerVerificationResult {
  verified: boolean;
  patientId?: string;
  patientName?: string;
  challengeRequired?: 'name' | 'phone' | 'none';
  message?: string;
}

/**
 * Verifies caller identity for sensitive voice operations (appointment cancellation, rescheduling, or lookup).
 */
export async function verifyCallerForSensitiveOperation(params: {
  organizationId: string;
  callerPhone: string;
  providedName?: string;
  intent: 'book' | 'cancel' | 'reschedule' | 'lookup' | 'info';
}): Promise<CallerVerificationResult> {
  const { organizationId, callerPhone, providedName, intent } = params;

  // Non-sensitive operations (new bookings, clinic info, business hours) do not require identity gating
  if (intent === 'book' || intent === 'info') {
    return { verified: true, challengeRequired: 'none' };
  }

  const supabase = createClient();

  // Find patient record by caller phone in this organization tenant
  const { data: patient } = await supabase
    .from('patients')
    .select('id, first_name, last_name, phone')
    .eq('organization_id', organizationId)
    .eq('phone', callerPhone)
    .maybeSingle();

  if (!patient) {
    return {
      verified: false,
      challengeRequired: 'phone',
      message: 'I could not find an existing appointment associated with this phone number. Would you like to schedule a new appointment or speak with our front desk staff?',
    };
  }

  // If caller provided their name, verify match
  if (providedName) {
    const cleanProvided = providedName.toLowerCase().trim();
    const cleanFirst = (patient.first_name || '').toLowerCase().trim();
    const cleanLast = (patient.last_name || '').toLowerCase().trim();

    const matchesName =
      cleanProvided.includes(cleanFirst) ||
      cleanProvided.includes(cleanLast) ||
      cleanFirst.includes(cleanProvided) ||
      cleanLast.includes(cleanProvided);

    if (matchesName) {
      return {
        verified: true,
        patientId: patient.id,
        patientName: `${patient.first_name} ${patient.last_name}`,
        challengeRequired: 'none',
      };
    }
  }

  // Challenge caller for name verification
  return {
    verified: false,
    patientId: patient.id,
    patientName: `${patient.first_name} ${patient.last_name}`,
    challengeRequired: 'name',
    message: 'For your security, could you please confirm the full name on the appointment before we make changes?',
  };
}

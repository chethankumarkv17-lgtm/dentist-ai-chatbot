import { createClient } from '@/lib/supabase/server-auth';
import { RetentionPolicy, ClinicExportData } from './types';
import { logAdminAuditAction } from '@/lib/admin/auth';

/**
 * Fetches organization retention policy settings.
 */
export async function getRetentionPolicy(organizationId: string): Promise<RetentionPolicy> {
  const supabase = createClient();

  try {
    const { data: org } = await supabase
      .from('organizations')
      .select('appointment_retention_days, transcript_retention_days, analytics_retention_days')
      .eq('id', organizationId)
      .single();

    return {
      appointmentDays: org?.appointment_retention_days || 365,
      transcriptDays: org?.transcript_retention_days || 90,
      analyticsDays: org?.analytics_retention_days || 180,
    };
  } catch {
    return {
      appointmentDays: 365,
      transcriptDays: 90,
      analyticsDays: 180,
    };
  }
}

/**
 * Updates organization data retention policy.
 */
export async function updateRetentionPolicy(
  organizationId: string,
  policy: Partial<RetentionPolicy>
): Promise<{ success: boolean; error?: string }> {
  if (!organizationId) return { success: false, error: 'Organization ID is required' };

  const supabase = createClient();

  try {
    await supabase
      .from('organizations')
      .update({
        appointment_retention_days: policy.appointmentDays ?? 365,
        transcript_retention_days: policy.transcriptDays ?? 90,
        analytics_retention_days: policy.analyticsDays ?? 180,
      })
      .eq('id', organizationId);

    return { success: true };
  } catch (err: unknown) {
    return { success: false, error: (err as Error)?.message || 'Failed to update retention policy' };
  }
}

/**
 * Exports all organization data into a machine-readable JSON structure.
 */
export async function exportOrganizationData(
  organizationId: string
): Promise<{ success: boolean; data?: ClinicExportData; error?: string }> {
  if (!organizationId) return { success: false, error: 'Organization ID is required' };

  const supabase = createClient();

  try {
    const [
      orgRes,
      clinicsRes,
      servicesRes,
      dentistsRes,
      apptsRes,
      convRes,
      ticketsRes,
    ] = await Promise.all([
      supabase.from('organizations').select('id, name, created_at, appointment_retention_days, transcript_retention_days, analytics_retention_days').eq('id', organizationId).single(),
      supabase.from('clinics').select('id, name, timezone, address, phone').eq('organization_id', organizationId),
      supabase.from('services').select('id, name, duration_minutes, price'),
      supabase.from('dentists').select('id, name, specialty'),
      supabase.from('appointments').select('id, service_id, dentist_id, start_time, end_time, status, created_at'),
      supabase.from('conversations').select('id', { count: 'exact', head: true }),
      supabase.from('support_tickets').select('id', { count: 'exact', head: true }).eq('organization_id', organizationId),
    ]);

    const org = orgRes.data;
    if (!org) return { success: false, error: 'Organization not found' };

    const exportData: ClinicExportData = {
      exportDate: new Date().toISOString(),
      organization: {
        id: org.id,
        name: org.name,
        createdAt: org.created_at,
        retentionPolicy: {
          appointmentDays: org.appointment_retention_days || 365,
          transcriptDays: org.transcript_retention_days || 90,
          analyticsDays: org.analytics_retention_days || 180,
        },
      },
      clinics: (clinicsRes.data || []).map((c) => ({
        id: c.id,
        name: c.name,
        timezone: c.timezone,
        address: c.address || undefined,
        phone: c.phone || undefined,
      })),
      services: (servicesRes.data || []).map((s) => ({
        id: s.id,
        name: s.name,
        durationMinutes: s.duration_minutes || 30,
        price: Number(s.price) || 0,
      })),
      dentists: (dentistsRes.data || []).map((d) => ({
        id: d.id,
        name: d.name,
        specialty: d.specialty || undefined,
      })),
      appointments: (apptsRes.data || []).map((a) => ({
        id: a.id,
        serviceId: a.service_id,
        dentistId: a.dentist_id,
        startTime: a.start_time,
        endTime: a.end_time,
        status: a.status,
        createdAt: a.created_at,
      })),
      conversationsCount: convRes.count || 0,
      supportTicketsCount: ticketsRes.count || 0,
    };

    return { success: true, data: exportData };
  } catch (err: unknown) {
    return { success: false, error: (err as Error)?.message || 'Failed to export data' };
  }
}

/**
 * Erases/anonymizes patient personal data from appointments and logs (Right to Erasure).
 */
export async function erasePatientData(
  organizationId: string,
  patientIdentifier: string,
  requestedByUserId?: string
): Promise<{ success: boolean; redactedRecordsCount: number; error?: string }> {
  if (!organizationId || !patientIdentifier.trim()) {
    return { success: false, redactedRecordsCount: 0, error: 'Patient identifier is required' };
  }

  const supabase = createClient();
  const cleanIdentifier = patientIdentifier.trim();

  try {
    // 1. Redact matching appointments (anonymize patient info)
    const { data: matchedAppts } = await supabase
      .from('appointments')
      .select('id, patient_email, patient_phone, patient_name')
      .or(`patient_email.eq.${cleanIdentifier},patient_phone.eq.${cleanIdentifier}`);

    const count = matchedAppts?.length || 0;

    if (count > 0) {
      await supabase
        .from('appointments')
        .update({
          patient_name: 'Anonymized Patient',
          patient_email: 'deleted@erased.patient',
          patient_phone: '+0000000000',
          medical_notes: null,
        })
        .or(`patient_email.eq.${cleanIdentifier},patient_phone.eq.${cleanIdentifier}`);
    }

    // 2. Record deletion request audit record
    await supabase.from('data_deletion_requests').insert({
      organization_id: organizationId,
      requested_by: requestedByUserId,
      request_type: 'patient_erasure',
      target_identifier: cleanIdentifier.slice(0, 3) + '***', // Redacted identifier in log
      status: 'completed',
      details: { redactedAppointmentsCount: count },
      completed_at: new Date().toISOString(),
    });

    return { success: true, redactedRecordsCount: count };
  } catch (err: unknown) {
    return { success: false, redactedRecordsCount: 0, error: (err as Error)?.message || 'Failed to erase patient data' };
  }
}

/**
 * Deletes user profile and memberships.
 */
export async function deleteUserAccount(
  userId: string
): Promise<{ success: boolean; error?: string }> {
  if (!userId) return { success: false, error: 'User ID is required' };

  const supabase = createClient();

  try {
    // 1. Remove organization memberships
    await supabase.from('organization_members').delete().eq('user_id', userId);

    // 2. Delete profile
    await supabase.from('profiles').delete().eq('id', userId);

    // 3. Record audit
    await supabase.from('data_deletion_requests').insert({
      requested_by: userId,
      request_type: 'account_deletion',
      target_identifier: userId,
      status: 'completed',
      completed_at: new Date().toISOString(),
    });

    return { success: true };
  } catch (err: unknown) {
    return { success: false, error: (err as Error)?.message || 'Failed to delete user account' };
  }
}

/**
 * Full teardown of an organization and child data.
 */
export async function deleteOrganization(
  organizationId: string,
  requestedByUserId: string
): Promise<{ success: boolean; error?: string }> {
  if (!organizationId) return { success: false, error: 'Organization ID is required' };

  const supabase = createClient();

  try {
    // 1. Cascade delete all child entities (via DB cascade or explicit deletes)
    await Promise.all([
      supabase.from('appointments').delete().eq('organization_id', organizationId),
      supabase.from('dentists').delete().eq('organization_id', organizationId),
      supabase.from('services').delete().eq('organization_id', organizationId),
      supabase.from('support_tickets').delete().eq('organization_id', organizationId),
      supabase.from('analytics_events').delete().eq('organization_id', organizationId),
      supabase.from('subscriptions').delete().eq('organization_id', organizationId),
    ]);

    // 2. Delete organization record
    await supabase.from('organizations').delete().eq('id', organizationId);

    // 3. Log audit event
    await logAdminAuditAction({
      userId: requestedByUserId,
      action: 'organization.hard_delete',
      entity: 'organization',
      entityId: organizationId,
    });

    return { success: true };
  } catch (err: unknown) {
    return { success: false, error: (err as Error)?.message || 'Failed to delete organization' };
  }
}

/**
 * Enforces configured data retention policy by purging expired records.
 */
export async function enforceRetentionPurge(
  organizationId: string
): Promise<{ purgedAppointments: number; purgedTranscripts: number }> {
  const supabase = createClient();
  const policy = await getRetentionPolicy(organizationId);

  const apptCutoff = new Date(Date.now() - policy.appointmentDays * 86400 * 1000).toISOString();
  const transcriptCutoff = new Date(Date.now() - policy.transcriptDays * 86400 * 1000).toISOString();

  let purgedAppointments = 0;
  let purgedTranscripts = 0;

  try {
    // Delete expired appointments
    const { data: expiredAppts } = await supabase
      .from('appointments')
      .delete()
      .lt('created_at', apptCutoff)
      .select('id');

    purgedAppointments = expiredAppts?.length || 0;

    // Delete expired conversation transcripts
    const { data: expiredConv } = await supabase
      .from('conversations')
      .delete()
      .lt('created_at', transcriptCutoff)
      .select('id');

    purgedTranscripts = expiredConv?.length || 0;
  } catch {
    // Fallback
  }

  return { purgedAppointments, purgedTranscripts };
}

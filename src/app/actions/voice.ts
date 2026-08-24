'use server';

import { createClient } from '@/lib/supabase/server-auth';
import { assertFeatureEntitlement } from '@/lib/billing/entitlements';
import { revalidatePath } from 'next/cache';

export async function updateVoiceConfigAction(params: {
  clinicId: string;
  organizationId: string;
  agentName?: string;
  greeting?: string;
  voicePersona?: string;
  language?: string;
  humanTransferPhone?: string;
  maxDurationSeconds?: number;
}) {
  const { clinicId, organizationId, ...updates } = params;

  if (!clinicId || !organizationId) {
    return { success: false, error: 'Clinic ID and Organization ID are required' };
  }

  // 1. Authoritative Server-Side Entitlement Check
  try {
    await assertFeatureEntitlement(organizationId, 'voiceAgent');
  } catch (err: unknown) {
    return { success: false, error: (err as Error)?.message || 'Voice feature requires a Pro Plan upgrade' };
  }

  const supabase = createClient();

  try {
    const { error } = await supabase
      .from('voice_connections')
      .upsert({
        clinic_id: clinicId,
        ...updates,
        status: 'connected',
        updated_at: new Date().toISOString(),
      }, { onConflict: 'clinic_id' });

    if (error) throw error;

    revalidatePath('/dashboard/voice');
    return { success: true };
  } catch (err: unknown) {
    return { success: false, error: (err as Error)?.message || 'Failed to update voice configuration' };
  }
}

export async function assignVoicePhoneNumberAction(params: {
  clinicId: string;
  organizationId: string;
  phoneNumber: string;
}) {
  const { clinicId, organizationId, phoneNumber } = params;

  try {
    await assertFeatureEntitlement(organizationId, 'voiceAgent');
  } catch (err: unknown) {
    return { success: false, error: (err as Error)?.message || 'Voice feature requires a Pro Plan upgrade' };
  }

  const supabase = createClient();

  try {
    const { error } = await supabase
      .from('voice_connections')
      .upsert({
        clinic_id: clinicId,
        phone_number: phoneNumber,
        status: 'connected',
        updated_at: new Date().toISOString(),
      }, { onConflict: 'clinic_id' });

    if (error) throw error;

    revalidatePath('/dashboard/voice');
    return { success: true };
  } catch (err: unknown) {
    return { success: false, error: (err as Error)?.message || 'Failed to assign phone number' };
  }
}

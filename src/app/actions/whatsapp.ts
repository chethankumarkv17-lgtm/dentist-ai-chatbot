'use server';

import { createClient } from '@/lib/supabase/server-auth';
import { revalidatePath } from 'next/cache';

export async function connectWhatsAppAction(params: {
  clinicId: string;
  phoneNumberId: string;
  wabaId?: string;
  displayPhone?: string;
}) {
  const { clinicId, phoneNumberId, wabaId, displayPhone } = params;
  if (!clinicId || !phoneNumberId) {
    return { success: false, error: 'Clinic ID and Phone Number ID are required' };
  }

  const supabase = createClient();

  try {
    const { error } = await supabase
      .from('whatsapp_connections')
      .upsert({
        clinic_id: clinicId,
        phone_number_id: phoneNumberId,
        waba_id: wabaId,
        display_phone: displayPhone,
        status: 'connected',
        updated_at: new Date().toISOString(),
      }, { onConflict: 'clinic_id' });

    if (error) throw error;

    revalidatePath('/dashboard/whatsapp');
    return { success: true };
  } catch (err: unknown) {
    return { success: false, error: (err as Error)?.message || 'Failed to connect WhatsApp' };
  }
}

export async function disconnectWhatsAppAction(clinicId: string) {
  if (!clinicId) return { success: false, error: 'Clinic ID is required' };

  const supabase = createClient();

  try {
    const { error } = await supabase
      .from('whatsapp_connections')
      .update({
        status: 'disconnected',
        updated_at: new Date().toISOString(),
      })
      .eq('clinic_id', clinicId);

    if (error) throw error;

    revalidatePath('/dashboard/whatsapp');
    return { success: true };
  } catch (err: unknown) {
    return { success: false, error: (err as Error)?.message || 'Failed to disconnect WhatsApp' };
  }
}

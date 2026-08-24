'use server';

import { createClient } from '@supabase/supabase-js';
import { getAvailableSlots } from '@/lib/booking/engine';

// Use service role for public, unauthenticated inserts
const getAdminClient = () => {
  return createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  );
};

export async function getPublicAvailability(clinicSlug: string, serviceId: string, dentistId: string, targetDateStr: string) {
  const supabase = getAdminClient();
  
  const { data: clinic } = await supabase.from('clinic_websites').select('clinic_id').eq('slug', clinicSlug).single();
  if (!clinic) return { success: false, error: 'Clinic not found' };

  return getAvailableSlots(clinic.clinic_id, dentistId, serviceId, targetDateStr);
}

export async function submitPublicBooking(
  clinicSlug: string,
  serviceId: string,
  dentistId: string,
  startTimeIso: string,
  patientInfo: { firstName: string, lastName: string, email: string, phone: string }
) {
  const supabase = getAdminClient();

  const { data: website } = await supabase.from('clinic_websites').select('clinic_id').eq('slug', clinicSlug).single();
  if (!website) return { success: false, error: 'Clinic not found' };
  
  const clinicId = website.clinic_id;

  const { data: clinic } = await supabase.from('clinics').select('organization_id').eq('id', clinicId).single();
  if (!clinic) return { success: false, error: 'Clinic details not found' };
  
  const targetDateStr = startTimeIso.split('T')[0];
  const availability = await getAvailableSlots(clinicId, dentistId, serviceId, targetDateStr);
  
  if (!availability.success) {
    return { success: false, error: availability.error };
  }

  const slotMatches = availability.slots?.find(s => s.start === startTimeIso);
  if (!slotMatches) {
    return { success: false, error: 'Slot is no longer available. Please select another time.' };
  }

  // Find or create patient
  let patientId = null;
  const { data: existingPatient } = await supabase.from('patients')
    .select('id')
    .eq('organization_id', clinic.organization_id)
    .eq('email', patientInfo.email)
    .maybeSingle();
    
  if (existingPatient) {
    patientId = existingPatient.id;
  } else {
    const { data: newPatient, error: pErr } = await supabase.from('patients').insert({
      organization_id: clinic.organization_id,
      first_name: patientInfo.firstName,
      last_name: patientInfo.lastName,
      email: patientInfo.email,
      phone: patientInfo.phone,
    }).select('id').single();
    
    if (pErr) return { success: false, error: pErr.message };
    patientId = newPatient.id;
  }

  const { error } = await supabase.from('appointments').insert({
    clinic_id: clinicId,
    patient_id: patientId,
    dentist_id: dentistId,
    service_id: serviceId,
    start_time: slotMatches.start,
    end_time: slotMatches.end,
    status: 'pending'
  });

  if (error) {
    if (error.message?.includes('duplicate key') || error.message?.includes('overlapping') || error.message?.includes('constraint')) {
      return { success: false, error: 'Slot is no longer available. Please select another time.' };
    }
    return { success: false, error: error.message };
  }

  return { success: true };
}

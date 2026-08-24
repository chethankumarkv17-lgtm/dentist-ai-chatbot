'use server';

import { createClient } from '@/lib/supabase/server-auth';
import {
  connectDentistCalendar,
  disconnectDentistCalendar,
  getCalendarProvider,
} from '@/lib/calendar/manager';
import { CalendarProviderType } from '@/lib/calendar/types';
import { revalidatePath } from 'next/cache';

export async function getDentistCalendarConnection(dentistId: string) {
  if (!dentistId) return { success: false, error: 'Dentist ID is required' };

  const supabase = createClient();
  const { data, error } = await supabase
    .from('calendar_connections')
    .select('id, dentist_id, provider, status, email, expires_at, created_at')
    .eq('dentist_id', dentistId)
    .single();

  if (error && error.message !== 'Not found' && !error.message.includes('0 rows')) {
    return { success: false, error: error.message };
  }

  return { success: true, data: data || null };
}

export async function generateCalendarAuthUrl(dentistId: string, providerType: CalendarProviderType = 'google') {
  if (!dentistId) return { success: false, error: 'Dentist ID is required' };

  try {
    const provider = getCalendarProvider(providerType);
    const authUrl = provider.getAuthorizationUrl(dentistId);
    return { success: true, authUrl };
  } catch (err: unknown) {
    return { success: false, error: (err as Error)?.message || 'Failed to generate authorization URL' };
  }
}

export async function connectCalendar(
  dentistId: string,
  providerType: CalendarProviderType,
  authCode: string
) {
  const res = await connectDentistCalendar(dentistId, providerType, authCode);
  if (res.success) {
    revalidatePath('/dashboard/calendar');
    revalidatePath('/dashboard/dentists');
  }
  return res;
}

export async function disconnectCalendar(dentistId: string) {
  const res = await disconnectDentistCalendar(dentistId);
  if (res.success) {
    revalidatePath('/dashboard/calendar');
    revalidatePath('/dashboard/dentists');
  }
  return res;
}

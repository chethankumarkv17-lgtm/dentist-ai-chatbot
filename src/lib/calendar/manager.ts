import { createClient } from '@/lib/supabase/server-auth';
import {
  CalendarProviderType,
  CalendarProvider,
  CalendarConnectionRecord,
  BusyTimeSlot,
} from './types';
import { GoogleCalendarProvider } from './google';
import { MicrosoftOutlookCalendarProvider } from './outlook';

const googleProvider = new GoogleCalendarProvider();
const outlookProvider = new MicrosoftOutlookCalendarProvider();

export function getCalendarProvider(provider: CalendarProviderType): CalendarProvider {
  switch (provider) {
    case 'google':
      return googleProvider;
    case 'outlook':
      return outlookProvider;
    default:
      throw new Error(`Unsupported calendar provider: ${provider}`);
  }
}

/**
 * Connects a dentist to an external calendar using OAuth code exchange
 */
export async function connectDentistCalendar(
  dentistId: string,
  providerType: CalendarProviderType,
  authCode: string,
  redirectUri?: string
): Promise<{ success: boolean; connection?: CalendarConnectionRecord; error?: string }> {
  if (!dentistId || !authCode) {
    return { success: false, error: 'Dentist ID and authorization code are required' };
  }

  const provider = getCalendarProvider(providerType);

  try {
    const tokens = await provider.exchangeCodeForTokens(authCode, redirectUri);

    const supabase = createClient();
    const payload = {
      dentist_id: dentistId,
      provider: providerType,
      access_token: tokens.accessToken,
      refresh_token: tokens.refreshToken || null,
      expires_at: tokens.expiresAt || null,
      email: tokens.email || null,
      status: 'connected',
      updated_at: new Date().toISOString(),
    };

    const { data, error } = await supabase
      .from('calendar_connections')
      .upsert(payload)
      .select('id, dentist_id, provider, status, email, expires_at')
      .single();

    if (error) {
      return { success: false, error: error.message };
    }

    return { success: true, data } as unknown as { success: boolean; connection?: CalendarConnectionRecord; error?: string };
  } catch (err: unknown) {
    return { success: false, error: (err as Error)?.message || 'Failed to connect calendar' };
  }
}

/**
 * Disconnects an external calendar and revokes tokens
 */
export async function disconnectDentistCalendar(
  dentistId: string
): Promise<{ success: boolean; error?: string }> {
  if (!dentistId) return { success: false, error: 'Dentist ID is required' };

  const supabase = createClient();

  try {
    const { data: connection } = await supabase
      .from('calendar_connections')
      .select('id, provider, access_token')
      .eq('dentist_id', dentistId)
      .single();

    if (connection) {
      if (connection.access_token) {
        const provider = getCalendarProvider(connection.provider as CalendarProviderType);
        await provider.revokeToken(connection.access_token).catch(() => {});
      }

      await supabase
        .from('calendar_connections')
        .update({
          access_token: null,
          refresh_token: null,
          status: 'disconnected',
          updated_at: new Date().toISOString(),
        })
        .eq('dentist_id', dentistId);
    }

    return { success: true };
  } catch (err: unknown) {
    return { success: false, error: (err as Error)?.message || 'Failed to disconnect calendar' };
  }
}

/**
 * Validates and retrieves a fresh access token, performing automatic token refresh if needed
 */
export async function getValidAccessToken(
  dentistId: string
): Promise<{ accessToken: string | null; error?: string; status: string }> {
  const supabase = createClient();

  const { data: connection } = await supabase
    .from('calendar_connections')
    .select('id, dentist_id, provider, access_token, refresh_token, expires_at, status')
    .eq('dentist_id', dentistId)
    .single();

  if (!connection || connection.status !== 'connected' || !connection.access_token) {
    return { accessToken: null, status: connection?.status || 'disconnected' };
  }

  // Check if token is expired or within 5-minute buffer
  const expiresAtMs = connection.expires_at ? new Date(connection.expires_at).getTime() : 0;
  const nowMs = Date.now();
  const isExpiredOrClose = !expiresAtMs || expiresAtMs - nowMs < 5 * 60 * 1000;

  if (!isExpiredOrClose) {
    return { accessToken: connection.access_token, status: 'connected' };
  }

  // Attempt automatic refresh
  if (!connection.refresh_token) {
    await supabase
      .from('calendar_connections')
      .update({ status: 'revoked', updated_at: new Date().toISOString() })
      .eq('id', connection.id);

    return { accessToken: null, status: 'revoked', error: 'No refresh token available' };
  }

  try {
    const provider = getCalendarProvider(connection.provider as CalendarProviderType);
    const refreshed = await provider.refreshAccessToken(connection.refresh_token);

    await supabase
      .from('calendar_connections')
      .update({
        access_token: refreshed.accessToken,
        refresh_token: refreshed.refreshToken || connection.refresh_token,
        expires_at: refreshed.expiresAt,
        status: 'connected',
        updated_at: new Date().toISOString(),
      })
      .eq('id', connection.id);

    return { accessToken: refreshed.accessToken, status: 'connected' };
  } catch {
    await supabase
      .from('calendar_connections')
      .update({ status: 'revoked', updated_at: new Date().toISOString() })
      .eq('id', connection.id);

    return { accessToken: null, status: 'revoked', error: 'Token refresh failed or permission revoked' };
  }
}

/**
 * Retrieves external calendar busy times for availability calculation
 */
export async function getDentistExternalBusyTimes(
  dentistId: string,
  timeMin: string,
  timeMax: string,
  timeZone: string
): Promise<BusyTimeSlot[]> {
  if (!dentistId) return [];

  const { accessToken, status } = await getValidAccessToken(dentistId);
  if (!accessToken || status !== 'connected') {
    return [];
  }

  const supabase = createClient();
  const { data: connection } = await supabase
    .from('calendar_connections')
    .select('provider, calendar_id')
    .eq('dentist_id', dentistId)
    .single();

  if (!connection) return [];

  try {
    const provider = getCalendarProvider(connection.provider as CalendarProviderType);
    return await provider.fetchBusyTimes(
      accessToken,
      connection.calendar_id || 'primary',
      timeMin,
      timeMax,
      timeZone
    );
  } catch {
    return [];
  }
}

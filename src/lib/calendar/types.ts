export type CalendarProviderType = 'google' | 'outlook';

export type CalendarConnectionStatus = 'connected' | 'disconnected' | 'revoked' | 'error';

export interface CalendarEvent {
  id: string;
  title: string;
  start: string; // ISO 8601
  end: string;   // ISO 8601
  isAllDay?: boolean;
}

export interface BusyTimeSlot {
  start: string; // ISO 8601
  end: string;   // ISO 8601
}

export interface CalendarAuthTokens {
  accessToken: string;
  refreshToken?: string;
  expiresAt?: string; // ISO 8601
  tokenType?: string;
  email?: string;
}

export interface CalendarConnectionRecord {
  id: string;
  dentist_id: string;
  provider: CalendarProviderType;
  access_token: string | null;
  refresh_token: string | null;
  sync_token?: string | null;
  status: CalendarConnectionStatus;
  expires_at?: string | null;
  calendar_id?: string | null;
  email?: string | null;
  created_at?: string;
  updated_at?: string;
}

export interface CalendarProvider {
  type: CalendarProviderType;
  getAuthorizationUrl(dentistId: string, state?: string): string;
  exchangeCodeForTokens(code: string, redirectUri?: string): Promise<CalendarAuthTokens>;
  refreshAccessToken(refreshToken: string): Promise<CalendarAuthTokens>;
  revokeToken(accessToken: string): Promise<boolean>;
  fetchBusyTimes(
    accessToken: string,
    calendarId: string,
    timeMin: string,
    timeMax: string,
    timeZone: string
  ): Promise<BusyTimeSlot[]>;
}

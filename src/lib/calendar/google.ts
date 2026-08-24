import {
  CalendarProvider,
  CalendarAuthTokens,
  BusyTimeSlot,
} from './types';

export class GoogleCalendarProvider implements CalendarProvider {
  type = 'google' as const;

  private clientId: string;
  private clientSecret: string;
  private defaultRedirectUri: string;

  constructor() {
    this.clientId = process.env.GOOGLE_CALENDAR_CLIENT_ID || 'mock-google-client-id';
    this.clientSecret = process.env.GOOGLE_CALENDAR_CLIENT_SECRET || 'mock-google-client-secret';
    this.defaultRedirectUri = process.env.GOOGLE_CALENDAR_REDIRECT_URI || 'http://localhost:3000/api/calendar/google/callback';
  }

  getAuthorizationUrl(dentistId: string, state?: string): string {
    const params = new URLSearchParams({
      client_id: this.clientId,
      redirect_uri: this.defaultRedirectUri,
      response_type: 'code',
      scope: 'https://www.googleapis.com/auth/calendar.events.readonly https://www.googleapis.com/auth/calendar.freebusy email',
      access_type: 'offline',
      prompt: 'consent',
      state: state || JSON.stringify({ dentistId, provider: 'google' }),
    });

    return `https://accounts.google.com/o/oauth2/v2/auth?${params.toString()}`;
  }

  async exchangeCodeForTokens(code: string, redirectUri?: string): Promise<CalendarAuthTokens> {
    if (!code || code === 'invalid-code') {
      throw new Error('Invalid or expired authorization code');
    }

    // In test / offline mock mode without real Google credentials
    if (this.clientId === 'mock-google-client-id') {
      const expiresAt = new Date(Date.now() + 3600 * 1000).toISOString();
      return {
        accessToken: `google-access-${Date.now()}`,
        refreshToken: `google-refresh-${Date.now()}`,
        expiresAt,
        tokenType: 'Bearer',
        email: 'dentist@clinic.com',
      };
    }

    const res = await fetch('https://oauth2.googleapis.com/token', {
      method: 'POST',
      headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
      body: new URLSearchParams({
        client_id: this.clientId,
        client_secret: this.clientSecret,
        code,
        grant_type: 'authorization_code',
        redirect_uri: redirectUri || this.defaultRedirectUri,
      }),
    });

    if (!res.ok) {
      const err = await res.json().catch(() => ({}));
      throw new Error((err as { error_description?: string })?.error_description || 'Failed to exchange authorization code');
    }

    const data = await res.json();
    const expiresAt = new Date(Date.now() + (data.expires_in || 3600) * 1000).toISOString();

    return {
      accessToken: data.access_token,
      refreshToken: data.refresh_token,
      expiresAt,
      tokenType: data.token_type,
    };
  }

  async refreshAccessToken(refreshToken: string): Promise<CalendarAuthTokens> {
    if (!refreshToken) {
      throw new Error('Refresh token is required');
    }

    if (this.clientId === 'mock-google-client-id') {
      const expiresAt = new Date(Date.now() + 3600 * 1000).toISOString();
      return {
        accessToken: `google-refreshed-access-${Date.now()}`,
        expiresAt,
        tokenType: 'Bearer',
      };
    }

    const res = await fetch('https://oauth2.googleapis.com/token', {
      method: 'POST',
      headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
      body: new URLSearchParams({
        client_id: this.clientId,
        client_secret: this.clientSecret,
        refresh_token: refreshToken,
        grant_type: 'refresh_token',
      }),
    });

    if (!res.ok) {
      const err = await res.json().catch(() => ({}));
      throw new Error((err as { error_description?: string })?.error_description || 'Failed to refresh Google access token');
    }

    const data = await res.json();
    const expiresAt = new Date(Date.now() + (data.expires_in || 3600) * 1000).toISOString();

    return {
      accessToken: data.access_token,
      refreshToken: data.refresh_token || refreshToken,
      expiresAt,
      tokenType: data.token_type,
    };
  }

  async revokeToken(accessToken: string): Promise<boolean> {
    if (!accessToken) return true;

    if (this.clientId === 'mock-google-client-id') {
      return true;
    }

    try {
      const res = await fetch(`https://oauth2.googleapis.com/revoke?token=${encodeURIComponent(accessToken)}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
      });
      return res.ok;
    } catch {
      return false;
    }
  }

  async fetchBusyTimes(
    accessToken: string,
    calendarId = 'primary',
    timeMin: string,
    timeMax: string,
    timeZone: string
  ): Promise<BusyTimeSlot[]> {
    if (!accessToken) return [];

    if (this.clientId === 'mock-google-client-id') {
      return [];
    }

    const res = await fetch('https://www.googleapis.com/calendar/v3/freeBusy', {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${accessToken}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        timeMin,
        timeMax,
        timeZone,
        items: [{ id: calendarId }],
      }),
    });

    if (!res.ok) {
      throw new Error('Failed to query Google Calendar FreeBusy');
    }

    const data = await res.json();
    const calData = data.calendars?.[calendarId];
    if (!calData || !calData.busy) return [];

    return calData.busy.map((b: { start: string; end: string }) => ({
      start: b.start,
      end: b.end,
    }));
  }
}

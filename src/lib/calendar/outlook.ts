import {
  CalendarProvider,
  CalendarAuthTokens,
  BusyTimeSlot,
} from './types';

export class MicrosoftOutlookCalendarProvider implements CalendarProvider {
  type = 'outlook' as const;

  private clientId: string;
  private clientSecret: string;
  private defaultRedirectUri: string;

  constructor() {
    this.clientId = process.env.MICROSOFT_GRAPH_CLIENT_ID || 'mock-outlook-client-id';
    this.clientSecret = process.env.MICROSOFT_GRAPH_CLIENT_SECRET || 'mock-outlook-client-secret';
    this.defaultRedirectUri = process.env.MICROSOFT_GRAPH_REDIRECT_URI || 'http://localhost:3000/api/calendar/outlook/callback';
  }

  getAuthorizationUrl(dentistId: string, state?: string): string {
    const params = new URLSearchParams({
      client_id: this.clientId,
      response_type: 'code',
      redirect_uri: this.defaultRedirectUri,
      response_mode: 'query',
      scope: 'offline_access Calendars.Read Calendars.Read.Shared User.Read',
      state: state || JSON.stringify({ dentistId, provider: 'outlook' }),
    });

    return `https://login.microsoftonline.com/common/oauth2/v2.0/authorize?${params.toString()}`;
  }

  async exchangeCodeForTokens(code: string, redirectUri?: string): Promise<CalendarAuthTokens> {
    if (!code || code === 'invalid-code') {
      throw new Error('Invalid or expired Outlook authorization code');
    }

    if (this.clientId === 'mock-outlook-client-id') {
      const expiresAt = new Date(Date.now() + 3600 * 1000).toISOString();
      return {
        accessToken: `outlook-access-${Date.now()}`,
        refreshToken: `outlook-refresh-${Date.now()}`,
        expiresAt,
        tokenType: 'Bearer',
        email: 'dentist@outlook.com',
      };
    }

    const res = await fetch('https://login.microsoftonline.com/common/oauth2/v2.0/token', {
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
      throw new Error('Failed to exchange Outlook authorization code');
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

    if (this.clientId === 'mock-outlook-client-id') {
      const expiresAt = new Date(Date.now() + 3600 * 1000).toISOString();
      return {
        accessToken: `outlook-refreshed-access-${Date.now()}`,
        expiresAt,
        tokenType: 'Bearer',
      };
    }

    const res = await fetch('https://login.microsoftonline.com/common/oauth2/v2.0/token', {
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
      throw new Error('Failed to refresh Microsoft Outlook access token');
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

  async revokeToken(_accessToken: string): Promise<boolean> {
    // Microsoft Graph tokens expire naturally or are invalidated via user portal
    return true;
  }

  async fetchBusyTimes(
    _accessToken: string,
    _calendarId: string,
    _timeMin: string,
    _timeMax: string,
    _timeZone: string
  ): Promise<BusyTimeSlot[]> {
    // Microsoft Graph getSchedule API stub
    return [];
  }
}

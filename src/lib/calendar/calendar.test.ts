import { describe, it, expect, vi, beforeEach } from 'vitest';
import {
  connectDentistCalendar,
  disconnectDentistCalendar,
  getValidAccessToken,
  getCalendarProvider,
} from './manager';
import { getAvailableSlots } from '@/lib/booking/engine';
import { generateCalendarAuthUrl } from '@/app/actions/calendar';

// --- IN-MEMORY DATABASE MOCK ---
interface MockDb {
  clinics: { id: string; name: string; timezone: string }[];
  services: { id: string; clinic_id: string; name: string; duration_minutes: number; buffer_time_minutes: number; is_active: boolean; is_bookable: boolean }[];
  dentists: { id: string; clinic_id: string; name: string; is_active: boolean }[];
  business_hours: { clinic_id: string; day_of_week: number; open_time: string; close_time: string }[];
  holidays: { clinic_id: string; holiday_date: string }[];
  blocked_times: { dentist_id: string; start_timestamp: string; end_timestamp: string }[];
  appointments: { id: string; clinic_id: string; dentist_id: string; service_id: string; start_time: string; end_time: string; status: string }[];
  calendar_connections: {
    id: string;
    dentist_id: string;
    provider: string;
    access_token: string | null;
    refresh_token: string | null;
    status: string;
    expires_at: string | null;
    calendar_id: string | null;
    email: string | null;
  }[];
  [key: string]: unknown[];
}

const mockDbState: MockDb = {
  clinics: [
    { id: 'clinic-1', name: 'Downtown Dental', timezone: 'America/New_York' },
  ],
  services: [
    { id: 's1', clinic_id: 'clinic-1', name: 'General Checkup', duration_minutes: 30, buffer_time_minutes: 0, is_active: true, is_bookable: true },
  ],
  dentists: [
    { id: 'd1', clinic_id: 'clinic-1', name: 'Dr. Sarah Connor', is_active: true },
  ],
  business_hours: [
    { clinic_id: 'clinic-1', day_of_week: 1, open_time: '09:00', close_time: '12:00' }, // 9am to 12pm on Monday
  ],
  holidays: [],
  blocked_times: [],
  appointments: [],
  calendar_connections: [],
};

const createMockSupabase = () => {
  const chain = (table: string) => {
    let result: Record<string, unknown>[] = (mockDbState[table] as Record<string, unknown>[]) || [];

    const obj = {
      select: vi.fn(() => obj),
      eq: vi.fn((field: string, val: unknown) => {
        result = result.filter(r => r[field] === val);
        return obj;
      }),
      neq: vi.fn((field: string, val: unknown) => {
        result = result.filter(r => r[field] !== val);
        return obj;
      }),
      order: vi.fn(() => obj),
      single: vi.fn(() => ({ data: result[0] || null, error: result[0] ? null : { message: 'Not found' } })),
      maybeSingle: vi.fn(() => ({ data: result[0] || null, error: null })),
      upsert: vi.fn((payload: Record<string, unknown>) => {
        const tableArr = (mockDbState[table] as Record<string, unknown>[]) || [];
        const existingIdx = tableArr.findIndex(
          (r: Record<string, unknown>) => r.dentist_id === payload.dentist_id
        );
        const item = { id: `cal-${Date.now()}`, ...payload };
        if (existingIdx >= 0) {
          tableArr[existingIdx] = { ...(tableArr[existingIdx] as Record<string, unknown>), ...item };
        } else {
          tableArr.push(item);
        }
        mockDbState[table] = tableArr;
        return {
          data: item,
          error: null,
          select: vi.fn(() => ({
            single: vi.fn(() => ({ data: item, error: null })),
          })),
        };
      }),
      update: vi.fn((payload: Record<string, unknown>) => {
        return {
          eq: vi.fn((field: string, val: unknown) => {
            const tableArr = (mockDbState[table] as Record<string, unknown>[]) || [];
            mockDbState[table] = tableArr.map((r) =>
              r[field] === val ? { ...r, ...payload } : r
            );
            return { data: null, error: null };
          }),
        };
      }),
      then: (resolve: (val: { data: Record<string, unknown>[] }) => void) => resolve({ data: result }),
    };

    return obj;
  };

  return {
    from: vi.fn((table: string) => chain(table)),
    auth: {
      getUser: vi.fn().mockResolvedValue({ data: { user: { id: 'u1' } } }),
    },
  };
};

vi.mock('@/lib/supabase/server-auth', () => ({
  createClient: vi.fn(() => createMockSupabase()),
}));

vi.mock('next/cache', () => ({
  revalidatePath: vi.fn(),
}));

describe('Phase 20 — Calendar Integrations', () => {
  beforeEach(() => {
    mockDbState.calendar_connections = [];
    mockDbState.appointments = [];
  });

  describe('1. OAuth URL Generation & Providers Architecture', () => {
    it('generates a secure Google OAuth URL without asking for password', async () => {
      const res = await generateCalendarAuthUrl('d1', 'google');
      expect(res.success).toBe(true);
      expect(res.authUrl).toContain('accounts.google.com/o/oauth2/v2/auth');
      expect(res.authUrl).toContain('calendar.events.readonly');
      expect(res.authUrl).toContain('access_type=offline');
    });

    it('supports Microsoft Outlook provider architecture', () => {
      const provider = getCalendarProvider('outlook');
      expect(provider.type).toBe('outlook');
      const url = provider.getAuthorizationUrl('d1');
      expect(url).toContain('login.microsoftonline.com');
    });
  });

  describe('2. Connection & Token Exchange', () => {
    it('connects Google calendar with auth code and persists tokens securely', async () => {
      const res = await connectDentistCalendar('d1', 'google', 'valid-oauth-code');
      expect(res.success).toBe(true);
      expect(mockDbState.calendar_connections.length).toBe(1);
      expect(mockDbState.calendar_connections[0].status).toBe('connected');
      expect(mockDbState.calendar_connections[0].provider).toBe('google');
      expect(mockDbState.calendar_connections[0].access_token).toBeDefined();
    });

    it('handles connection failure on invalid or rejected auth code', async () => {
      const res = await connectDentistCalendar('d1', 'google', 'invalid-code');
      expect(res.success).toBe(false);
      expect(res.error).toContain('Invalid or expired authorization code');
    });
  });

  describe('3. Token Expiration & Automatic Refresh', () => {
    it('automatically refreshes an expired access token before use', async () => {
      // Setup expired token in DB
      mockDbState.calendar_connections = [
        {
          id: 'conn-1',
          dentist_id: 'd1',
          provider: 'google',
          access_token: 'expired-access-token',
          refresh_token: 'valid-refresh-token',
          status: 'connected',
          expires_at: new Date(Date.now() - 3600 * 1000).toISOString(), // 1 hour ago
          calendar_id: 'primary',
          email: 'sarah@clinic.com',
        },
      ];

      const tokenRes = await getValidAccessToken('d1');
      expect(tokenRes.accessToken).toBeDefined();
      expect(tokenRes.accessToken).not.toBe('expired-access-token');
      expect(tokenRes.status).toBe('connected');

      // DB updated with new expiry
      expect(new Date(mockDbState.calendar_connections[0].expires_at!).getTime()).toBeGreaterThan(Date.now());
    });

    it('marks connection as revoked when refresh fails', async () => {
      mockDbState.calendar_connections = [
        {
          id: 'conn-1',
          dentist_id: 'd1',
          provider: 'google',
          access_token: 'expired-access-token',
          refresh_token: null, // No refresh token
          status: 'connected',
          expires_at: new Date(Date.now() - 3600 * 1000).toISOString(),
          calendar_id: 'primary',
          email: 'sarah@clinic.com',
        },
      ];

      const tokenRes = await getValidAccessToken('d1');
      expect(tokenRes.accessToken).toBeNull();
      expect(tokenRes.status).toBe('revoked');
      expect(mockDbState.calendar_connections[0].status).toBe('revoked');
    });
  });

  describe('4. Disconnection & Revocation', () => {
    it('disconnects dentist calendar and wipes access tokens', async () => {
      mockDbState.calendar_connections = [
        {
          id: 'conn-1',
          dentist_id: 'd1',
          provider: 'google',
          access_token: 'active-access-token',
          refresh_token: 'active-refresh-token',
          status: 'connected',
          expires_at: new Date(Date.now() + 3600 * 1000).toISOString(),
          calendar_id: 'primary',
          email: 'sarah@clinic.com',
        },
      ];

      const res = await disconnectDentistCalendar('d1');
      expect(res.success).toBe(true);
      expect(mockDbState.calendar_connections[0].status).toBe('disconnected');
      expect(mockDbState.calendar_connections[0].access_token).toBeNull();
      expect(mockDbState.calendar_connections[0].refresh_token).toBeNull();
    });
  });

  describe('5. External Calendar Conflict & Double Booking Prevention', () => {
    it('blocks appointment slots that conflict with external calendar busy times', async () => {
      // Connect calendar
      mockDbState.calendar_connections = [
        {
          id: 'conn-1',
          dentist_id: 'd1',
          provider: 'google',
          access_token: 'active-token',
          refresh_token: 'refresh-token',
          status: 'connected',
          expires_at: new Date(Date.now() + 3600 * 1000).toISOString(),
          calendar_id: 'primary',
          email: 'sarah@clinic.com',
        },
      ];

      // Mock Google provider fetchBusyTimes to return a 10:00 - 11:00 AM busy block on 2026-08-24 (Monday)
      const google = getCalendarProvider('google');
      vi.spyOn(google, 'fetchBusyTimes').mockResolvedValueOnce([
        {
          start: '2026-08-24T10:00:00Z',
          end: '2026-08-24T11:00:00Z',
        },
      ]);

      const res = await getAvailableSlots('clinic-1', 'd1', 's1', '2026-08-24');
      expect(res.success).toBe(true);
      const slots = res.slots || [];

      // Operating hours are 09:00 to 12:00.
      // Expected slots: 09:00, 09:15, 09:30, 11:00, 11:15, 11:30.
      // Slots inside 10:00 - 11:00 (10:00, 10:15, 10:30, 10:45) must be EXCLUDED.
      const slotStarts = slots.map(s => s.start);

      expect(slotStarts).toContain('2026-08-24T09:00:00Z');
      expect(slotStarts).toContain('2026-08-24T09:30:00Z');
      expect(slotStarts).toContain('2026-08-24T11:00:00Z');

      // Must NOT contain conflicting slots
      expect(slotStarts).not.toContain('2026-08-24T10:00:00Z');
      expect(slotStarts).not.toContain('2026-08-24T10:15:00Z');
      expect(slotStarts).not.toContain('2026-08-24T10:30:00Z');
      expect(slotStarts).not.toContain('2026-08-24T10:45:00Z');
    });
  });
});

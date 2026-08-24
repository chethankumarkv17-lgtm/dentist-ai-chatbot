import { describe, it, expect, vi, beforeEach } from 'vitest';
import {
  sanitizePrivacyMetadata,
  trackPrivacySafeEvent,
  getClinicAnalytics,
  getPlatformAnalytics,
} from './service';

// --- IN-MEMORY DATABASE MOCK ---
interface MockDb {
  appointments: {
    id: string;
    service_id: string;
    status: string;
    start_time: string;
    created_at: string;
  }[];
  services: {
    id: string;
    name: string;
    price: number;
  }[];
  conversations: {
    id: string;
    created_at: string;
  }[];
  analytics_events: {
    id: string;
    organization_id: string;
    source: string;
    event_name: string;
    metadata: Record<string, unknown>;
    created_at: string;
  }[];
  organizations: { id: string }[];
  subscriptions: { id: string; status: string; plan_id: string }[];
  ai_usage: { estimated_cost_usd: number; messages_count: number; usage_date: string }[];
  [key: string]: unknown[];
}

const mockDbState: MockDb = {
  appointments: [
    {
      id: 'a1',
      service_id: 'srv-clean',
      status: 'confirmed',
      start_time: '2026-08-24T10:00:00Z', // Monday 10 AM
      created_at: '2026-08-20T10:00:00Z',
    },
    {
      id: 'a2',
      service_id: 'srv-clean',
      status: 'completed',
      start_time: '2026-08-24T11:00:00Z', // Monday 11 AM
      created_at: '2026-08-20T11:00:00Z',
    },
    {
      id: 'a3',
      service_id: 'srv-root',
      status: 'cancelled',
      start_time: '2026-08-25T14:00:00Z', // Tuesday 2 PM
      created_at: '2026-08-21T14:00:00Z',
    },
    {
      id: 'a4',
      service_id: 'srv-root',
      status: 'no_show',
      start_time: '2026-08-25T15:00:00Z', // Tuesday 3 PM
      created_at: '2026-08-21T15:00:00Z',
    },
  ],
  services: [
    { id: 'srv-clean', name: 'Dental Cleaning', price: 150 },
    { id: 'srv-root', name: 'Root Canal', price: 800 },
  ],
  conversations: [{ id: 'c1', created_at: '2026-08-20T10:00:00Z' }, { id: 'c2', created_at: '2026-08-21T10:00:00Z' }],
  analytics_events: [
    {
      id: 'e1',
      organization_id: 'org-1',
      source: 'platform_website',
      event_name: 'page_view',
      metadata: { path: '/services' },
      created_at: '2026-08-20T10:00:00Z',
    },
  ],
  organizations: [{ id: 'org-1' }, { id: 'org-2' }],
  subscriptions: [
    { id: 'sub-1', status: 'active', plan_id: 'plan-starter' },
    { id: 'sub-2', status: 'active', plan_id: 'plan-growth' },
  ],
  ai_usage: [
    { estimated_cost_usd: 1.25, messages_count: 50, usage_date: '2026-08-20' },
  ],
};

const createMockSupabase = () => {
  const chain = (table: string) => {
    let result: Record<string, unknown>[] = (mockDbState[table] as Record<string, unknown>[]) || [];

    const obj = {
      select: vi.fn((_fields?: string, opts?: { count?: string; head?: boolean }) => {
        if (opts?.count === 'exact') {
          return {
            count: result.length,
            eq: vi.fn(() => obj),
            gte: vi.fn(() => obj),
            then: (resolve: (val: { count: number }) => void) => resolve({ count: result.length }),
          };
        }
        return obj;
      }),
      eq: vi.fn((field: string, val: unknown) => {
        result = result.filter(r => r[field] === val);
        return obj;
      }),
      gte: vi.fn((field: string, val: unknown) => {
        result = result.filter(r => (r[field] as string) >= (val as string));
        return obj;
      }),
      single: vi.fn(() => ({ data: result[0] || null, error: result[0] ? null : { message: 'Not found' } })),
      maybeSingle: vi.fn(() => ({ data: result[0] || null, error: null })),
      insert: vi.fn((payload: Record<string, unknown>) => {
        const item = { id: `id-${Date.now()}-${Math.random()}`, ...payload };
        if (!mockDbState[table]) mockDbState[table] = [];
        mockDbState[table].push(item);
        return { data: item, error: null };
      }),
      then: (resolve: (val: { data: Record<string, unknown>[] }) => void) => resolve({ data: result }),
    };

    return obj;
  };

  return {
    from: vi.fn((table: string) => chain(table)),
  };
};

vi.mock('@/lib/supabase/server-auth', () => ({
  createClient: vi.fn(() => createMockSupabase()),
}));

describe('Phase 24 — Clinic & Platform Analytics', () => {
  beforeEach(() => {
    mockDbState.analytics_events = [
      {
        id: 'e1',
        organization_id: 'org-1',
        source: 'platform_website',
        event_name: 'page_view',
        metadata: { path: '/services' },
        created_at: '2026-08-20T10:00:00Z',
      },
    ];
  });

  describe('1. Privacy-Safe Metadata Sanitization', () => {
    it('strips all sensitive patient PII while retaining legitimate metric data', () => {
      const rawMeta = {
        email: 'patient@secret.com',
        phone: '555-123-4567',
        patientName: 'John Doe',
        notes: 'Has high tooth sensitivity',
        serviceId: 'srv-clean',
        deviceType: 'mobile',
        referrer: 'google.com',
      };

      const sanitized = sanitizePrivacyMetadata(rawMeta);

      expect(sanitized.email).toBeUndefined();
      expect(sanitized.phone).toBeUndefined();
      expect(sanitized.patientName).toBeUndefined();
      expect(sanitized.notes).toBeUndefined();
      expect(sanitized.serviceId).toBe('srv-clean');
      expect(sanitized.deviceType).toBe('mobile');
      expect(sanitized.referrer).toBe('google.com');
    });

    it('records privacy-safe analytics events to database', async () => {
      await trackPrivacySafeEvent('org-1', 'booking_requested', 'widget', {
        serviceId: 'srv-clean',
        email: 'patient@example.com', // Should be stripped
      });

      const lastEvent = mockDbState.analytics_events[mockDbState.analytics_events.length - 1];
      expect(lastEvent.event_name).toBe('booking_requested');
      expect(lastEvent.metadata.serviceId).toBe('srv-clean');
      expect(lastEvent.metadata.email).toBeUndefined();
    });
  });

  describe('2. Real Clinic Analytics & Conversion Funnel', () => {
    it('calculates booking conversions and appointment status breakdown', async () => {
      const analytics = await getClinicAnalytics('org-1', 30);

      expect(analytics.bookingRequests).toBe(4);
      expect(analytics.successfulBookings).toBe(2); // confirmed (1) + completed (1)
      expect(analytics.conversionRate).toBe(50); // 2 / 4 * 100% = 50%

      expect(analytics.appointments.confirmed).toBe(1);
      expect(analytics.appointments.completed).toBe(1);
      expect(analytics.appointments.cancelled).toBe(1);
      expect(analytics.appointments.noShow).toBe(1);
    });

    it('ranks popular dental services by appointment count and estimated revenue', async () => {
      const analytics = await getClinicAnalytics('org-1', 30);

      expect(analytics.popularServices.length).toBe(2);
      const cleanService = analytics.popularServices.find(s => s.serviceId === 'srv-clean');
      expect(cleanService?.count).toBe(2);
      expect(cleanService?.revenueEstimate).toBe(300); // 2 * $150 = $300

      const rootService = analytics.popularServices.find(s => s.serviceId === 'srv-root');
      expect(rootService?.count).toBe(2);
      expect(rootService?.revenueEstimate).toBe(1600); // 2 * $800 = $1600
    });

    it('identifies busy periods and peak booking days and hours', async () => {
      const analytics = await getClinicAnalytics('org-1', 30);

      expect(analytics.busyPeriods.byDay.length).toBe(7);
      expect(analytics.busyPeriods.peakDay).toBe('Monday'); // Monday has 2 appointments
      expect(analytics.measuredPageViews).toBe(1);
    });
  });

  describe('3. Platform-Wide Analytics', () => {
    it('aggregates platform-wide organizations, MRR, ARR, and conversion metrics', async () => {
      const platform = await getPlatformAnalytics(30);

      expect(platform.totalOrganizations).toBe(2);
      expect(platform.activeSubscriptions).toBe(2);
      expect(platform.mrrEstimateUsd).toBeGreaterThanOrEqual(99);
      expect(platform.arrEstimateUsd).toBe(platform.mrrEstimateUsd * 12);
      expect(platform.platformTotalAppointments).toBe(4);
    });
  });
});

import { describe, it, expect, vi, beforeEach } from 'vitest';
import {
  sanitizeMonitoringData,
  recordSystemError,
  recordSystemMetric,
  checkAndTriggerCriticalAlerts,
} from './logger';
import {
  getSystemHealthOverview,
  acknowledgeCriticalAlert,
} from './service';

// --- IN-MEMORY DATABASE MOCK ---
interface MockDb {
  system_error_logs: {
    id: string;
    service_name: string;
    error_type: string;
    message: string;
    stack_trace?: string | null;
    severity: string;
    organization_id?: string | null;
    resolved: boolean;
    created_at: string;
  }[];
  system_metrics: {
    id: string;
    service_name: string;
    metric_type: string;
    value: number;
    tags: Record<string, unknown>;
    created_at: string;
  }[];
  critical_alerts: {
    id: string;
    alert_type: string;
    title: string;
    description: string;
    severity: string;
    triggered_at: string;
    acknowledged: boolean;
  }[];
  [key: string]: unknown[];
}

const mockDbState: MockDb = {
  system_error_logs: [],
  system_metrics: [],
  critical_alerts: [],
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
      order: vi.fn(() => obj),
      limit: vi.fn((count: number) => {
        result = result.slice(0, count);
        return obj;
      }),
      single: vi.fn(() => ({ data: result[0] || null, error: result[0] ? null : { message: 'Not found' } })),
      maybeSingle: vi.fn(() => ({ data: result[0] || null, error: null })),
      insert: vi.fn((payload: Record<string, unknown>) => {
        const item = { id: `id-${Date.now()}-${Math.random()}`, created_at: new Date().toISOString(), ...payload };
        if (!mockDbState[table]) mockDbState[table] = [];
        mockDbState[table].push(item);
        return { data: item, error: null };
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
  };
};

vi.mock('@/lib/supabase/server-auth', () => ({
  createClient: vi.fn(() => createMockSupabase()),
}));

describe('Phase 30 — Production Monitoring & Observability', () => {
  beforeEach(() => {
    mockDbState.system_error_logs = [];
    mockDbState.system_metrics = [];
    mockDbState.critical_alerts = [];
  });

  describe('1. Secret & Patient PII Log Redaction', () => {
    it('redacts API keys, bearer tokens, and secret strings from messages', () => {
      const raw = 'Failed request with token Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9 and sk_live_99999999999999999999';
      const sanitized = sanitizeMonitoringData(raw);

      expect(sanitized).not.toContain('sk_live_');
      expect(sanitized).not.toContain('Bearer eyJ');
      expect(sanitized).toContain('[REDACTED_SECRET]');
    });

    it('redacts patient email addresses and phone numbers', () => {
      const raw = 'Error processing booking for patient john.doe@example.com with phone +15551234567';
      const sanitized = sanitizeMonitoringData(raw);

      expect(sanitized).not.toContain('john.doe@example.com');
      expect(sanitized).not.toContain('+15551234567');
      expect(sanitized).toContain('[REDACTED_EMAIL]');
      expect(sanitized).toContain('[REDACTED_PHONE]');
    });

    it('redacts sensitive fields within nested metadata objects', () => {
      const metadata = {
        endpoint: '/api/chat',
        patient_name: 'Jane Doe',
        medical_notes: 'History of gum bleeding',
        password: 'superSecretPassword123',
        status_code: 500,
      };

      const sanitized = sanitizeMonitoringData(metadata) as Record<string, unknown>;

      expect(sanitized.endpoint).toBe('/api/chat');
      expect(sanitized.patient_name).toBe('[REDACTED]');
      expect(sanitized.medical_notes).toBe('[REDACTED]');
      expect(sanitized.password).toBe('[REDACTED]');
      expect(sanitized.status_code).toBe(500);
    });
  });

  describe('2. Error Logging & Metric Recording', () => {
    it('records sanitized system error log in database', async () => {
      await recordSystemError({
        serviceName: 'ai_receptionist',
        errorType: 'AI_FAILURE',
        message: 'OpenAI timeout for sk_live_12345678901234567890',
        severity: 'high',
      });

      expect(mockDbState.system_error_logs.length).toBe(1);
      const log = mockDbState.system_error_logs[0];
      expect(log.service_name).toBe('ai_receptionist');
      expect(log.error_type).toBe('AI_FAILURE');
      expect(log.message).not.toContain('sk_live_');
      expect(log.message).toContain('[REDACTED_SECRET]');
    });

    it('records performance and latency metrics', async () => {
      await recordSystemMetric({
        serviceName: 'booking_engine',
        metricType: 'api_latency',
        value: 45,
        tags: { endpoint: '/api/book', success: true },
      });

      expect(mockDbState.system_metrics.length).toBe(1);
      expect(mockDbState.system_metrics[0].value).toBe(45);
    });
  });

  describe('3. Critical Alert Triggering', () => {
    it('triggers critical alert when database connection drops', async () => {
      const res = await checkAndTriggerCriticalAlerts({ dbConnected: false });
      expect(res.alertsTriggered).toBeGreaterThan(0);
      expect(mockDbState.critical_alerts.some((a) => a.alert_type === 'DATABASE_UNREACHABLE')).toBe(true);
    });

    it('triggers high alert when AI failure rate exceeds 5%', async () => {
      const res = await checkAndTriggerCriticalAlerts({ aiFailureRate: 0.08 });
      expect(res.alertsTriggered).toBeGreaterThan(0);
      expect(mockDbState.critical_alerts.some((a) => a.alert_type === 'AI_FAILURE_SPIKE')).toBe(true);
    });

    it('triggers alert when consecutive webhook failures accumulate', async () => {
      const res = await checkAndTriggerCriticalAlerts({ failedWebhookCount: 6 });
      expect(res.alertsTriggered).toBeGreaterThan(0);
      expect(mockDbState.critical_alerts.some((a) => a.alert_type === 'WEBHOOK_FAILURE_STREAK')).toBe(true);
    });
  });

  describe('4. Health Overview & Alert Dismissal', () => {
    it('compiles comprehensive system health overview with service statuses', async () => {
      const overview = await getSystemHealthOverview();

      expect(overview.overallUptimePercent).toBeGreaterThan(99);
      expect(overview.services.length).toBeGreaterThan(5);
      expect(overview.latency.apiP95Ms).toBeDefined();
      expect(overview.latency.aiAvgMs).toBeDefined();
    });

    it('acknowledges and dismisses active critical alerts', async () => {
      mockDbState.critical_alerts = [
        {
          id: 'alert-1',
          alert_type: 'AI_FAILURE_SPIKE',
          title: 'AI Failure',
          description: 'Spike in AI failures',
          severity: 'high',
          triggered_at: '2026-08-20T10:00:00Z',
          acknowledged: false,
        },
      ];

      const success = await acknowledgeCriticalAlert('alert-1');
      expect(success).toBe(true);
      expect(mockDbState.critical_alerts[0].acknowledged).toBe(true);
    });
  });
});

import { describe, it, expect, vi, beforeEach } from 'vitest';
import {
  checkIpRateLimit,
  checkUserRateLimit,
  checkClinicRateLimit,
  checkBurstLimit,
  resetRateLimitCache,
} from './rate-limiter';
import {
  calculateEstimatedAiCost,
  recordAiUsage,
  getOrganizationMonthlyUsage,
} from './cost-tracker';
import {
  enforceAiQuota,
  triggerAbnormalUsageCircuitBreaker,
  dispatchUsageAlert,
} from './quota-guard';

// --- IN-MEMORY DATABASE MOCK ---
interface MockDb {
  subscriptions: {
    id: string;
    organization_id: string;
    plan_id?: string;
    status: string;
  }[];
  plans: {
    id: string;
    name: string;
    limits: Record<string, unknown>;
  }[];
  ai_usage: {
    id: string;
    organization_id: string;
    usage_date: string;
    prompt_tokens: number;
    completion_tokens: number;
    requests_count: number;
    messages_count: number;
    estimated_cost_usd: number;
  }[];
  organizations: {
    id: string;
    ai_restricted_until?: string | null;
    ai_abuse_flag?: boolean;
  }[];
  usage_alerts: {
    id: string;
    organization_id: string;
    alert_type: string;
    severity: string;
    message: string;
    metadata: Record<string, unknown>;
  }[];
  dentists: unknown[];
  clinic_websites: unknown[];
  appointments: unknown[];
  [key: string]: unknown[];
}

const mockDbState: MockDb = {
  subscriptions: [
    {
      id: 'sub-1',
      organization_id: 'org-1',
      plan_id: 'plan-starter-id',
      status: 'active',
    },
  ],
  plans: [
    {
      id: 'plan-starter-id',
      name: 'Starter',
      limits: { aiMessagesLimit: 500, dentistsLimit: 2 },
    },
  ],
  ai_usage: [],
  organizations: [
    {
      id: 'org-1',
      ai_restricted_until: null,
      ai_abuse_flag: false,
    },
  ],
  usage_alerts: [],
  dentists: [{ id: 'd1' }],
  clinic_websites: [{ id: 'w1' }],
  appointments: [{ id: 'a1' }],
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

describe('Phase 23 — Usage Limits & AI Cost Control', () => {
  beforeEach(() => {
    resetRateLimitCache();
    mockDbState.ai_usage = [];
    mockDbState.usage_alerts = [];
    mockDbState.organizations = [
      {
        id: 'org-1',
        ai_restricted_until: null,
        ai_abuse_flag: false,
      },
    ];
  });

  describe('1. Multi-Layer Rate Limiting & Burst Protection', () => {
    it('enforces IP rate limiting (60 req/min)', () => {
      const ip = '192.168.1.50';
      for (let i = 0; i < 60; i++) {
        expect(checkIpRateLimit(ip).allowed).toBe(true);
      }
      const breach = checkIpRateLimit(ip);
      expect(breach.allowed).toBe(false);
      expect(breach.retryAfterSeconds).toBeGreaterThan(0);
    });

    it('enforces User / Patient Session rate limiting (30 req/min)', () => {
      const user = 'patient-session-abc';
      for (let i = 0; i < 30; i++) {
        expect(checkUserRateLimit(user).allowed).toBe(true);
      }
      const breach = checkUserRateLimit(user);
      expect(breach.allowed).toBe(false);
    });

    it('enforces Clinic rate limiting (120 req/min)', () => {
      const org = 'org-large-clinic';
      for (let i = 0; i < 120; i++) {
        expect(checkClinicRateLimit(org).allowed).toBe(true);
      }
      const breach = checkClinicRateLimit(org);
      expect(breach.allowed).toBe(false);
    });

    it('enforces Rapid Burst Protection (15 req/10s)', () => {
      const burstKey = 'attacker-burst-ip';
      for (let i = 0; i < 15; i++) {
        expect(checkBurstLimit(burstKey).allowed).toBe(true);
      }
      const burstBreach = checkBurstLimit(burstKey);
      expect(burstBreach.allowed).toBe(false);
      expect(burstBreach.reason).toContain('Rate limit exceeded');
    });
  });

  describe('2. Token Usage & AI Cost Tracking', () => {
    it('calculates estimated AI cost accurately based on token rates', () => {
      // 1000 prompt tokens ($0.00015) + 1000 completion tokens ($0.00060) = $0.00075
      const cost = calculateEstimatedAiCost(1000, 1000);
      expect(cost).toBe(0.00075);
    });

    it('records and aggregates daily and monthly AI token usage and cost', async () => {
      await recordAiUsage('org-1', {
        promptTokens: 2000,
        completionTokens: 1000,
        messagesCount: 2,
        requestsCount: 2,
      });

      expect(mockDbState.ai_usage.length).toBe(1);
      expect(mockDbState.ai_usage[0].prompt_tokens).toBe(2000);
      expect(mockDbState.ai_usage[0].completion_tokens).toBe(1000);
      expect(mockDbState.ai_usage[0].messages_count).toBe(2);
      expect(mockDbState.ai_usage[0].estimated_cost_usd).toBeGreaterThan(0);

      const summary = await getOrganizationMonthlyUsage('org-1');
      expect(summary.totalPromptTokens).toBe(2000);
      expect(summary.totalCompletionTokens).toBe(1000);
      expect(summary.totalMessages).toBe(2);
      expect(summary.monthlyLimit).toBe(500);
    });
  });

  describe('3. Monthly Plan Quota Enforcement & Hard Blocking', () => {
    it('allows requests when within monthly quota limit', async () => {
      const res = await enforceAiQuota('org-1');
      expect(res.allowed).toBe(true);
    });

    it('blocks AI requests when 100% monthly limit is reached', async () => {
      const today = new Date().toISOString().split('T')[0];
      mockDbState.ai_usage.push({
        id: 'usage-exhausted',
        organization_id: 'org-1',
        usage_date: today,
        prompt_tokens: 50000,
        completion_tokens: 25000,
        requests_count: 500,
        messages_count: 500, // Matches Starter limit of 500
        estimated_cost_usd: 0.5,
      });

      const res = await enforceAiQuota('org-1');
      expect(res.allowed).toBe(false);
      expect(res.reason).toBe('quota_exceeded');
      expect(mockDbState.usage_alerts.some(a => a.alert_type === 'quota_100')).toBe(true);
    });

    it('dispatches warning alert when 80% quota threshold is reached', async () => {
      const today = new Date().toISOString().split('T')[0];
      mockDbState.ai_usage.push({
        id: 'usage-warning',
        organization_id: 'org-1',
        usage_date: today,
        prompt_tokens: 40000,
        completion_tokens: 20000,
        requests_count: 400,
        messages_count: 400, // 80% of 500
        estimated_cost_usd: 0.4,
      });

      const res = await enforceAiQuota('org-1');
      expect(res.allowed).toBe(true);
      expect(mockDbState.usage_alerts.some(a => a.alert_type === 'quota_80')).toBe(true);
    });
  });

  describe('4. Circuit Breaker & Temporary Restrictions', () => {
    it('triggers circuit breaker and restricts organization on abnormal burst spike', async () => {
      const { restrictedUntil } = await triggerAbnormalUsageCircuitBreaker(
        'org-1',
        'Excessive automated spam requests exceeding 100 req/min',
        15
      );

      expect(restrictedUntil).toBeDefined();
      expect(mockDbState.organizations[0].ai_abuse_flag).toBe(true);
      expect(mockDbState.organizations[0].ai_restricted_until).toBe(restrictedUntil);

      // Now enforceAiQuota immediately rejects with temporarily_restricted
      const quotaCheck = await enforceAiQuota('org-1');
      expect(quotaCheck.allowed).toBe(false);
      expect(quotaCheck.reason).toBe('temporarily_restricted');
    });

    it('dispatches structured usage alerts to platform log', async () => {
      await dispatchUsageAlert({
        organizationId: 'org-1',
        alertType: 'burst_abuse',
        severity: 'critical',
        message: 'Sudden anomalous token consumption detected',
      });

      expect(mockDbState.usage_alerts.length).toBeGreaterThan(0);
      expect(mockDbState.usage_alerts[0].alert_type).toBe('burst_abuse');
    });
  });
});

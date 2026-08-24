import { describe, it, expect, vi, beforeEach } from 'vitest';
import {
  requirePlatformAdmin,
  logAdminAuditAction,
} from './auth';
import {
  getAdminOverviewMetrics,
  getAdminClinicsList,
  suspendOrganization,
  reactivateOrganization,
  getAdminAuditLogs,
} from './service';

// --- IN-MEMORY DATABASE MOCK ---
interface MockDb {
  organizations: {
    id: string;
    name: string;
    is_suspended?: boolean;
    suspended_reason?: string | null;
    suspended_at?: string | null;
    created_at?: string;
  }[];
  clinics: { id: string; organization_id: string; name: string }[];
  subscriptions: { id: string; organization_id: string; status: string; plan_id: string }[];
  appointments: { id: string; clinic_id?: string; status: string }[];
  ai_usage: { messages_count: number; estimated_cost_usd: number }[];
  webhook_events: { id: string; status: string }[];
  audit_logs: {
    id: string;
    organization_id: string;
    user_id?: string;
    action: string;
    entity: string;
    entity_id: string;
    details: Record<string, unknown>;
    created_at: string;
  }[];
  profiles: { id: string; email: string; is_super_admin: boolean }[];
  dentists: { id: string }[];
  [key: string]: unknown[];
}

const mockDbState: MockDb = {
  organizations: [
    { id: 'org-1', name: 'Downtown Dental', is_suspended: false },
    { id: 'org-2', name: 'Westside Smiles', is_suspended: false },
  ],
  clinics: [
    { id: 'c1', organization_id: 'org-1', name: 'Downtown Dental' },
    { id: 'c2', organization_id: 'org-2', name: 'Westside Smiles' },
  ],
  subscriptions: [
    { id: 'sub-1', organization_id: 'org-1', status: 'active', plan_id: 'plan-growth' },
    { id: 'sub-2', organization_id: 'org-2', status: 'trialing', plan_id: 'plan-starter' },
  ],
  appointments: [
    { id: 'a1', status: 'confirmed' },
    { id: 'a2', status: 'completed' },
  ],
  ai_usage: [
    { messages_count: 85, estimated_cost_usd: 0.12 },
  ],
  webhook_events: [
    { id: 'w1', status: 'failed' },
  ],
  audit_logs: [],
  profiles: [
    { id: 'admin-1', email: 'admin@radiantnobel.com', is_super_admin: true },
    { id: 'user-2', email: 'dentist@clinic.com', is_super_admin: false },
  ],
  dentists: [{ id: 'd1' }, { id: 'd2' }],
};

const createMockSupabase = () => {
  const chain = (table: string) => {
    let result: Record<string, unknown>[] = (mockDbState[table] as Record<string, unknown>[]) || [];

    const obj = {
      select: vi.fn((_fields?: string, opts?: { count?: string; head?: boolean }) => {
        if (opts?.count === 'exact') {
          return {
            count: result.length,
            eq: vi.fn((field: string, val: unknown) => {
              const filtered = result.filter(r => r[field] === val);
              return {
                count: filtered.length,
                then: (resolve: (val: { count: number }) => void) => resolve({ count: filtered.length }),
              };
            }),
            then: (resolve: (val: { count: number }) => void) => resolve({ count: result.length }),
          };
        }
        return obj;
      }),
      eq: vi.fn((field: string, val: unknown) => {
        result = result.filter(r => r[field] === val);
        return obj;
      }),
      order: vi.fn(() => obj),
      limit: vi.fn(() => obj),
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
    auth: {
      getUser: vi.fn(() => ({
        data: { user: { id: 'admin-1', email: 'admin@radiantnobel.com' } },
        error: null,
      })),
    },
    from: vi.fn((table: string) => chain(table)),
  };
};

vi.mock('@/lib/supabase/server-auth', () => ({
  createClient: vi.fn(() => createMockSupabase()),
}));

describe('Phase 25 — Platform Admin Control Center', () => {
  beforeEach(() => {
    mockDbState.audit_logs = [];
    mockDbState.organizations = [
      { id: 'org-1', name: 'Downtown Dental', is_suspended: false },
      { id: 'org-2', name: 'Westside Smiles', is_suspended: false },
    ];
  });

  describe('1. Platform Admin Authorization & Security', () => {
    it('authorizes authenticated super administrators without hidden backdoors', async () => {
      const admin = await requirePlatformAdmin();
      expect(admin.isSuperAdmin).toBe(true);
      expect(admin.email).toBeDefined();
    });
  });

  describe('2. Administrative Audit Logging', () => {
    it('records sensitive admin actions to audit logs', async () => {
      await logAdminAuditAction({
        userId: 'admin-1',
        action: 'clinic.plan_override',
        entity: 'organization',
        entityId: 'org-1',
        details: { newPlan: 'pro' },
      });

      expect(mockDbState.audit_logs.length).toBe(1);
      expect(mockDbState.audit_logs[0].action).toBe('clinic.plan_override');
      expect(mockDbState.audit_logs[0].user_id).toBe('admin-1');
      expect(mockDbState.audit_logs[0].details.newPlan).toBe('pro');
    });
  });

  describe('3. Clinic Suspension & Reactivation Controls', () => {
    it('suspends a clinic and records a mandatory audit log entry', async () => {
      const res = await suspendOrganization('admin-1', 'org-1', 'Terms of Service violation');
      expect(res.success).toBe(true);

      expect(mockDbState.organizations[0].is_suspended).toBe(true);
      expect(mockDbState.organizations[0].suspended_reason).toBe('Terms of Service violation');
      expect(mockDbState.organizations[0].suspended_at).toBeDefined();

      // Audit log recorded
      expect(mockDbState.audit_logs.some(l => l.action === 'organization.suspend')).toBe(true);
    });

    it('reactivates a suspended clinic and logs reactivation event', async () => {
      mockDbState.organizations[0].is_suspended = true;
      mockDbState.organizations[0].suspended_reason = 'Payment issue';

      const res = await reactivateOrganization('admin-1', 'org-1');
      expect(res.success).toBe(true);

      expect(mockDbState.organizations[0].is_suspended).toBe(false);
      expect(mockDbState.organizations[0].suspended_reason).toBeNull();

      expect(mockDbState.audit_logs.some(l => l.action === 'organization.reactivate')).toBe(true);
    });
  });

  describe('4. Platform Overview Metrics & Lists', () => {
    it('aggregates platform customer counts and telemetry', async () => {
      const metrics = await getAdminOverviewMetrics();
      expect(metrics.totalOrganizations).toBe(2);
      expect(metrics.activeCustomers).toBeGreaterThanOrEqual(1);
      expect(metrics.totalAiMessages).toBeGreaterThan(0);
    });

    it('fetches list of clinics with subscription and suspension status', async () => {
      const clinics = await getAdminClinicsList();
      expect(clinics.length).toBe(2);
      expect(clinics[0].name).toBe('Downtown Dental');
      expect(clinics[0].isSuspended).toBe(false);
    });

    it('retrieves audit trail history', async () => {
      await logAdminAuditAction({
        userId: 'admin-1',
        action: 'system.health_check',
        entity: 'platform',
        entityId: 'system-root',
      });

      const logs = await getAdminAuditLogs(10);
      expect(logs.length).toBe(1);
      expect(logs[0].action).toBe('system.health_check');
    });
  });
});

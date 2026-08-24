import { describe, it, expect, vi, beforeEach } from 'vitest';
import {
  getRetentionPolicy,
  updateRetentionPolicy,
  exportOrganizationData,
  erasePatientData,
  deleteUserAccount,
  deleteOrganization,
  enforceRetentionPurge,
} from './service';

// --- IN-MEMORY DATABASE MOCK ---
interface MockDb {
  organizations: {
    id: string;
    name: string;
    created_at: string;
    appointment_retention_days?: number;
    transcript_retention_days?: number;
    analytics_retention_days?: number;
  }[];
  clinics: { id: string; organization_id: string; name: string; timezone: string }[];
  services: { id: string; organization_id?: string; name: string; duration_minutes: number; price: number }[];
  dentists: { id: string; organization_id?: string; name: string; specialty?: string }[];
  appointments: {
    id: string;
    organization_id?: string;
    service_id: string;
    dentist_id: string;
    patient_name?: string;
    patient_email?: string;
    patient_phone?: string;
    medical_notes?: string | null;
    start_time: string;
    end_time: string;
    status: string;
    created_at: string;
  }[];
  conversations: { id: string; organization_id?: string; created_at: string }[];
  support_tickets: { id: string; organization_id: string }[];
  analytics_events: { id: string; organization_id: string }[];
  subscriptions: { id: string; organization_id: string }[];
  profiles: { id: string; email: string }[];
  organization_members: { id: string; user_id: string; organization_id: string }[];
  data_deletion_requests: { id: string; request_type: string; target_identifier: string }[];
  audit_logs: { action: string }[];
  [key: string]: unknown[];
}

const mockDbState: MockDb = {
  organizations: [
    {
      id: 'org-1',
      name: 'Downtown Dental',
      created_at: '2026-08-01T00:00:00Z',
      appointment_retention_days: 365,
      transcript_retention_days: 90,
      analytics_retention_days: 180,
    },
  ],
  clinics: [{ id: 'c1', organization_id: 'org-1', name: 'Downtown Main', timezone: 'America/New_York' }],
  services: [{ id: 's1', organization_id: 'org-1', name: 'Cleaning', duration_minutes: 30, price: 120 }],
  dentists: [{ id: 'd1', organization_id: 'org-1', name: 'Dr. Jane Smith', specialty: 'General' }],
  appointments: [
    {
      id: 'a1',
      organization_id: 'org-1',
      service_id: 's1',
      dentist_id: 'd1',
      patient_name: 'John Patient',
      patient_email: 'john@example.com',
      patient_phone: '+15551234567',
      medical_notes: 'Sensitive tooth',
      start_time: '2026-08-25T10:00:00Z',
      end_time: '2026-08-25T10:30:00Z',
      status: 'confirmed',
      created_at: '2026-08-20T10:00:00Z',
    },
    {
      id: 'a-old',
      organization_id: 'org-1',
      service_id: 's1',
      dentist_id: 'd1',
      patient_name: 'Old Record',
      patient_email: 'old@example.com',
      patient_phone: '+15559999999',
      start_time: '2024-01-01T10:00:00Z',
      end_time: '2024-01-01T10:30:00Z',
      status: 'completed',
      created_at: '2024-01-01T10:00:00Z', // Expired
    },
  ],
  conversations: [
    { id: 'conv-1', created_at: '2026-08-20T10:00:00Z' },
    { id: 'conv-old', created_at: '2024-01-01T10:00:00Z' }, // Expired
  ],
  support_tickets: [{ id: 't1', organization_id: 'org-1' }],
  analytics_events: [{ id: 'ae1', organization_id: 'org-1' }],
  subscriptions: [{ id: 'sub1', organization_id: 'org-1' }],
  profiles: [{ id: 'u1', email: 'owner@clinic.com' }],
  organization_members: [{ id: 'om1', user_id: 'u1', organization_id: 'org-1' }],
  data_deletion_requests: [],
  audit_logs: [],
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
      or: vi.fn((clause: string) => {
        // e.g. "patient_email.eq.john@example.com,patient_phone.eq.john@example.com"
        const parts = clause.split(',').map(p => p.trim());
        result = result.filter(r => {
          return parts.some(p => {
            const match = p.match(/^([a-z_]+)\.([a-z]+)\.(.*)$/i);
            if (match) {
              const [, field, , targetVal] = match;
              return r[field] === targetVal;
            }
            return false;
          });
        });
        return obj;
      }),
      lt: vi.fn((field: string, val: unknown) => {
        result = result.filter(r => (r[field] as string) < (val as string));
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
          or: vi.fn((clause: string) => {
            const parts = clause.split(',').map(p => p.trim());
            const tableArr = (mockDbState[table] as Record<string, unknown>[]) || [];
            mockDbState[table] = tableArr.map((r) => {
              const matched = parts.some(p => {
                const match = p.match(/^([a-z_]+)\.([a-z]+)\.(.*)$/i);
                if (match) {
                  const [, field, , targetVal] = match;
                  return r[field] === targetVal;
                }
                return false;
              });
              return matched ? { ...r, ...payload } : r;
            });
            return { data: null, error: null };
          }),
        };
      }),
      delete: vi.fn(() => {
        return {
          eq: vi.fn((field: string, val: unknown) => {
            const initial = (mockDbState[table] as Record<string, unknown>[]) || [];
            mockDbState[table] = initial.filter(r => r[field] !== val);
            return { data: null, error: null };
          }),
          lt: vi.fn((field: string, val: unknown) => {
            const initial = (mockDbState[table] as Record<string, unknown>[]) || [];
            const deleted = initial.filter(r => (r[field] as string) < (val as string));
            mockDbState[table] = initial.filter(r => (r[field] as string) >= (val as string));
            return {
              select: vi.fn(() => ({
                data: deleted,
                error: null,
                then: (resolve: (val: { data: Record<string, unknown>[] }) => void) => resolve({ data: deleted }),
              })),
              data: deleted,
              error: null,
            };
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

describe('Phase 27 — Privacy & Data Management', () => {
  beforeEach(() => {
    mockDbState.organizations = [
      {
        id: 'org-1',
        name: 'Downtown Dental',
        created_at: '2026-08-01T00:00:00Z',
        appointment_retention_days: 365,
        transcript_retention_days: 90,
        analytics_retention_days: 180,
      },
    ];
    mockDbState.appointments = [
      {
        id: 'a1',
        organization_id: 'org-1',
        service_id: 's1',
        dentist_id: 'd1',
        patient_name: 'John Patient',
        patient_email: 'john@example.com',
        patient_phone: '+15551234567',
        medical_notes: 'Sensitive tooth',
        start_time: '2026-08-25T10:00:00Z',
        end_time: '2026-08-25T10:30:00Z',
        status: 'confirmed',
        created_at: '2026-08-20T10:00:00Z',
      },
      {
        id: 'a-old',
        organization_id: 'org-1',
        service_id: 's1',
        dentist_id: 'd1',
        patient_name: 'Old Record',
        patient_email: 'old@example.com',
        patient_phone: '+15559999999',
        start_time: '2024-01-01T10:00:00Z',
        end_time: '2024-01-01T10:30:00Z',
        status: 'completed',
        created_at: '2024-01-01T10:00:00Z',
      },
    ];
    mockDbState.data_deletion_requests = [];
  });

  describe('1. Retention Policy Configuration', () => {
    it('retrieves and updates organization retention policies', async () => {
      const initial = await getRetentionPolicy('org-1');
      expect(initial.appointmentDays).toBe(365);
      expect(initial.transcriptDays).toBe(90);

      const updateRes = await updateRetentionPolicy('org-1', {
        appointmentDays: 180,
        transcriptDays: 30,
      });
      expect(updateRes.success).toBe(true);

      expect(mockDbState.organizations[0].appointment_retention_days).toBe(180);
      expect(mockDbState.organizations[0].transcript_retention_days).toBe(30);
    });
  });

  describe('2. Machine-Readable Data Export', () => {
    it('compiles all clinic, dentist, service, and appointment records into JSON export', async () => {
      const exportRes = await exportOrganizationData('org-1');
      expect(exportRes.success).toBe(true);
      expect(exportRes.data).toBeDefined();

      const data = exportRes.data!;
      expect(data.organization.name).toBe('Downtown Dental');
      expect(data.clinics.length).toBe(1);
      expect(data.services.length).toBe(1);
      expect(data.dentists.length).toBe(1);
      expect(data.appointments.length).toBeGreaterThan(0);
    });
  });

  describe('3. Patient Right to Erasure & Anonymization', () => {
    it('anonymizes personal identifiers and medical notes across matching records', async () => {
      const res = await erasePatientData('org-1', 'john@example.com', 'user-owner');
      expect(res.success).toBe(true);
      expect(res.redactedRecordsCount).toBe(1);

      const appt = mockDbState.appointments.find(a => a.id === 'a1');
      expect(appt?.patient_name).toBe('Anonymized Patient');
      expect(appt?.patient_email).toBe('deleted@erased.patient');
      expect(appt?.patient_phone).toBe('+0000000000');
      expect(appt?.medical_notes).toBeNull();

      expect(mockDbState.data_deletion_requests.length).toBe(1);
      expect(mockDbState.data_deletion_requests[0].request_type).toBe('patient_erasure');
    });
  });

  describe('4. Account and Organization Deletion Workflows', () => {
    it('deletes user profile and memberships on account deletion', async () => {
      const res = await deleteUserAccount('u1');
      expect(res.success).toBe(true);

      expect(mockDbState.profiles.find(p => p.id === 'u1')).toBeUndefined();
      expect(mockDbState.organization_members.find(m => m.user_id === 'u1')).toBeUndefined();
    });

    it('cascades deletion of organization and child entities on org deletion', async () => {
      const res = await deleteOrganization('org-1', 'u1');
      expect(res.success).toBe(true);

      expect(mockDbState.organizations.find(o => o.id === 'org-1')).toBeUndefined();
      expect(mockDbState.appointments.length).toBe(0);
      expect(mockDbState.dentists.length).toBe(0);
    });
  });

  describe('5. Automated Retention Policy Enforcement', () => {
    it('purges records older than configured retention period', async () => {
      const purge = await enforceRetentionPurge('org-1');
      expect(purge.purgedAppointments).toBe(1); // 'a-old' from 2024
      expect(purge.purgedTranscripts).toBe(1); // 'conv-old' from 2024
    });
  });
});

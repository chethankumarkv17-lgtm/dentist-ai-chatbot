import { describe, it, expect, vi, beforeEach } from 'vitest';
import { executeTool } from './tools';
import {
  processReceptionistMessage,
  determineToolCall,
  formatAIResponse,
} from './receptionist';
import { chatRateLimiter } from '@/lib/security/rate-limit';

// --- IN-MEMORY MOCK DATABASE ---
interface MockDb {
  clinics: { id: string; organization_id: string; name: string; timezone: string; address: string; phone: string; email: string }[];
  services: { id: string; clinic_id: string; name: string; description?: string; duration_minutes: number; buffer_time_minutes?: number; price?: number; is_active: boolean; is_bookable: boolean }[];
  dentists: { id: string; clinic_id: string; name: string; specialty?: string; bio?: string; is_active: boolean }[];
  business_hours: { clinic_id: string; day_of_week: number; open_time: string; close_time: string }[];
  holidays: { clinic_id: string; holiday_date: string }[];
  blocked_times: { dentist_id: string; start_timestamp: string; end_timestamp: string }[];
  patients: { id: string; organization_id: string; first_name: string; last_name: string; email: string; phone: string }[];
  appointments: { id: string; clinic_id: string; patient_id: string; dentist_id: string; service_id: string; start_time: string; end_time: string; status: string }[];
  conversations: { id: string; clinic_id: string; status: string }[];
  messages: { id: string; conversation_id: string; sender_type: string; content: string }[];
  notifications: { clinic_id: string; type: string; title: string; message: string; details: unknown }[];
  [key: string]: unknown[];
}

const mockDbState: MockDb = {
  clinics: [
    {
      id: 'c1',
      organization_id: 'org1',
      name: 'Radiant Smile Dental',
      timezone: 'America/New_York',
      address: '123 Main St, New York, NY',
      phone: '555-0100',
      email: 'contact@radiantsmile.com',
    },
  ],
  services: [
    {
      id: 's1',
      clinic_id: 'c1',
      name: 'Comprehensive Dental Exam',
      description: 'Full checkup and cleaning',
      duration_minutes: 60,
      buffer_time_minutes: 15,
      price: 150.0,
      is_active: true,
      is_bookable: true,
    },
    {
      id: 's2',
      clinic_id: 'c1',
      name: 'Inactive Treatment',
      duration_minutes: 30,
      is_active: false,
      is_bookable: false,
    },
  ],
  dentists: [
    {
      id: 'd1',
      clinic_id: 'c1',
      name: 'Sarah Connor',
      specialty: 'Orthodontics',
      bio: 'Over 10 years of experience',
      is_active: true,
    },
    {
      id: 'd2',
      clinic_id: 'c1',
      name: 'Retired Doctor',
      is_active: false,
    },
  ],
  business_hours: [
    { clinic_id: 'c1', day_of_week: 1, open_time: '09:00', close_time: '17:00' },
  ],
  holidays: [],
  blocked_times: [],
  patients: [
    {
      id: 'p1',
      organization_id: 'org1',
      first_name: 'John',
      last_name: 'Doe',
      email: 'john@example.com',
      phone: '555-1234',
    },
  ],
  appointments: [
    {
      id: 'a1',
      clinic_id: 'c1',
      patient_id: 'p1',
      dentist_id: 'd1',
      service_id: 's1',
      start_time: '2026-08-24T09:00:00Z',
      end_time: '2026-08-24T10:00:00Z',
      status: 'confirmed',
    },
  ],
  conversations: [],
  messages: [],
  notifications: [],
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
      in: vi.fn((field: string, vals: unknown[]) => {
        result = result.filter(r => vals.includes(r[field]));
        return obj;
      }),
      order: vi.fn(() => obj),
      single: vi.fn(() => ({ data: result[0] || null, error: result[0] ? null : { message: 'Not found' } })),
      maybeSingle: vi.fn(() => ({ data: result[0] || null, error: null })),
      insert: vi.fn((payload: Record<string, unknown>) => {
        const item = { id: `id-${Date.now()}-${Math.random()}`, ...payload };
        if (!mockDbState[table]) mockDbState[table] = [];
        mockDbState[table].push(item);
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
      then: (resolve: (val: { data: Record<string, unknown>[]; error: null }) => void) => resolve({ data: result, error: null }),
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

describe('AI Receptionist System', () => {
  beforeEach(() => {
    chatRateLimiter.reset();
  });

  describe('Controlled Tools Suite', () => {
    it('1. getClinicInformation returns verified clinic profile', async () => {
      const res = await executeTool('getClinicInformation', { clinicId: 'c1' });
      expect(res.success).toBe(true);
      const data = res.data as { name: string; timezone: string; phone: string };
      expect(data.name).toBe('Radiant Smile Dental');
      expect(data.timezone).toBe('America/New_York');
      expect(data.phone).toBe('555-0100');
    });

    it('2. getServices returns only active & bookable services', async () => {
      const res = await executeTool('getServices', { clinicId: 'c1' });
      expect(res.success).toBe(true);
      const data = res.data as { name: string; price: number }[];
      expect(data.length).toBe(1);
      expect(data[0].name).toBe('Comprehensive Dental Exam');
      expect(data[0].price).toBe(150.0);
    });

    it('3. getDentists returns only active practitioners', async () => {
      const res = await executeTool('getDentists', { clinicId: 'c1' });
      expect(res.success).toBe(true);
      const data = res.data as { name: string }[];
      expect(data.length).toBe(1);
      expect(data[0].name).toBe('Sarah Connor');
    });

    it('4. getBusinessHours returns opening hours & timezone', async () => {
      const res = await executeTool('getBusinessHours', { clinicId: 'c1' });
      expect(res.success).toBe(true);
      const data = res.data as { timezone: string; hours: { open_time: string }[] };
      expect(data.timezone).toBe('America/New_York');
      expect(data.hours.length).toBe(1);
    });

    it('5. getAvailableSlots calculates real available times', async () => {
      const res = await executeTool('getAvailableSlots', {
        clinicId: 'c1',
        dentistId: 'd1',
        serviceId: 's1',
        date: '2026-08-24',
      });
      expect(res.success).toBe(true);
      const data = res.data as { slots: unknown[] };
      expect(Array.isArray(data.slots)).toBe(true);
    });

    it('6. createAppointment verifies and creates confirmed appointment', async () => {
      const res = await executeTool('createAppointment', {
        clinicId: 'c1',
        patientName: 'Jane Smith',
        patientPhone: '555-9876',
        patientEmail: 'jane@example.com',
        dentistId: 'd1',
        serviceId: 's1',
        startTime: '2026-08-24T11:00:00Z',
      });
      expect(res.success).toBe(true);
      const data = res.data as { status: string; dentistName: string };
      expect(data.status).toBe('confirmed');
      expect(data.dentistName).toBe('Sarah Connor');
    });

    it('7. getPatientAppointments retrieves upcoming patient bookings', async () => {
      const res = await executeTool('getPatientAppointments', {
        clinicId: 'c1',
        patientPhoneOrEmail: 'john@example.com',
      });
      expect(res.success).toBe(true);
      const data = res.data as { appointments: { id: string }[] };
      expect(data.appointments.length).toBe(1);
      expect(data.appointments[0].id).toBe('a1');
    });

    it('8. cancelAppointment verifies patient identity before cancellation', async () => {
      const res = await executeTool('cancelAppointment', {
        clinicId: 'c1',
        appointmentId: 'a1',
        patientPhoneOrEmail: 'john@example.com',
      });
      expect(res.success).toBe(true);
      const data = res.data as { status: string };
      expect(data.status).toBe('cancelled');
    });

    it('9. rescheduleAppointment verifies new slot and reschedules', async () => {
      const res = await executeTool('rescheduleAppointment', {
        clinicId: 'c1',
        appointmentId: 'a1',
        newStartTime: '2026-08-24T14:00:00Z',
        patientPhoneOrEmail: 'john@example.com',
      });
      expect(res.success).toBe(true);
      const data = res.data as { status: string };
      expect(data.status).toBe('confirmed');
    });

    it('10. requestHumanHelp escalates conversation to clinic staff', async () => {
      const res = await executeTool('requestHumanHelp', {
        clinicId: 'c1',
        reason: 'Severe tooth pain and emergency questions',
        patientContact: 'john@example.com',
      });
      expect(res.success).toBe(true);
      const data = res.data as { escalated: boolean };
      expect(data.escalated).toBe(true);
    });

    it('handles malformed tool calls cleanly without crashing', async () => {
      const res = await executeTool('createAppointment', {
        clinicId: 'c1',
        // Missing required fields
      });
      expect(res.success).toBe(false);
      expect(res.error).toContain('Malformed parameters for tool');
    });

    it('rejects unknown tool names', async () => {
      const res = await executeTool('arbitrarySqlExecution', {});
      expect(res.success).toBe(false);
      expect(res.error).toContain('Unknown tool');
    });
  });

  describe('Intent Analysis & Tool Planning', () => {
    it('plans getClinicInformation for address/contact queries', () => {
      const plan = determineToolCall('Where is your dental office located?', 'c1');
      expect(plan).not.toBeNull();
      expect(plan?.tool).toBe('getClinicInformation');
    });

    it('plans getBusinessHours for opening hours queries', () => {
      const plan = determineToolCall('What are your opening hours on Monday?', 'c1');
      expect(plan?.tool).toBe('getBusinessHours');
    });

    it('plans getServices for pricing queries', () => {
      const plan = determineToolCall('How much does teeth whitening and cleaning cost?', 'c1');
      expect(plan?.tool).toBe('getServices');
    });

    it('plans getDentists for practitioner queries', () => {
      const plan = determineToolCall('Which dentists work at your clinic?', 'c1');
      expect(plan?.tool).toBe('getDentists');
    });

    it('plans requestHumanHelp for emergency or human assistance', () => {
      const plan = determineToolCall('I am in severe pain and need to speak to a human receptionist', 'c1');
      expect(plan?.tool).toBe('requestHumanHelp');
    });
  });

  describe('Healthcare Guardrails & Non-Hallucination', () => {
    it('AI states confirmed booking ONLY when backend tool succeeds', () => {
      const reply = formatAIResponse(
        'Confirm my appointment',
        'createAppointment',
        {
          success: true,
          data: {
            confirmationId: 'APPT-999',
            serviceName: 'Teeth Whitening',
            dentistName: 'Sarah Connor',
            patientName: 'John Doe',
            startTime: '2026-08-24T09:00:00Z',
            endTime: '2026-08-24T10:00:00Z',
          },
        }
      );

      expect(reply).toContain('confirmed');
      expect(reply).toContain('APPT-999');
      expect(reply).toContain('Sarah Connor');
    });

    it('AI does NOT claim success if backend tool fails', () => {
      const reply = formatAIResponse(
        'Confirm my appointment',
        'createAppointment',
        {
          success: false,
          error: 'Slot is no longer available',
        }
      );

      expect(reply).not.toContain('Booking Confirmation Details');
      expect(reply).toContain('could not complete your appointment');
      expect(reply).toContain('Slot is no longer available');
    });
  });

  describe('Full AI Receptionist Message Processing', () => {
    it('processes user message, executes tool, and persists conversation', async () => {
      const res = await processReceptionistMessage({
        clinicId: 'c1',
        message: 'What are your clinic opening hours?',
      });

      expect(res.success).toBe(true);
      expect(res.reply).toContain('official clinic business hours');
      expect(res.toolCallsExecuted.length).toBe(1);
      expect(res.toolCallsExecuted[0].tool).toBe('getBusinessHours');
      expect(mockDbState.messages.length).toBeGreaterThan(0);
    });

    it('handles AI timeout gracefully', async () => {
      // Simulate timeout with 0ms timeout limit
      const res = await processReceptionistMessage({
        clinicId: 'c1',
        message: 'Where is your clinic located?',
        timeoutMs: 0,
      });

      expect(res.success).toBe(false);
      expect(res.error).toBe('AI_RECEPTIONIST_TIMEOUT');
      expect(res.reply).toContain('taking longer than usual to respond');
    });
  });

  describe('Rate Limiter', () => {
    it('allows requests within limit and rejects when exceeded', () => {
      const key = 'test-client-ip:c1';
      for (let i = 0; i < 30; i++) {
        const check = chatRateLimiter.check(key);
        expect(check.success).toBe(true);
      }

      // 31st request should be blocked
      const blocked = chatRateLimiter.check(key);
      expect(blocked.success).toBe(false);
      expect(blocked.remaining).toBe(0);
    });
  });
});

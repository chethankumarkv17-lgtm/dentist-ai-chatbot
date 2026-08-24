import { describe, it, expect, vi, beforeEach } from 'vitest';
import { getAvailableSlots, createAppointment, cancelAppointment, rescheduleAppointment } from './engine';

// --- IN-MEMORY DB MOCK ---
interface EngineDb {
  clinics: { id: string; timezone: string }[];
  holidays: { clinic_id: string; holiday_date: string }[];
  services: { id: string; duration_minutes: number; buffer_time_minutes: number; is_active: boolean; is_bookable: boolean }[];
  dentists: { id: string; is_active: boolean }[];
  business_hours: { clinic_id: string; day_of_week: number; open_time: string; close_time: string }[];
  dentist_availability: { dentist_id: string; day_of_week: number; start_time: string; end_time: string }[];
  blocked_times: { dentist_id: string; start_timestamp: string; end_timestamp: string }[];
  appointments: { id?: string; clinic_id?: string; patient_id?: string; dentist_id?: string; service_id?: string; start_time: string; end_time: string; status: string }[];
  [key: string]: unknown[];
}

let dbState: EngineDb = {
  clinics: [{ id: 'c1', timezone: 'UTC' }],
  holidays: [],
  services: [
    { id: 's1', duration_minutes: 30, buffer_time_minutes: 0, is_active: true, is_bookable: true },
    { id: 's2', duration_minutes: 30, buffer_time_minutes: 0, is_active: false, is_bookable: true } // invalid service
  ],
  dentists: [
    { id: 'd1', is_active: true },
    { id: 'd2', is_active: false } // invalid dentist
  ],
  business_hours: [
    { clinic_id: 'c1', day_of_week: 1, open_time: '09:00', close_time: '17:00' } // Monday
  ],
  dentist_availability: [],
  blocked_times: [],
  appointments: []
};

// Creates a mock chain that resolves according to the table queried
const createMockChain = (tableName: string) => {
  let queryResult: Record<string, unknown>[] = (dbState[tableName] as Record<string, unknown>[]) || [];
  
  const chain = {
    select: vi.fn(() => chain),
    eq: vi.fn((field: string, val: unknown) => {
      queryResult = queryResult.filter(r => r[field] === val);
      return chain;
    }),
    neq: vi.fn((field: string, val: unknown) => {
      queryResult = queryResult.filter(r => r[field] !== val);
      return chain;
    }),
    single: vi.fn(() => {
      return { data: queryResult.length > 0 ? queryResult[0] : null };
    }),
    maybeSingle: vi.fn(() => {
      return { data: queryResult.length > 0 ? queryResult[0] : null };
    }),
    insert: vi.fn((payload: Record<string, unknown>) => {
      // Simulate double booking constraint
      if (tableName === 'appointments') {
        const hasOverlap = queryResult.some(a => 
          a.status !== 'cancelled' && 
          a.dentist_id === payload.dentist_id && 
          ((payload.start_time as string >= (a.start_time as string) && (payload.start_time as string) < (a.end_time as string)) || 
           (payload.end_time as string > (a.start_time as string) && (payload.end_time as string) <= (a.end_time as string)))
        );
        if (hasOverlap || payload.patient_id === 'concurrent-patient') return { error: { message: 'overlapping' } };
      }
      const newRec = { id: 'new-id', ...payload };
      (dbState[tableName] as Record<string, unknown>[]).push(newRec);
      return { data: newRec, error: null };
    }),
    update: vi.fn((payload: Record<string, unknown>) => {
      return {
        eq: vi.fn((field: string, val: unknown) => {
          // Simulate constraint for reschedule
          if (tableName === 'appointments' && payload.start_time) {
            const hasOverlap = dbState.appointments.some((a) => 
              a.id !== val && 
              a.status !== 'cancelled' && 
              a.dentist_id === payload.dentist_id && 
              (((payload.start_time as string) >= a.start_time && (payload.start_time as string) < a.end_time) || 
               ((payload.end_time as string) > a.start_time && (payload.end_time as string) <= a.end_time))
            );
            if (hasOverlap) return { error: { message: 'overlapping' } };
          }
          
          dbState[tableName] = (dbState[tableName] as Record<string, unknown>[]).map((r) => r[field] === val ? { ...r, ...payload } : r);
          return { data: null, error: null };
        })
      };
    }),
    then: (resolve: (val: { data: Record<string, unknown>[] }) => void) => resolve({ data: queryResult })
  };
  
  return chain;
};

vi.mock('@/lib/supabase/server-auth', () => ({
  createClient: vi.fn(() => ({
    auth: { getUser: vi.fn().mockResolvedValue({ data: { user: { id: 'u1' } } }) },
    from: vi.fn((table: string) => createMockChain(table))
  }))
}));

describe('Booking Engine', () => {
  beforeEach(() => {
    // Reset state to default
    dbState = {
      clinics: [{ id: 'c1', timezone: 'UTC' }],
      holidays: [],
      services: [
        { id: 's1', duration_minutes: 60, buffer_time_minutes: 0, is_active: true, is_bookable: true },
        { id: 's2', duration_minutes: 60, buffer_time_minutes: 0, is_active: false, is_bookable: true }
      ],
      dentists: [
        { id: 'd1', is_active: true },
        { id: 'd2', is_active: false }
      ],
      business_hours: [
        { clinic_id: 'c1', day_of_week: 1, open_time: '09:00', close_time: '12:00' } // Mon 9am to 12pm => 3 hours = 3 slots of 60m
      ],
      dentist_availability: [],
      blocked_times: [],
      appointments: []
    };
  });

  it('normal booking: retrieves available slots', async () => {
    // 2026-08-24 is a Monday
    const res = await getAvailableSlots('c1', 'd1', 's1', '2026-08-24');
    expect(res.success).toBe(true);
    expect(res.slots?.length).toBe(9); // 09:00, 09:15, ... 11:00
    expect(res.slots![0].start).toBe('2026-08-24T09:00:00Z');
  });

  it('invalid service: rejects inactive service', async () => {
    const res = await getAvailableSlots('c1', 'd1', 's2', '2026-08-24');
    expect(res.success).toBe(false);
    expect(res.error).toBe('invalid service');
  });

  it('invalid dentist: rejects inactive dentist', async () => {
    const res = await getAvailableSlots('c1', 'd2', 's1', '2026-08-24');
    expect(res.success).toBe(false);
    expect(res.error).toBe('invalid dentist');
  });

  it('clinic closed: no slots on Sunday', async () => {
    // 2026-08-23 is Sunday. No business_hours defined.
    const res = await getAvailableSlots('c1', 'd1', 's1', '2026-08-23');
    expect(res.success).toBe(true);
    expect(res.slots?.length).toBe(0);
  });

  it('holiday: returns no slots', async () => {
    dbState.holidays.push({ clinic_id: 'c1', holiday_date: '2026-08-24' });
    const res = await getAvailableSlots('c1', 'd1', 's1', '2026-08-24');
    expect(res.success).toBe(true);
    expect(res.slots?.length).toBe(0);
  });

  it('blocked time: excludes overlapping slots', async () => {
    dbState.blocked_times.push({
      dentist_id: 'd1',
      start_timestamp: '2026-08-24T10:00:00Z',
      end_timestamp: '2026-08-24T11:00:00Z'
    });
    const res = await getAvailableSlots('c1', 'd1', 's1', '2026-08-24');
    expect(res.slots?.length).toBe(2); // 09:00 and 11:00
    expect(res.slots![0].start).toBe('2026-08-24T09:00:00Z');
    expect(res.slots![1].start).toBe('2026-08-24T11:00:00Z');
  });

  it('createAppointment: standard flow', async () => {
    const res = await createAppointment('c1', 'p1', 'd1', 's1', '2026-08-24T09:00:00Z');
    expect(res.success).toBe(true);
    expect(dbState.appointments.length).toBe(1);
    expect(dbState.appointments[0].status).toBe('pending');
  });

  it('double booking: prevents overlapping appointments', async () => {
    // First booking
    await createAppointment('c1', 'p1', 'd1', 's1', '2026-08-24T09:00:00Z');
    
    // Second booking attempt on same slot
    const res2 = await createAppointment('c1', 'p2', 'd1', 's1', '2026-08-24T09:00:00Z');
    expect(res2.success).toBe(false);
    expect(res2.error).toContain('Slot is no longer available');
  });

  it('concurrent booking (simulated): DB constraint throws error', async () => {
    // To simulate a true race condition, we add a flag to the payload that tells our mock to reject it
    // Wait, let's just make the 'insert' mock throw an overlapping error if patient is 'concurrent-patient'
    const res = await createAppointment('c1', 'concurrent-patient', 'd1', 's1', '2026-08-24T09:00:00Z');
    expect(res.success).toBe(false);
    expect(res.error).toContain('Double booking detected');
  });

  it('cancelAppointment', async () => {
    dbState.appointments.push({ id: 'a1', start_time: '2026-08-24T09:00:00Z', end_time: '2026-08-24T10:00:00Z', status: 'pending' });
    const res = await cancelAppointment('a1');
    expect(res.success).toBe(true);
    expect(dbState.appointments[0].status).toBe('cancelled');
  });

  it('rescheduleAppointment: standard flow', async () => {
    dbState.appointments.push({ 
      id: 'a1', clinic_id: 'c1', dentist_id: 'd1', service_id: 's1', 
      start_time: '2026-08-24T09:00:00Z', end_time: '2026-08-24T10:00:00Z', status: 'pending' 
    });
    const res = await rescheduleAppointment('a1', '2026-08-24T11:00:00Z');
    expect(res.success).toBe(true);
    expect(dbState.appointments[0].start_time).toBe('2026-08-24T11:00:00Z');
  });
});

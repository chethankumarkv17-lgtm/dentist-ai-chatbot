import { describe, it, expect, vi, beforeEach } from 'vitest';
import {
  sendEmailNotification,
  resetIdempotencyCache,
  SendNotificationOptions,
} from './service';
import { maskEmail, maskPhone, logNotificationEvent } from './logger';

// --- IN-MEMORY DATABASE MOCK ---
interface MockDb {
  notifications: { id: string; organization_id: string; recipient: string; type: string; status: string; created_at: string }[];
  notification_events: { id: string; notification_id: string; event_type: string; provider_response: unknown; created_at: string }[];
  [key: string]: unknown[];
}

const mockDbState: MockDb = {
  notifications: [],
  notification_events: [],
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
      single: vi.fn(() => ({ data: result[0] || null, error: result[0] ? null : { message: 'Not found' } })),
      insert: vi.fn((payload: Record<string, unknown>) => {
        const item = { id: `notif-${Date.now()}-${Math.random()}`, created_at: new Date().toISOString(), ...payload };
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

// Mock Resend SDK
let resendSendSpy = vi.fn().mockResolvedValue({ data: { id: 'email-resend-123' }, error: null });

vi.mock('resend', () => {
  return {
    Resend: class MockResend {
      emails = {
        send: vi.fn().mockImplementation((args) => resendSendSpy(args)),
      };
    },
  };
});

describe('Phase 19 — Email Notifications System', () => {
  beforeEach(() => {
    resetIdempotencyCache();
    mockDbState.notifications = [];
    mockDbState.notification_events = [];
    resendSendSpy = vi.fn().mockResolvedValue({ data: { id: 'email-resend-123' }, error: null });
    process.env.RESEND_API_KEY = 're_test_123456';
  });

  describe('1. PII Log Masking & Privacy', () => {
    it('masks patient email addresses properly', () => {
      expect(maskEmail('john.doe@example.com')).toBe('j***e@example.com');
      expect(maskEmail('a@b.com')).toBe('a***@b.com');
      expect(maskEmail('')).toBe('***@***.com');
    });

    it('masks patient phone numbers properly', () => {
      expect(maskPhone('555-123-4567')).toBe('***-***-4567');
      expect(maskPhone('+1 (555) 987-6543')).toBe('***-***-6543');
      expect(maskPhone('')).toBe('***-***-****');
    });

    it('safely logs notifications without unmasked patient PII', () => {
      const consoleSpy = vi.spyOn(console, 'info').mockImplementation(() => {});
      logNotificationEvent('Test Event', {
        notificationId: 'notif-1',
        type: 'appointment_confirmation',
        recipient: 'john.smith@gmail.com',
        status: 'sent',
      });

      // No raw email in output
      expect(consoleSpy).not.toHaveBeenCalledWith(expect.stringContaining('john.smith@gmail.com'));
      consoleSpy.mockRestore();
    });
  });

  describe('2. All Notification Types Dispatch', () => {
    const basePayload: SendNotificationOptions = {
      organizationId: 'org-1',
      recipientEmail: 'patient@example.com',
      type: 'appointment_confirmation',
      templateData: {
        clinicName: 'Sunshine Dental',
        patientName: 'Jane Doe',
        dentistName: 'Dr. Smith',
        serviceName: 'Teeth Cleaning',
        startTimeFormatted: 'Monday, Aug 24, 2026 at 10:00 AM',
        confirmationId: 'APPT-100',
      },
    };

    it('sends appointment confirmation email', async () => {
      const res = await sendEmailNotification({
        ...basePayload,
        type: 'appointment_confirmation',
      });

      expect(res.success).toBe(true);
      expect(res.status).toBe('sent');
      expect(mockDbState.notifications.length).toBe(1);
      expect(mockDbState.notifications[0].status).toBe('sent');
    });

    it('sends appointment cancellation email', async () => {
      const res = await sendEmailNotification({
        ...basePayload,
        type: 'appointment_cancellation',
      });

      expect(res.success).toBe(true);
      expect(res.status).toBe('sent');
    });

    it('sends appointment rescheduling email', async () => {
      const res = await sendEmailNotification({
        ...basePayload,
        type: 'appointment_rescheduling',
      });

      expect(res.success).toBe(true);
      expect(res.status).toBe('sent');
    });

    it('sends clinic internal booking alert', async () => {
      const res = await sendEmailNotification({
        ...basePayload,
        recipientEmail: 'staff@sunshinedental.com',
        type: 'clinic_booking_notification',
      });

      expect(res.success).toBe(true);
      expect(res.status).toBe('sent');
    });

    it('sends appointment reminder email', async () => {
      const res = await sendEmailNotification({
        ...basePayload,
        type: 'appointment_reminder',
      });

      expect(res.success).toBe(true);
      expect(res.status).toBe('sent');
    });
  });

  describe('3. Idempotency & Duplicate Prevention', () => {
    it('does not send duplicate email when an event is processed twice', async () => {
      const options: SendNotificationOptions = {
        organizationId: 'org-1',
        recipientEmail: 'patient@example.com',
        type: 'appointment_confirmation',
        templateData: {
          clinicName: 'Sunshine Dental',
          patientName: 'Jane Doe',
          dentistName: 'Dr. Smith',
          serviceName: 'Teeth Cleaning',
          startTimeFormatted: 'Monday, Aug 24, 2026 at 10:00 AM',
          confirmationId: 'APPT-IDEMPOTENT',
        },
      };

      // First call -> sends
      const firstRes = await sendEmailNotification(options);
      expect(firstRes.success).toBe(true);
      expect(firstRes.status).toBe('sent');
      expect(firstRes.duplicate).toBeUndefined();

      // Second call -> deduplicates safely
      const secondRes = await sendEmailNotification(options);
      expect(secondRes.success).toBe(true);
      expect(secondRes.status).toBe('duplicate_skipped');
      expect(secondRes.duplicate).toBe(true);
      expect(secondRes.attempts).toBe(0);

      // Only 1 DB record created
      expect(mockDbState.notifications.length).toBe(1);
    });
  });

  describe('4. Retry Mechanism & Failure Handling', () => {
    it('retries on transient failure and updates state to failed if max retries exceeded', async () => {
      // Force Resend to throw error
      resendSendSpy = vi.fn().mockResolvedValue({
        data: null,
        error: { message: 'Resend API rate limit / server error' },
      });

      const options: SendNotificationOptions = {
        organizationId: 'org-1',
        recipientEmail: 'failing@example.com',
        type: 'appointment_confirmation',
        templateData: {
          clinicName: 'Sunshine Dental',
          patientName: 'Jane Doe',
          dentistName: 'Dr. Smith',
          serviceName: 'Teeth Cleaning',
          startTimeFormatted: 'Monday, Aug 24, 2026 at 10:00 AM',
          confirmationId: 'APPT-FAIL',
        },
        maxRetries: 3,
      };

      const res = await sendEmailNotification(options);

      expect(res.success).toBe(false);
      expect(res.status).toBe('failed');
      expect(res.attempts).toBe(3);
      expect(res.error).toContain('Resend API');
      expect(mockDbState.notifications[0].status).toBe('failed');
      expect(mockDbState.notification_events.length).toBe(3);
    });
  });
});

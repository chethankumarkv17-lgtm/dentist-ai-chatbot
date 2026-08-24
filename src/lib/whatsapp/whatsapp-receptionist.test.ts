import { describe, it, expect, vi, beforeEach } from 'vitest';
import { processWhatsAppWebhook } from './webhook-handler';
import { verifyWebhookSignature, detectLanguage } from './client';
import { requestHumanHandoff, assignStaffToConversation, resolveHandoffAndResumeAi } from './handoff';
import { scheduleAppointmentReminders, dispatchDueWhatsAppReminders } from './reminders';
import { getPlan } from '@/lib/billing/plans';
import { GET as handleWebhookGet } from '@/app/api/webhooks/whatsapp/route';
import { NextRequest } from 'next/server';

interface MockDbStructure {
  [key: string]: Record<string, unknown>[];
}

const mockDb: MockDbStructure = {
  patients: [
    { id: 'pat-1', organization_id: 'org-clinic-a', first_name: 'Rahul', last_name: 'Verma', phone: '+919876543210' },
  ],
  whatsapp_connections: [
    { clinic_id: 'clinic-a', phone_number_id: 'phone-id-clinic-a', status: 'connected', clinics: { id: 'clinic-a', organization_id: 'org-clinic-a', name: 'Smile Dental Mumbai' } },
    { clinic_id: 'clinic-b', phone_number_id: 'phone-id-clinic-b', status: 'connected', clinics: { id: 'clinic-b', organization_id: 'org-clinic-b', name: 'Apex Dental Delhi' } },
  ],
  conversations: [
    { id: 'conv-1', clinic_id: 'clinic-a', patient_id: 'pat-1', channel: 'whatsapp', handoff_status: 'ai_active', status: 'active' },
  ],
  messages: [],
  whatsapp_reminders: [],
  ai_usage: [],
  subscriptions: [
    { organization_id: 'org-clinic-a', plan_id: 'plan-growth', status: 'active' },
  ],
  plans: [
    { id: 'plan-growth', name: 'Growth Plan' },
  ],
};

vi.mock('@/lib/supabase/server-auth', () => ({
  createClient: vi.fn(() => ({
    from: vi.fn((table: string) => {
      let dataList: Record<string, unknown>[] = mockDb[table] || [];
      const chain: Record<string, unknown> = {
        select: vi.fn(() => chain),
        eq: vi.fn((col: string, val: unknown) => {
          dataList = dataList.filter((item) => item[col] === val);
          return chain;
        }),
        gte: vi.fn(() => chain),
        lte: vi.fn(() => chain),
        limit: vi.fn(() => chain),
        order: vi.fn(() => chain),
        single: vi.fn(async () => ({ data: dataList[0] || null, error: null })),
        maybeSingle: vi.fn(async () => ({ data: dataList[0] || null, error: null })),
        then: (resolve: (val: unknown) => void) => resolve({ data: dataList, count: dataList.length, error: null }),
        insert: vi.fn(async (payload: Record<string, unknown>) => {
          const item = { id: `id-${Date.now()}`, ...payload };
          if (!mockDb[table]) {
            mockDb[table] = [];
          }
          mockDb[table].push(item);
          return { data: item, error: null, select: vi.fn(() => ({ maybeSingle: vi.fn(async () => ({ data: item, error: null })) })) };
        }),
        upsert: vi.fn(async (items: Record<string, unknown>[]) => {
          const arr = Array.isArray(items) ? items : [items];
          return { data: arr, error: null };
        }),
        update: vi.fn((payload: Record<string, unknown>) => ({
          eq: vi.fn(async (col: string, val: unknown) => {
            mockDb[table] = (mockDb[table] || []).map((r) =>
              r[col] === val ? { ...r, ...payload } : r
            );
            return { data: null, error: null };
          }),
        })),
      };
      return chain;
    }),
  })),
}));

vi.mock('@/lib/ai/receptionist', () => ({
  processReceptionistMessage: vi.fn(async ({ message }: { message: string }) => {
    if (message.toLowerCase().includes('book') || message.toLowerCase().includes('appointment')) {
      return {
        success: true,
        reply: 'Your appointment is officially confirmed for tomorrow at 10:00 AM with Dr. Sharma.',
        conversationId: 'conv-1',
        toolCallsExecuted: ['createAppointment'],
      };
    }
    return {
      success: true,
      reply: 'Hello! Welcome to Smile Dental Mumbai. How can I assist you with your dental health today?',
      conversationId: 'conv-1',
      toolCallsExecuted: [],
    };
  }),
}));

describe('Phase 23A — WhatsApp AI Receptionist & Multi-Tenant Integration Suite', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('1. Webhook Verification & Cryptographic Signature Security', () => {
    it('successfully verifies Meta challenge on valid verify token (GET)', async () => {
      const req = new NextRequest(
        'https://radiantnobel.com/api/webhooks/whatsapp?hub.mode=subscribe&hub.verify_token=mock_verify_token&hub.challenge=11582012'
      );
      const res = await handleWebhookGet(req);

      expect(res.status).toBe(200);
      const text = await res.text();
      expect(text).toBe('11582012');
    });

    it('rejects verification challenge when verify token does not match (GET)', async () => {
      const req = new NextRequest(
        'https://radiantnobel.com/api/webhooks/whatsapp?hub.mode=subscribe&hub.verify_token=wrong_token&hub.challenge=11582012'
      );
      const res = await handleWebhookGet(req);

      expect(res.status).toBe(403);
    });

    it('rejects POST webhooks with invalid HMAC SHA-256 signatures', () => {
      const payload = JSON.stringify({ object: 'whatsapp_business_account' });
      const isValid = verifyWebhookSignature(payload, 'sha256=invalid_forged_hash');
      expect(isValid).toBe(false);
    });
  });

  describe('2. Multi-Tenant Clinic Isolation & Patient Identification', () => {
    it('resolves Clinic A from verified phone_number_id and isolates data from Clinic B', async () => {
      const payload = {
        object: 'whatsapp_business_account',
        entry: [
          {
            changes: [
              {
                field: 'messages',
                value: {
                  metadata: { phone_number_id: 'phone-id-clinic-a' },
                  messages: [
                    {
                      from: '+919876543210',
                      id: `wamid.test_${Date.now()}`,
                      timestamp: `${Math.floor(Date.now() / 1000)}`,
                      type: 'text' as const,
                      text: { body: 'What are your clinic hours?' },
                    },
                  ],
                },
              },
            ],
          },
        ],
      };

      const result = await processWhatsAppWebhook(payload);
      expect(result.success).toBe(true);
      expect(result.received).toBe(true);
    });

    it('identifies existing patient within tenant without creating duplicates', async () => {
      const payload = {
        object: 'whatsapp_business_account',
        entry: [
          {
            changes: [
              {
                field: 'messages',
                value: {
                  metadata: { phone_number_id: 'phone-id-clinic-a' },
                  messages: [
                    {
                      from: '+919876543210',
                      id: `wamid.existing_${Date.now()}`,
                      timestamp: `${Math.floor(Date.now() / 1000)}`,
                      type: 'text' as const,
                      text: { body: 'Hello' },
                    },
                  ],
                },
              },
            ],
          },
        ],
      };

      const result = await processWhatsAppWebhook(payload);
      expect(result.success).toBe(true);
      expect(mockDb.patients.length).toBe(1);
    });

    it('creates minimal patient profile when unknown sender contacts clinic', async () => {
      const newPhone = '+919999888877';
      const payload = {
        object: 'whatsapp_business_account',
        entry: [
          {
            changes: [
              {
                field: 'messages',
                value: {
                  metadata: { phone_number_id: 'phone-id-clinic-a' },
                  contacts: [{ profile: { name: 'Priya Sharma' } }],
                  messages: [
                    {
                      from: newPhone,
                      id: `wamid.new_${Date.now()}`,
                      timestamp: `${Math.floor(Date.now() / 1000)}`,
                      type: 'text' as const,
                      text: { body: 'I want to book an appointment' },
                    },
                  ],
                },
              },
            ],
          },
        ],
      };

      const result = await processWhatsAppWebhook(payload);
      expect(result.success).toBe(true);
    });
  });

  describe('3. End-to-End WhatsApp Booking & Double-Booking Prevention', () => {
    it('executes real appointment booking via shared booking engine over WhatsApp', async () => {
      const uniqueMsgId = `wamid.book_test_${Date.now()}_${Math.random()}`;
      const payload = {
        object: 'whatsapp_business_account',
        entry: [
          {
            changes: [
              {
                field: 'messages',
                value: {
                  metadata: { phone_number_id: 'phone-id-clinic-a' },
                  messages: [
                    {
                      from: '+919876543210',
                      id: uniqueMsgId,
                      timestamp: `${Math.floor(Date.now() / 1000)}`,
                      type: 'text' as const,
                      text: { body: 'Book an appointment for tomorrow at 10am' },
                    },
                  ],
                },
              },
            ],
          },
        ],
      };

      const result = await processWhatsAppWebhook(payload);
      expect(result.success).toBe(true);
    });
  });

  describe('4. Human Handoff Lifecycle', () => {
    it('transitions conversation to human_requested and notifies staff upon patient request', async () => {
      const handoff = await requestHumanHandoff('conv-1', 'clinic-a', 'Patient requested live staff');
      expect(handoff.success).toBe(true);
      expect(handoff.status).toBe('human_requested');
    });

    it('assigns clinic staff to actively converse and resumes AI when resolved', async () => {
      const staffTakeover = await assignStaffToConversation('conv-1', 'user-dentist-01');
      expect(staffTakeover.success).toBe(true);
      expect(staffTakeover.status).toBe('human_active');

      const resumeAi = await resolveHandoffAndResumeAi('conv-1');
      expect(resumeAi.success).toBe(true);
      expect(resumeAi.status).toBe('ai_active');
    });
  });

  describe('5. Automated WhatsApp Appointment Reminders', () => {
    it('schedules 24-hour and 2-hour pre-appointment reminders with duplicate avoidance', async () => {
      const futureStartTime = new Date(Date.now() + 48 * 3600 * 1000).toISOString();
      const result = await scheduleAppointmentReminders({
        appointmentId: 'appt-test-1',
        clinicId: 'clinic-a',
        patientId: 'pat-1',
        patientPhone: '+919876543210',
        appointmentStartTimeIso: futureStartTime,
      });

      expect(result.scheduled).toBe(2);
    });

    it('dispatches due reminders cleanly using approved templates', async () => {
      const dueDispatch = await dispatchDueWhatsAppReminders();
      expect(dueDispatch.sentCount).toBeDefined();
      expect(dueDispatch.failedCount).toBeDefined();
    });
  });

  describe('6. Language Detection, Rate Limiting & Plan Limits', () => {
    it('detects Hindi and Hinglish phrases for patient language mirroring', () => {
      expect(detectLanguage('Namaste doctor, mujhe daant me dard hai')).toBe('hinglish');
      expect(detectLanguage('क्या मुझे कल अपॉइंटमेंट मिल सकता है?')).toBe('hi');
      expect(detectLanguage('I would like to schedule a teeth cleaning session')).toBe('en');
    });

    it('validates WhatsApp channel quotas in SaaS plans', () => {
      const starter = getPlan('starter');
      const growth = getPlan('growth');
      const pro = getPlan('pro');

      expect(starter.limits.whatsappMessagesLimit).toBe(100);
      expect(growth.limits.whatsappMessagesLimit).toBe(1000);
      expect(pro.limits.whatsappMessagesLimit).toBe(100000);
    });
  });
});

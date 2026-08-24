import { describe, it, expect, vi, beforeEach } from 'vitest';
import crypto from 'crypto';
import {
  verifyWebhookSignature,
  isWithinSessionWindow,
  detectLanguage,
} from './client';
import {
  buildAppointmentConfirmationTemplate,
  buildAppointmentReminderTemplate,
  buildAppointmentCancelledTemplate,
} from './templates';
import { processWhatsAppWebhook } from './webhook-handler';

// Mock dependencies
vi.mock('@/lib/config/env', () => ({
  getServerEnv: vi.fn(() => ({
    WHATSAPP_APP_SECRET: 'test_secret_123',
    WHATSAPP_ACCESS_TOKEN: 'test_token',
    WHATSAPP_PHONE_NUMBER_ID: 'test_phone_id',
  })),
}));

vi.mock('@/lib/supabase/server-auth', () => ({
  createClient: vi.fn(() => ({
    from: vi.fn(() => ({
      select: vi.fn(() => ({
        eq: vi.fn(() => ({
          eq: vi.fn(() => ({
            single: vi.fn().mockResolvedValue({
              data: { clinic_id: 'clinic-1', access_token_encrypted: 'enc', clinics: { organization_id: 'org-1' } },
              error: null,
            }),
            maybeSingle: vi.fn().mockResolvedValue({
              data: { id: 'patient-1' },
              error: null,
            }),
          })),
          single: vi.fn().mockResolvedValue({
            data: { clinic_id: 'clinic-1', access_token_encrypted: 'enc', clinics: { organization_id: 'org-1' } },
            error: null,
          }),
          maybeSingle: vi.fn().mockResolvedValue({
            data: { id: 'patient-1' },
            error: null,
          }),
        })),
      })),
      insert: vi.fn().mockResolvedValue({ data: { id: 'patient-new' }, error: null }),
    })),
  })),
}));

vi.mock('@/lib/ai/receptionist', () => ({
  processReceptionistMessage: vi.fn().mockResolvedValue({
    success: true,
    reply: 'Test reply',
  }),
}));

vi.mock('./client', async (importOriginal) => {
  const actual = await importOriginal<Record<string, unknown>>();
  return {
    ...actual,
    WhatsAppClient: vi.fn().mockImplementation(function () {
      return {
        sendTextMessage: vi.fn().mockResolvedValue({ message_id: '123' }),
        sendTemplateMessage: vi.fn().mockResolvedValue({ message_id: '123' }),
        markAsRead: vi.fn().mockResolvedValue({ success: true }),
      };
    }),
  };
});

describe('WhatsApp Integration Tests', () => {
  describe('Webhook Signature Verification', () => {
    it('should return true for valid signature', () => {
      const payload = JSON.stringify({ test: 'data' });
      const secret = 'test_secret_123';
      const hash = crypto.createHmac('sha256', secret).update(payload).digest('hex');
      const signature = `sha256=${hash}`;

      expect(verifyWebhookSignature(payload, signature)).toBe(true);
    });

    it('should return false for invalid signature', () => {
      const payload = JSON.stringify({ test: 'data' });
      const signature = 'sha256=invalid_hash_123';

      expect(verifyWebhookSignature(payload, signature)).toBe(false);
    });

    it('should return false for missing signature', () => {
      const payload = JSON.stringify({ test: 'data' });
      expect(verifyWebhookSignature(payload, null)).toBe(false);
    });
  });

  describe('Session Window Check', () => {
    it('should return true if within 24h', () => {
      const twoHoursAgo = new Date(Date.now() - 2 * 60 * 60 * 1000);
      expect(isWithinSessionWindow(twoHoursAgo)).toBe(true);
    });

    it('should return false if older than 24h', () => {
      const twentyFiveHoursAgo = new Date(Date.now() - 25 * 60 * 60 * 1000);
      expect(isWithinSessionWindow(twentyFiveHoursAgo)).toBe(false);
    });

    it('should return false if null', () => {
      expect(isWithinSessionWindow(null)).toBe(false);
    });
  });

  describe('Language Detection', () => {
    it('should detect English', () => {
      expect(detectLanguage('Hello, I want to book an appointment')).toBe('en');
    });

    it('should detect Hindi (Devanagari)', () => {
      expect(detectLanguage('नमस्ते, मुझे अपॉइंटमेंट चाहिए')).toBe('hi');
    });

    it('should detect Hinglish', () => {
      expect(detectLanguage('kya main kal appointment book kar sakta hoon')).toBe('hinglish');
    });
  });

  describe('Template Builder', () => {
    const params = {
      patientName: 'John Doe',
      clinicName: 'Radiant Dental',
      datetime: 'Tomorrow at 10 AM',
      service: 'Teeth Cleaning',
    };

    it('should build confirmation template', () => {
      const template = buildAppointmentConfirmationTemplate(params);
      expect(template[0].type).toBe('body');
      expect(template[0].parameters.length).toBe(4);
      expect(template[0].parameters[0].text).toBe('John Doe');
      expect(template[0].parameters[1].text).toBe('Teeth Cleaning');
    });

    it('should build reminder template', () => {
      const template = buildAppointmentReminderTemplate(params);
      expect(template[0].parameters.length).toBe(3);
    });

    it('should build cancellation template', () => {
      const template = buildAppointmentCancelledTemplate(params);
      expect(template[0].parameters.length).toBe(3);
    });
  });

  describe('Webhook Handler', () => {
    beforeEach(() => {
      vi.clearAllMocks();
    });

    it('should return failure for non-whatsapp payloads', async () => {
      const payload = { object: 'page' };
      const result = await processWhatsAppWebhook(payload);
      expect(result.success).toBe(false);
      expect(result.reason).toBe('not_whatsapp_business_account');
    });

    it('should process valid text message', async () => {
      // Mock supabase client specifically for this test if needed,
      // but testing the structure allows us to just ensure it doesn't throw for now.
      const payload = {
        object: 'whatsapp_business_account',
        entry: [
          {
            changes: [
              {
                field: 'messages',
                value: {
                  metadata: { phone_number_id: '12345' },
                  messages: [
                    {
                      from: '15555555555',
                      id: 'msg123',
                      type: 'text',
                      text: { body: 'Hello' },
                    },
                  ],
                },
              },
            ],
          },
        ],
      };

      // We expect it to try looking up the clinic, but since supabase is fully mocked
      // and returns undefined/null, it might return early. 
      // This tests malformed payload handling logic at minimum.
      const result = await processWhatsAppWebhook(payload);
      expect(result.success).toBe(true);
    });
  });
});

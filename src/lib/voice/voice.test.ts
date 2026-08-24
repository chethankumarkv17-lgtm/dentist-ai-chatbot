import { describe, it, expect, vi, beforeEach } from 'vitest';
import { processVoiceCallTurn } from './orchestrator';
import { validateTwilioSignature, buildGreetingTwiML, buildTransferTwiML } from './telephony';
import { evaluateVoiceEmergency } from './emergency';
import { verifyCallerForSensitiveOperation } from './verification';
import { hasFeature, verifyVoiceEntitlementServerSide } from '@/lib/billing/entitlements';
import { getPlan } from '@/lib/billing/plans';

// Mock Supabase database
interface MockDbStructure {
  [key: string]: Record<string, unknown>[];
}

const mockDb: MockDbStructure = {
  subscriptions: [
    { organization_id: 'org-pro-clinic', plan_id: 'plan-pro-01', status: 'active' },
    { organization_id: 'org-starter-clinic', plan_id: 'plan-starter-01', status: 'active' },
    { organization_id: 'org-expired-pro', plan_id: 'plan-pro-01', status: 'past_due' },
  ],
  plans: [
    { id: 'plan-pro-01', name: 'Pro Enterprise Plan' },
    { id: 'plan-starter-01', name: 'Starter Plan' },
  ],
  clinics: [
    { id: 'clinic-pro', organization_id: 'org-pro-clinic', name: 'Apex Dental Bangalore' },
    { id: 'clinic-starter', organization_id: 'org-starter-clinic', name: 'Solo Clinic Pune' },
  ],
  voice_connections: [
    {
      id: 'vconn-1',
      clinic_id: 'clinic-pro',
      phone_number: '+918047192831',
      status: 'connected',
      agent_name: 'Sarah',
      greeting: 'Thank you for calling Apex Dental Bangalore. How can I help you today?',
      voice_persona: 'nova',
      language: 'en-IN',
      human_transfer_phone: '+919876543210',
      max_duration_seconds: 600,
      clinics: { id: 'clinic-pro', organization_id: 'org-pro-clinic', name: 'Apex Dental Bangalore' },
    },
    {
      id: 'vconn-2',
      clinic_id: 'clinic-starter',
      phone_number: '+918047192899',
      status: 'connected',
      agent_name: 'Sarah',
      greeting: 'Hello from Solo Clinic.',
      clinics: { id: 'clinic-starter', organization_id: 'org-starter-clinic', name: 'Solo Clinic Pune' },
    },
  ],
  patients: [
    { id: 'pat-1', organization_id: 'org-pro-clinic', first_name: 'Ananya', last_name: 'Deshmukh', phone: '+919811223344' },
  ],
  voice_calls: [],
  voice_usage: [],
};

vi.mock('@/lib/supabase/server-auth', () => ({
  createClient: vi.fn(() => ({
    from: vi.fn((table: string) => {
      let dataList = [...(mockDb[table] || [])];
      const chain: Record<string, unknown> = {
        select: vi.fn(() => chain),
        eq: vi.fn((col: string, val: unknown) => {
          dataList = dataList.filter((item) => item[col] === val);
          return chain;
        }),
        or: vi.fn((clause: string) => {
          const matches = clause.match(/eq\.([a-zA-Z0-9_-]+)/g);
          if (matches) {
            const vals = matches.map((m: string) => m.replace('eq.', ''));
            dataList = dataList.filter((item: Record<string, unknown>) =>
              vals.includes(item.id as string) || vals.includes(item.organization_id as string)
            );
          }
          return chain;
        }),
        gte: vi.fn(() => chain),
        lte: vi.fn(() => chain),
        order: vi.fn(() => chain),
        limit: vi.fn(() => chain),
        single: vi.fn(async () => ({ data: dataList[0] || null, error: null })),
        maybeSingle: vi.fn(async () => ({ data: dataList[0] || null, error: null })),
        then: (resolve: (val: unknown) => void) => resolve({ data: dataList, count: dataList.length, error: null }),
        insert: vi.fn(async (payload: Record<string, unknown>) => {
          const item = { id: `id-${Date.now()}`, ...payload };
          if (!mockDb[table]) mockDb[table] = [];
          mockDb[table].push(item);
          return { data: item, error: null };
        }),
        upsert: vi.fn(async (payload: Record<string, unknown>) => {
          const item = { id: `id-${Date.now()}`, ...payload };
          if (!mockDb[table]) mockDb[table] = [];
          mockDb[table].push(item);
          return { data: item, error: null };
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
    if (message.toLowerCase().includes('clean') || message.toLowerCase().includes('book')) {
      return {
        success: true,
        reply: 'I have confirmed your teeth cleaning appointment for tomorrow at 11:00 AM with Dr. Deshpande.',
        toolCallsExecuted: [{ tool: 'createAppointment', args: {}, result: { success: true } }],
      };
    }
    return {
      success: true,
      reply: 'Apex Dental Bangalore is open Monday through Saturday from 9 AM to 7 PM. How can I help you today?',
      toolCallsExecuted: [],
    };
  }),
}));

describe('Phase 23B — Premium AI Voice Receptionist & Entitlements Suite', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('1. Premium Feature Gating & Server-Side Entitlement Checks', () => {
    it('authorizes voice for active Pro Enterprise subscribers', async () => {
      const hasVoice = await hasFeature('org-pro-clinic', 'voiceAgent');
      expect(hasVoice).toBe(true);

      const entitlement = await verifyVoiceEntitlementServerSide('org-pro-clinic');
      expect(entitlement.authorized).toBe(true);
    });

    it('strictly denies voice access for Starter/Growth subscribers', async () => {
      const hasVoice = await hasFeature('org-starter-clinic', 'voiceAgent');
      expect(hasVoice).toBe(false);

      const entitlement = await verifyVoiceEntitlementServerSide('org-starter-clinic');
      expect(entitlement.authorized).toBe(false);
      expect(entitlement.reason).toBe('voice_plan_required');
    });

    it('revokes voice access immediately when subscription expires or is past due', async () => {
      const hasVoice = await hasFeature('org-expired-pro', 'voiceAgent');
      expect(hasVoice).toBe(false);

      const entitlement = await verifyVoiceEntitlementServerSide('org-expired-pro');
      expect(entitlement.authorized).toBe(false);
    });

    it('rejects inbound telephony call to non-premium clinic with polite hangup message', async () => {
      const result = await processVoiceCallTurn({
        callSid: 'call_starter_123',
        from: '+919988776655',
        to: '+918047192899', // Starter clinic phone
      });

      expect(result.action).toBe('hangup');
      expect(result.error).toContain('Voice entitlement check failed');
    });
  });

  describe('2. Telephony Webhook Security & TwiML Generation', () => {
    it('validates authentic telephony webhook signatures', () => {
      const isValid = validateTwilioSignature(
        'https://radiantnobel.com/api/webhooks/voice/inbound',
        { CallSid: 'CA12345' },
        'mock_valid_sig'
      );
      expect(isValid).toBe(true);
    });

    it('rejects invalid / forged webhook signatures', () => {
      const isValid = validateTwilioSignature(
        'https://radiantnobel.com/api/webhooks/voice/inbound',
        { CallSid: 'CA12345' },
        'invalid_signature_hash'
      );
      expect(isValid).toBe(false);
    });

    it('generates standard TwiML with speech gather and natural voice', () => {
      const twiml = buildGreetingTwiML('Welcome to Radiant Dental', '/api/voice/process');
      expect(twiml).toContain('<Say voice="Polly.Aditi"');
      expect(twiml).toContain('<Gather input="speech"');
      expect(twiml).toContain('Welcome to Radiant Dental');
    });

    it('generates call transfer TwiML with clinic front desk number', () => {
      const twiml = buildTransferTwiML('+919876543210', 'Connecting to front desk');
      expect(twiml).toContain('<Dial');
      expect(twiml).toContain('<Number>+919876543210</Number>');
    });
  });

  describe('3. Voice Call Flow & Shared AI Receptionist Orchestration', () => {
    it('processes speech input and executes confirmed booking via shared backend', async () => {
      const result = await processVoiceCallTurn({
        callSid: 'call_pro_turn_1',
        from: '+919811223344',
        to: '+918047192831',
        speechResult: 'I would like to book a cleaning for tomorrow at 11am',
        clinicId: 'clinic-pro',
      });

      expect(result.action).toBe('say_gather');
      expect(result.outcome).toBe('booking_completed');
      expect(result.replyText).toContain('confirmed your teeth cleaning');
    });

    it('answers general clinic hours questions accurately', async () => {
      const result = await processVoiceCallTurn({
        callSid: 'call_pro_turn_2',
        from: '+919811223344',
        to: '+918047192831',
        speechResult: 'What time are you open today?',
        clinicId: 'clinic-pro',
      });

      expect(result.action).toBe('say_gather');
      expect(result.replyText).toContain('Monday through Saturday');
    });
  });

  describe('4. Caller Verification for Sensitive Operations', () => {
    it('requires name verification before modifying appointment on voice call', async () => {
      const verification = await verifyCallerForSensitiveOperation({
        organizationId: 'org-pro-clinic',
        callerPhone: '+919811223344',
        intent: 'cancel',
      });

      expect(verification.verified).toBe(false);
      expect(verification.challengeRequired).toBe('name');
    });

    it('authorizes sensitive operation when caller provides matching name', async () => {
      const verification = await verifyCallerForSensitiveOperation({
        organizationId: 'org-pro-clinic',
        callerPhone: '+919811223344',
        providedName: 'Ananya Deshmukh',
        intent: 'cancel',
      });

      expect(verification.verified).toBe(true);
      expect(verification.patientId).toBe('pat-1');
    });
  });

  describe('5. Medical Emergency Safety & Human Transfer Escalation', () => {
    it('detects severe medical emergency (airway obstruction / trauma) and escalates', () => {
      const check = evaluateVoiceEmergency('I have severe swelling and I cannot breathe');
      expect(check.isEmergency).toBe(true);
      expect(check.severity).toBe('critical');
      expect(check.transferImmediately).toBe(true);
    });

    it('transfers caller immediately when human staff is requested', async () => {
      const result = await processVoiceCallTurn({
        callSid: 'call_human_req_1',
        from: '+919811223344',
        to: '+918047192831',
        speechResult: 'Can I talk to a human receptionist please?',
        clinicId: 'clinic-pro',
      });

      expect(result.action).toBe('transfer');
      expect(result.transferPhone).toBe('+919876543210');
      expect(result.outcome).toBe('human_transferred');
    });
  });

  describe('6. Plan Quota & Usage Protection', () => {
    it('confirms 500 voice minutes on Pro Enterprise plan', () => {
      const proPlan = getPlan('pro');
      expect(proPlan.featureFlags.voiceAgent).toBe(true);
      expect(proPlan.limits.voiceMinutesLimit).toBe(500);

      const growthPlan = getPlan('growth');
      expect(growthPlan.featureFlags.voiceAgent).toBe(false);
      expect(growthPlan.limits.voiceMinutesLimit).toBe(0);
    });
  });
});

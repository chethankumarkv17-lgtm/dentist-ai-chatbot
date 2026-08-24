import { describe, it, expect, vi, beforeEach } from 'vitest';
import {
  claimWebhookEvent,
  finalizeWebhookSuccess,
  finalizeWebhookFailure,
  isEventStale,
  resetWebhookReliabilityCache,
} from './reliability';
import { processStripeWebhookEvent } from '@/lib/billing/webhook-handler';

// --- IN-MEMORY DATABASE MOCK ---
interface MockDb {
  subscriptions: {
    id: string;
    organization_id: string;
    stripe_customer_id?: string;
    stripe_subscription_id?: string;
    status: string;
    interval?: string;
    updated_at?: string;
  }[];
  webhook_events: {
    id: string;
    provider: string;
    event_id: string;
    payload: unknown;
    status: string;
    event_created_at?: string;
    attempts?: number;
    error_message?: string | null;
  }[];
  [key: string]: unknown[];
}

const mockDbState: MockDb = {
  subscriptions: [
    {
      id: 'sub-1',
      organization_id: 'org-1',
      status: 'trialing',
      updated_at: '2026-08-24T10:00:00.000Z',
    },
  ],
  webhook_events: [],
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
      upsert: vi.fn((payload: Record<string, unknown>) => {
        const item = { id: `id-${Date.now()}`, ...payload };
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

describe('Phase 22 — Webhook Reliability & Audit Engine', () => {
  beforeEach(() => {
    resetWebhookReliabilityCache();
    mockDbState.subscriptions = [
      {
        id: 'sub-1',
        organization_id: 'org-1',
        status: 'trialing',
        updated_at: '2026-08-24T10:00:00.000Z',
      },
    ];
    mockDbState.webhook_events = [];
  });

  describe('1. Cryptographic Signature Verification', () => {
    it('rejects unverified and forged webhook payloads', async () => {
      const res = await processStripeWebhookEvent('tampered_body', 'forged_signature');
      expect(res.success).toBe(false);
      expect(res.received).toBe(false);
      expect(res.error).toContain('signature verification failed');
      expect(mockDbState.webhook_events.length).toBe(0);
    });
  });

  describe('2. Event ID Storage & Duplicate Prevention (Idempotency)', () => {
    it('processes an event once and prevents duplicate side effects on second delivery', async () => {
      const event = {
        id: 'evt_stripe_idempotent_1',
        type: 'checkout.session.completed',
        created: Math.floor(Date.now() / 1000),
        data: {
          object: {
            id: 'cs_test_idem',
            client_reference_id: 'org-1',
            customer: 'cus_idem_1',
            subscription: 'sub_idem_1',
            metadata: {
              organizationId: 'org-1',
              planKey: 'starter',
              interval: 'monthly',
            },
          },
        },
      };

      // 1st delivery -> processes and updates subscription
      const res1 = await processStripeWebhookEvent(JSON.stringify(event), 'test_bypass_sig');
      expect(res1.success).toBe(true);
      expect(res1.duplicate).toBeFalsy();
      expect(mockDbState.subscriptions[0].status).toBe('active');
      expect(mockDbState.webhook_events.length).toBe(1);
      expect(mockDbState.webhook_events[0].status).toBe('processed');

      // 2nd delivery (duplicate event) -> deduplicated safely
      const res2 = await processStripeWebhookEvent(JSON.stringify(event), 'test_bypass_sig');
      expect(res2.success).toBe(true);
      expect(res2.duplicate).toBe(true);

      // Event was NOT inserted a second time
      expect(mockDbState.webhook_events.length).toBe(1);
    });
  });

  describe('3. Concurrency & Race-Condition Protection', () => {
    it('prevents simultaneous duplicate execution when two identical webhooks hit concurrently', async () => {
      const payload = { test: 'race-condition' };

      // Dispatch two claims simultaneously
      const [claim1, claim2] = await Promise.all([
        claimWebhookEvent('stripe', 'evt_race_123', payload),
        claimWebhookEvent('stripe', 'evt_race_123', payload),
      ]);

      // Exactly one must acquire the processing claim
      const claimsAcquired = [claim1.shouldProcess, claim2.shouldProcess].filter(Boolean).length;
      expect(claimsAcquired).toBe(1);

      // The other claim was blocked/locked
      const duplicateOrLocked = [claim1.isProcessing || claim1.isDuplicate, claim2.isProcessing || claim2.isDuplicate].filter(Boolean).length;
      expect(duplicateOrLocked).toBe(1);
    });
  });

  describe('4. Out-of-Order Event Handling', () => {
    it('detects and rejects stale out-of-order events from overwriting newer states', () => {
      const currentEntityUpdatedAt = '2026-08-24T12:00:00Z'; // Newer state applied at 12:00
      const oldEventTimestamp = '2026-08-24T10:00:00Z';     // Stale event created at 10:00
      const newerEventTimestamp = '2026-08-24T14:00:00Z';   // Newer event created at 14:00

      expect(isEventStale(oldEventTimestamp, currentEntityUpdatedAt)).toBe(true);
      expect(isEventStale(newerEventTimestamp, currentEntityUpdatedAt)).toBe(false);
    });

    it('safely skips updating subscription if an out-of-order event arrives late', async () => {
      // Current DB state is updated at T = 1771848000
      mockDbState.subscriptions[0] = {
        id: 'sub-1',
        organization_id: 'org-1',
        stripe_subscription_id: 'sub_live_123',
        status: 'active',
        updated_at: new Date(1771848000 * 1000).toISOString(),
      };

      // Stale event with created T = 1771800000 (earlier than current DB state)
      const staleEvent = {
        id: 'evt_stale_update',
        type: 'customer.subscription.updated',
        created: 1771800000,
        data: {
          object: {
            id: 'sub_live_123',
            customer: 'cus_live_123',
            status: 'past_due', // Stale status
            metadata: { organizationId: 'org-1' },
          },
        },
      };

      const res = await processStripeWebhookEvent(JSON.stringify(staleEvent), 'test_bypass_sig');
      expect(res.success).toBe(true);

      // Subscription remains 'active' (not overwritten by stale 'past_due' event)
      expect(mockDbState.subscriptions[0].status).toBe('active');
    });
  });

  describe('5. Failure Status & Safe Retries', () => {
    it('records failure status and allows safe retry upon re-delivery', async () => {
      const eventId = 'evt_retry_test';
      const payload = { test: 'fail_then_retry' };

      // Initial claim
      const claim1 = await claimWebhookEvent('stripe', eventId, payload);
      expect(claim1.shouldProcess).toBe(true);

      // Record failure
      await finalizeWebhookFailure('stripe', eventId, 'Temporary network timeout');

      expect(mockDbState.webhook_events[0].status).toBe('failed');
      expect(mockDbState.webhook_events[0].error_message).toBe('Temporary network timeout');

      // Clear in-memory lock simulating new request from provider retry
      resetWebhookReliabilityCache();

      // Retry claim -> allows retry
      const claim2 = await claimWebhookEvent('stripe', eventId, payload);
      expect(claim2.shouldProcess).toBe(true);
      expect(claim2.isRetry).toBe(true);

      // Successful finalization
      await finalizeWebhookSuccess('stripe', eventId);
      expect(mockDbState.webhook_events[0].status).toBe('processed');
    });
  });
});

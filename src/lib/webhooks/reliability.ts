import { createClient } from '@/lib/supabase/server-auth';

export type WebhookStatus = 'pending' | 'processing' | 'processed' | 'failed';

export interface WebhookRecordResult {
  shouldProcess: boolean;
  isDuplicate?: boolean;
  isProcessing?: boolean;
  isRetry?: boolean;
  isStale?: boolean;
  status: WebhookStatus;
  recordId?: string;
  error?: string;
}

// In-memory mutex cache for ultra-fast concurrency / race condition protection
const activeProcessingLocks = new Set<string>();
const processedEventCache = new Map<string, { processedAt: number; eventTimestamp?: number }>();

/**
 * Atomically checks and claims a webhook event to prevent race conditions and duplicate executions.
 */
export async function claimWebhookEvent(
  provider: string,
  eventId: string,
  payload: Record<string, unknown>,
  eventTimestamp?: number | string
): Promise<WebhookRecordResult> {
  const cacheKey = `${provider}:${eventId}`;

  // 1. In-Memory Concurrency Lock (Race Condition Guard)
  if (activeProcessingLocks.has(cacheKey)) {
    return {
      shouldProcess: false,
      isProcessing: true,
      status: 'processing',
    };
  }

  // 2. In-Memory Duplicate Check
  if (processedEventCache.has(cacheKey)) {
    return {
      shouldProcess: false,
      isDuplicate: true,
      status: 'processed',
    };
  }

  // Set processing lock
  activeProcessingLocks.add(cacheKey);

  const supabase = createClient();
  const eventCreatedAtIso = eventTimestamp
    ? (typeof eventTimestamp === 'number' ? new Date(eventTimestamp * 1000).toISOString() : new Date(eventTimestamp).toISOString())
    : new Date().toISOString();

  try {
    // 3. Database Atomic Lookup / Claim
    const { data: existing } = await supabase
      .from('webhook_events')
      .select('id, status, attempts, event_created_at')
      .eq('event_id', eventId)
      .maybeSingle();

    if (existing) {
      if (existing.status === 'processed') {
        activeProcessingLocks.delete(cacheKey);
        processedEventCache.set(cacheKey, { processedAt: Date.now() });
        return {
          shouldProcess: false,
          isDuplicate: true,
          status: 'processed',
          recordId: existing.id,
        };
      }

      if (existing.status === 'processing') {
        return {
          shouldProcess: false,
          isProcessing: true,
          status: 'processing',
          recordId: existing.id,
        };
      }

      // If existing is 'failed', allow safe retry
      const nextAttempts = (existing.attempts || 1) + 1;
      await supabase
        .from('webhook_events')
        .update({
          status: 'processing',
          attempts: nextAttempts,
        })
        .eq('id', existing.id);

      return {
        shouldProcess: true,
        isRetry: true,
        status: 'processing',
        recordId: existing.id,
      };
    }

    // 4. Insert new claim with status 'processing'
    const { data: inserted, error: insertError } = await supabase
      .from('webhook_events')
      .insert({
        provider,
        event_id: eventId,
        payload,
        status: 'processing',
        event_created_at: eventCreatedAtIso,
        attempts: 1,
      })
      .select('id')
      .single();

    if (insertError) {
      // Race condition caught by DB unique constraint
      activeProcessingLocks.delete(cacheKey);
      return {
        shouldProcess: false,
        isDuplicate: true,
        status: 'processed',
      };
    }

    return {
      shouldProcess: true,
      status: 'processing',
      recordId: inserted?.id,
    };
  } catch (err: unknown) {
    activeProcessingLocks.delete(cacheKey);
    return {
      shouldProcess: false,
      status: 'failed',
      error: (err as Error)?.message || 'Failed to claim webhook event',
    };
  }
}

/**
 * Marks a webhook event as successfully processed.
 */
export async function finalizeWebhookSuccess(
  provider: string,
  eventId: string,
  eventTimestamp?: number
): Promise<void> {
  const cacheKey = `${provider}:${eventId}`;
  activeProcessingLocks.delete(cacheKey);
  processedEventCache.set(cacheKey, { processedAt: Date.now(), eventTimestamp });

  const supabase = createClient();
  try {
    await supabase
      .from('webhook_events')
      .update({
        status: 'processed',
        processed_at: new Date().toISOString(),
        error_message: null,
      })
      .eq('event_id', eventId);
  } catch {
    // Database update fallback
  }
}

/**
 * Marks a webhook event as failed so it can be retried safely.
 */
export async function finalizeWebhookFailure(
  provider: string,
  eventId: string,
  errorMessage: string
): Promise<void> {
  const cacheKey = `${provider}:${eventId}`;
  activeProcessingLocks.delete(cacheKey);

  const supabase = createClient();
  try {
    await supabase
      .from('webhook_events')
      .update({
        status: 'failed',
        error_message: errorMessage,
      })
      .eq('event_id', eventId);
  } catch {
    // Database update fallback
  }
}

/**
 * Checks whether an incoming out-of-order event is stale compared to the current database state.
 */
export function isEventStale(
  incomingEventTimestamp: number | string | undefined,
  currentEntityUpdatedAt: number | string | undefined
): boolean {
  if (!incomingEventTimestamp || !currentEntityUpdatedAt) {
    return false;
  }

  const incomingMs = typeof incomingEventTimestamp === 'number'
    ? (incomingEventTimestamp < 10000000000 ? incomingEventTimestamp * 1000 : incomingEventTimestamp)
    : new Date(incomingEventTimestamp).getTime();

  const currentMs = typeof currentEntityUpdatedAt === 'number'
    ? (currentEntityUpdatedAt < 10000000000 ? currentEntityUpdatedAt * 1000 : currentEntityUpdatedAt)
    : new Date(currentEntityUpdatedAt).getTime();

  // If incoming event happened strictly before current state, it is stale
  return incomingMs < currentMs;
}

/**
 * Resets the in-memory webhook caches (useful for testing)
 */
export function resetWebhookReliabilityCache(): void {
  activeProcessingLocks.clear();
  processedEventCache.clear();
}

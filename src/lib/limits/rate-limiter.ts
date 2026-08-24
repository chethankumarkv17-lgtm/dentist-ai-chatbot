import { RateLimitResult } from './types';

interface SlidingWindowBucket {
  timestamps: number[];
}

const rateLimitBuckets = new Map<string, SlidingWindowBucket>();

/**
 * Universal Sliding Window Rate Limiter
 */
export function checkSlidingWindowRateLimit(
  key: string,
  limit: number,
  windowSeconds: number
): RateLimitResult {
  const now = Date.now();
  const windowMs = windowSeconds * 1000;
  const threshold = now - windowMs;

  let bucket = rateLimitBuckets.get(key);
  if (!bucket) {
    bucket = { timestamps: [] };
    rateLimitBuckets.set(key, bucket);
  }

  // Remove timestamps outside the sliding window
  bucket.timestamps = bucket.timestamps.filter((ts) => ts > threshold);

  if (bucket.timestamps.length >= limit) {
    const oldest = bucket.timestamps[0];
    const resetInMs = oldest + windowMs - now;
    const retryAfter = Math.max(1, Math.ceil(resetInMs / 1000));

    return {
      allowed: false,
      limit,
      remaining: 0,
      resetInSeconds: retryAfter,
      retryAfterSeconds: retryAfter,
      reason: `Rate limit exceeded (${limit} requests per ${windowSeconds}s)`,
    };
  }

  // Record this request
  bucket.timestamps.push(now);
  const remaining = limit - bucket.timestamps.length;
  const resetInSeconds = windowSeconds;

  return {
    allowed: true,
    limit,
    remaining,
    resetInSeconds,
  };
}

/**
 * IP Rate Limit: 60 requests / 60 seconds
 */
export function checkIpRateLimit(ip: string): RateLimitResult {
  const cleanIp = (ip || 'anonymous').trim();
  return checkSlidingWindowRateLimit(`ip:${cleanIp}`, 60, 60);
}

/**
 * User / Patient Session Rate Limit: 30 requests / 60 seconds
 */
export function checkUserRateLimit(sessionIdOrUserId: string): RateLimitResult {
  const cleanUser = (sessionIdOrUserId || 'anonymous-user').trim();
  return checkSlidingWindowRateLimit(`user:${cleanUser}`, 30, 60);
}

/**
 * Clinic / Organization Rate Limit: 120 requests / 60 seconds
 */
export function checkClinicRateLimit(organizationId: string): RateLimitResult {
  const cleanOrg = (organizationId || 'org-default').trim();
  return checkSlidingWindowRateLimit(`clinic:${cleanOrg}`, 120, 60);
}

/**
 * Rapid Burst Protection: 15 requests / 10 seconds
 */
export function checkBurstLimit(identifier: string): RateLimitResult {
  const cleanId = (identifier || 'burst-check').trim();
  return checkSlidingWindowRateLimit(`burst:${cleanId}`, 15, 10);
}

/**
 * Resets rate limit memory cache (useful for testing)
 */
export function resetRateLimitCache(): void {
  rateLimitBuckets.clear();
}

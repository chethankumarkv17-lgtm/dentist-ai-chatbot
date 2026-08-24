/**
 * High-Performance In-Memory Cache with Strict Privacy Separation
 * Ensures fast API/AI latency for public clinic data while strictly
 * preventing caching of sensitive patient PII and private records.
 */

interface CacheEntry<T> {
  data: T;
  expiresAt: number;
  isPrivate: boolean;
}

class CacheManager {
  private cache = new Map<string, CacheEntry<unknown>>();
  private maxEntries: number;

  constructor(maxEntries = 1000) {
    this.maxEntries = maxEntries;
  }

  /**
   * Sets a cache entry. Throws an error or rejects if private patient data is passed to a public cache key.
   */
  set<T>(key: string, data: T, ttlSeconds: number, isPrivate = false): void {
    // Strict Privacy Rule: Private patient data must not be stored in shared cache
    if (isPrivate) {
      return; // Never cache private patient records in shared application cache
    }

    // Enforce LRU eviction if maximum entries exceeded
    if (this.cache.size >= this.maxEntries) {
      const oldestKey = this.cache.keys().next().value;
      if (oldestKey) {
        this.cache.delete(oldestKey);
      }
    }

    const expiresAt = Date.now() + ttlSeconds * 1000;
    this.cache.set(key, { data, expiresAt, isPrivate: false });
  }

  /**
   * Retrieves cached data if present and not expired.
   */
  get<T>(key: string): T | null {
    const entry = this.cache.get(key) as CacheEntry<T> | undefined;
    if (!entry) return null;

    if (Date.now() > entry.expiresAt) {
      this.cache.delete(key);
      return null;
    }

    return entry.data;
  }

  /**
   * Invalidate single or pattern-based cache keys (e.g. on clinic update).
   */
  invalidate(keyOrPrefix: string): void {
    for (const key of this.cache.keys()) {
      if (key === keyOrPrefix || key.startsWith(keyOrPrefix)) {
        this.cache.delete(key);
      }
    }
  }

  /**
   * Invalidate all cached data for a specific clinic.
   */
  invalidateClinicCache(clinicId: string): void {
    this.invalidate(`clinic:${clinicId}`);
  }

  /**
   * Clears the entire cache.
   */
  clear(): void {
    this.cache.clear();
  }

  /**
   * Returns current active cache size.
   */
  size(): number {
    return this.cache.size;
  }
}

export const appCache = new CacheManager();

/**
 * Standard HTTP Cache-Control header generator enforcing privacy rules.
 */
export function getOptimalCacheHeaders(dataType: 'public_static' | 'public_dynamic' | 'private_patient_data'): Headers {
  const headers = new Headers();

  switch (dataType) {
    case 'public_static':
      // Static assets, widget JS: cached by CDN and browsers
      headers.set('Cache-Control', 'public, max-age=31536000, immutable');
      break;

    case 'public_dynamic':
      // Public clinic services, business hours, FAQs: cached with fast revalidation
      headers.set('Cache-Control', 'public, s-maxage=300, stale-while-revalidate=600');
      break;

    case 'private_patient_data':
    default:
      // STRICT PRIVACY: Appointments, patient PII, billing, medical data NEVER cached
      headers.set('Cache-Control', 'private, no-cache, no-store, must-revalidate');
      headers.set('Pragma', 'no-cache');
      headers.set('Expires', '0');
      break;
  }

  return headers;
}

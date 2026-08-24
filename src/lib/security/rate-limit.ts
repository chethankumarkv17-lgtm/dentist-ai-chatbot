interface RateLimitRecord {
  count: number;
  resetTime: number;
}

class InMemoryRateLimiter {
  private requests: Map<string, RateLimitRecord> = new Map();
  private windowMs: number;
  private maxRequests: number;

  constructor(windowMs: number = 60000, maxRequests: number = 30) {
    this.windowMs = windowMs;
    this.maxRequests = maxRequests;

    // Periodic cleanup of expired records every 5 minutes
    if (typeof setInterval !== 'undefined') {
      const interval = setInterval(() => {
        const now = Date.now();
        for (const [key, record] of this.requests.entries()) {
          if (now > record.resetTime) {
            this.requests.delete(key);
          }
        }
      }, 300000);
      
      // Allow process to exit without waiting for interval
      if (interval.unref) {
        interval.unref();
      }
    }
  }

  public check(identifier: string): { success: boolean; limit: number; remaining: number; resetTime: number } {
    const now = Date.now();
    const record = this.requests.get(identifier);

    if (!record || now > record.resetTime) {
      const newRecord: RateLimitRecord = {
        count: 1,
        resetTime: now + this.windowMs,
      };
      this.requests.set(identifier, newRecord);
      return {
        success: true,
        limit: this.maxRequests,
        remaining: this.maxRequests - 1,
        resetTime: newRecord.resetTime,
      };
    }

    if (record.count >= this.maxRequests) {
      return {
        success: false,
        limit: this.maxRequests,
        remaining: 0,
        resetTime: record.resetTime,
      };
    }

    record.count += 1;
    this.requests.set(identifier, record);

    return {
      success: true,
      limit: this.maxRequests,
      remaining: this.maxRequests - record.count,
      resetTime: record.resetTime,
    };
  }

  public reset(identifier?: string): void {
    if (identifier) {
      this.requests.delete(identifier);
    } else {
      this.requests.clear();
    }
  }
}

// Global rate limiter for chat requests: 30 requests per minute per IP/widget
export const chatRateLimiter = new InMemoryRateLimiter(60000, 30);

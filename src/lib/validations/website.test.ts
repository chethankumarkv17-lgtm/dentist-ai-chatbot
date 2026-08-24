import { describe, it, expect } from 'vitest';
import { websiteUrlSchema } from './website';

describe('Website URL Validator', () => {
  it('accepts valid public https URLs', () => {
    expect(websiteUrlSchema.safeParse('https://www.smileclinic.com').success).toBe(true);
    expect(websiteUrlSchema.safeParse('https://dental.io/booking').success).toBe(true);
  });

  it('rejects missing protocol', () => {
    expect(websiteUrlSchema.safeParse('www.smileclinic.com').success).toBe(false);
  });

  it('rejects unsupported protocols', () => {
    expect(websiteUrlSchema.safeParse('ftp://smileclinic.com').success).toBe(false);
    expect(websiteUrlSchema.safeParse('javascript:alert(1)').success).toBe(false);
    expect(websiteUrlSchema.safeParse('file:///etc/passwd').success).toBe(false);
  });

  it('rejects localhost and private IPs', () => {
    expect(websiteUrlSchema.safeParse('http://localhost:3000').success).toBe(false);
    expect(websiteUrlSchema.safeParse('http://127.0.0.1').success).toBe(false);
    expect(websiteUrlSchema.safeParse('http://192.168.1.1').success).toBe(false);
    expect(websiteUrlSchema.safeParse('http://10.0.0.5').success).toBe(false);
    expect(websiteUrlSchema.safeParse('http://172.16.0.1').success).toBe(false);
    expect(websiteUrlSchema.safeParse('http://169.254.169.254').success).toBe(false); // AWS metadata
    expect(websiteUrlSchema.safeParse('http://0.0.0.0').success).toBe(false);
    expect(websiteUrlSchema.safeParse('https://test.local').success).toBe(false);
  });

  it('rejects extremely long URLs', () => {
    const longUrl = 'https://example.com/' + 'a'.repeat(300);
    expect(websiteUrlSchema.safeParse(longUrl).success).toBe(false);
  });
});

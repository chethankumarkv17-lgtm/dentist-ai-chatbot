import { z } from 'zod';

const isLocalOrPrivate = (hostname: string) => {
  if (hostname === 'localhost' || hostname.endsWith('.local')) return true;
  const ip = /^(\d+)\.(\d+)\.(\d+)\.(\d+)$/.exec(hostname);
  if (ip) {
    const p1 = parseInt(ip[1], 10);
    const p2 = parseInt(ip[2], 10);
    if (p1 === 10 || p1 === 127) return true;
    if (p1 === 192 && p2 === 168) return true;
    if (p1 === 172 && p2 >= 16 && p2 <= 31) return true;
    if (p1 === 169 && p2 === 254) return true; // link-local
    if (p1 === 0) return true; // 0.0.0.0
  }
  return false;
};

export const websiteUrlSchema = z.string()
  .min(1, "URL is required")
  .max(255, "URL is too long")
  .url("Must be a valid URL")
  .refine(url => {
    try {
      const parsed = new URL(url);
      if (parsed.protocol !== 'http:' && parsed.protocol !== 'https:') return false;
      if (isLocalOrPrivate(parsed.hostname)) return false;
      
      // In production, force https
      if (process.env.NODE_ENV === 'production' && parsed.protocol !== 'https:') {
        return false;
      }
      return true;
    } catch {
      return false;
    }
  }, "Invalid, unsupported, or private URL address");

import { describe, it, expect, vi, beforeEach } from 'vitest';
import { addCustomDomain, verifyDomainStatus, removeCustomDomain } from './domains';

vi.mock('@/lib/supabase/server-auth', () => ({
  createClient: vi.fn(() => ({
    auth: {
      getUser: vi.fn().mockResolvedValue({ data: { user: { id: 'test-user' } } }),
    },
  })),
}));

vi.mock('next/cache', () => ({
  revalidatePath: vi.fn(),
}));

describe('Domain Actions', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('addCustomDomain', () => {
    it('successfully adds a valid domain', async () => {
      const result = await addCustomDomain('clinic-1', 'www.myclinic.com');
      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.domain).toBe('www.myclinic.com');
        expect(result.status).toBe('pending');
      }
    });

    it('rejects invalid domain formats', async () => {
      const result = await addCustomDomain('clinic-1', 'invalid-domain');
      expect(result.success).toBe(false);
      expect(result.error).toContain('Invalid domain format');
    });

    it('rejects platform subdomains', async () => {
      const result = await addCustomDomain('clinic-1', 'test.dentalai.test');
      expect(result.success).toBe(false);
      expect(result.error).toContain('Cannot use platform domains');
    });

    it('cleans and trims input domains', async () => {
      const result = await addCustomDomain('clinic-1', '  WWw.Dental-Clinic.Com  ');
      expect(result.success).toBe(true);
      if (result.success) expect(result.domain).toBe('www.dental-clinic.com');
    });
  });
});

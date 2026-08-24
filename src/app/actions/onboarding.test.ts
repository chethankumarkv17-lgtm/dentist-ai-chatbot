import { describe, it, expect, vi, beforeEach } from 'vitest';
import { saveStep1, saveStep2, savePathA, savePathB } from './onboarding';

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

describe('Onboarding Actions', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('saveStep1', () => {
    it('returns error when validation fails', async () => {
      const formData = new FormData();
      formData.append('name', 'A'); // Too short
      formData.append('email', 'not-an-email');

      const result = await saveStep1(formData);
      expect(result.success).toBe(false);
      expect(result.errors).toBeDefined();
      expect(result.errors?.name).toBeDefined();
      expect(result.errors?.email).toBeDefined();
    });

    it('returns success for valid data', async () => {
      const formData = new FormData();
      formData.append('name', 'Smile Clinic');
      formData.append('phone', '1234567890');
      formData.append('email', 'hello@smile.test');
      formData.append('address', '123 Main St');
      formData.append('timezone', 'America/New_York');

      const result = await saveStep1(formData);
      expect(result.success).toBe(true);
      expect(result.clinicId).toBeDefined();
    });
  });

  describe('saveStep2', () => {
    it('returns error when validation fails', async () => {
      const formData = new FormData();
      const result = await saveStep2(formData);
      expect(result.success).toBe(false);
    });

    it('returns success for valid path A choice', async () => {
      const formData = new FormData();
      formData.append('hasWebsite', 'yes');
      const result = await saveStep2(formData);
      expect(result.success).toBe(true);
      expect(result.hasWebsite).toBe('yes');
    });
  });

  describe('savePathA', () => {
    it('returns error when URL is invalid', async () => {
      const formData = new FormData();
      formData.append('websiteUrl', 'not-a-url');
      const result = await savePathA(formData);
      expect(result.success).toBe(false);
    });

    it('returns success for valid URL', async () => {
      const formData = new FormData();
      formData.append('websiteUrl', 'https://smileclinic.test');
      const result = await savePathA(formData);
      expect(result.success).toBe(true);
    });
  });

  describe('savePathB', () => {
    it('returns error when missing required fields', async () => {
      const formData = new FormData();
      const result = await savePathB(formData);
      expect(result.success).toBe(false);
    });

    it('returns success for fully populated form', async () => {
      const formData = new FormData();
      formData.append('clinicInfo', 'We are a great clinic.');
      formData.append('services', 'Cleaning, X-Rays');
      formData.append('dentists', 'Dr. Bob');
      formData.append('hours', 'Mon-Fri 9-5');
      formData.append('branding', '#ffffff');
      formData.append('desiredSiteName', 'Smile Clinic Online');
      formData.append('domainPreference', 'smileclinic.test');
      
      const result = await savePathB(formData);
      expect(result.success).toBe(true);
    });
  });
});

import { describe, it, expect, vi, beforeEach } from 'vitest';
import { saveSiteBuilderData, setSiteStatus } from './site-builder';

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

describe('Site Builder Actions', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('saveSiteBuilderData', () => {
    it('validates and saves site data correctly', async () => {
      const data = {
        template_id: 'modern',
        content: { description: 'A great clinic', email: 'test@clinic.com' },
        theme_settings: { primary_color: '#000000' }
      };

      const result = await saveSiteBuilderData('clinic-1', data);
      expect(result.success).toBe(true);
    });

    it('rejects invalid template types', async () => {
      const data = {
        template_id: 'hack_template',
        content: {},
        theme_settings: { primary_color: '#000' }
      };

      const result = await saveSiteBuilderData('clinic-1', data);
      expect(result.success).toBe(false);
      expect(result.error).toContain('Invalid');
    });
  });

  describe('setSiteStatus', () => {
    it('updates status to published', async () => {
      const result = await setSiteStatus('clinic-1', 'published');
      expect(result.success).toBe(true);
      if (result.success) expect(result.status).toBe('published');
    });

    it('updates status to draft', async () => {
      const result = await setSiteStatus('clinic-1', 'draft');
      expect(result.success).toBe(true);
      if (result.success) expect(result.status).toBe('draft');
    });
  });
});

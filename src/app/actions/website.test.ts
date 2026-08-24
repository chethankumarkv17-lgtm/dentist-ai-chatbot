import { describe, it, expect, vi, beforeEach } from 'vitest';
import { verifyInstallation } from './website';

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

describe('verifyInstallation Action', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    global.fetch = vi.fn();
  });

  it('rejects invalid URLs securely', async () => {
    const result = await verifyInstallation('widget-123', 'http://localhost/hack');
    expect(result.success).toBe(false);
    expect(result.error).toBe('Invalid URL for verification.');
  });

  it('handles fetch network errors gracefully', async () => {
    vi.mocked(global.fetch).mockRejectedValueOnce(new Error('Network error'));
    
    const result = await verifyInstallation('widget-123', 'https://www.smileclinic.test');
    expect(result.success).toBe(false);
    expect(result.error).toBe('Failed to connect to the website.');
  });

  it('fails if widget ID is not found on the page', async () => {
    vi.mocked(global.fetch).mockResolvedValueOnce({
      ok: true,
      text: () => Promise.resolve('<html><body><h1>Welcome</h1></body></html>'),
    } as Response);

    const result = await verifyInstallation('widget-123', 'https://www.smileclinic.test');
    expect(result.success).toBe(false);
    expect(result.error).toContain('not found');
  });

  it('succeeds if widget ID and script are found on the page', async () => {
    vi.mocked(global.fetch).mockResolvedValueOnce({
      ok: true,
      text: () => Promise.resolve('<html><body><script src="widget.js" data-id="widget-123"></script></body></html>'),
    } as Response);

    const result = await verifyInstallation('widget-123', 'https://www.smileclinic.test');
    expect(result.success).toBe(true);
  });
});

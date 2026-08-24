import { describe, it, expect, vi, beforeEach } from 'vitest';
import { saveService, saveBusinessHours, addBlockedTime } from './config';

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

describe('Clinic Configuration Actions', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('saveService', () => {
    it('saves a valid service', async () => {
      const result = await saveService('clinic-1', {
        name: 'Teeth Whitening',
        duration_minutes: 60,
        buffer_time_minutes: 15,
        price: 199.99,
        is_active: true,
        is_bookable: true,
      });
      expect(result.success).toBe(true);
      if (result.success && result.data) {
        expect(result.data.name).toBe('Teeth Whitening');
      }
    });

    it('rejects invalid duration', async () => {
      const result = await saveService('clinic-1', {
        name: 'Checkup',
        duration_minutes: 0, // invalid
        buffer_time_minutes: 0,
        is_active: true,
        is_bookable: true,
      });
      expect(result.success).toBe(false);
      expect(result.error).toContain('Duration must be at least 1 minute');
    });
  });

  describe('saveBusinessHours & Timezones', () => {
    it('accepts valid business hours and timezone', async () => {
      const result = await saveBusinessHours('clinic-1', [
        { day_of_week: 1, open_time: '09:00', close_time: '17:00' }
      ], 'America/New_York');
      expect(result.success).toBe(true);
    });

    it('rejects invalid timezone', async () => {
      const result = await saveBusinessHours('clinic-1', [
        { day_of_week: 1, open_time: '09:00', close_time: '17:00' }
      ], 'Fake/Timezone');
      expect(result.success).toBe(false);
      expect(result.error).toBe('Invalid timezone');
    });

    it('rejects open_time after close_time', async () => {
      const result = await saveBusinessHours('clinic-1', [
        { day_of_week: 1, open_time: '17:00', close_time: '09:00' } // invalid
      ], 'America/New_York');
      expect(result.success).toBe(false);
      expect(result.error).toContain('Open time must be before close time');
    });
  });

  describe('addBlockedTime', () => {
    it('accepts valid blocked time', async () => {
      const result = await addBlockedTime({
        dentist_id: '123e4567-e89b-12d3-a456-426614174000',
        start_timestamp: '2026-09-01T09:00:00Z',
        end_timestamp: '2026-09-01T10:00:00Z',
      });
      expect(result.success).toBe(true);
    });

    it('rejects start time after end time', async () => {
      const result = await addBlockedTime({
        dentist_id: '123e4567-e89b-12d3-a456-426614174000',
        start_timestamp: '2026-09-01T10:00:00Z',
        end_timestamp: '2026-09-01T09:00:00Z',
      });
      expect(result.success).toBe(false);
      expect(result.error).toContain('Start time must be before end time');
    });
  });
});

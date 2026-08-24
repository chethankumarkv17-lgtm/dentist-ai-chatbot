'use server';

import { getClinicAnalytics, getPlatformAnalytics, trackPrivacySafeEvent } from '@/lib/analytics/service';

export async function getClinicAnalyticsAction(organizationId: string, days = 30) {
  if (!organizationId) {
    return { success: false, error: 'Organization ID is required' };
  }

  try {
    const data = await getClinicAnalytics(organizationId, days);
    return { success: true, data };
  } catch (err: unknown) {
    return { success: false, error: (err as Error)?.message || 'Failed to load clinic analytics' };
  }
}

export async function getPlatformAnalyticsAction(days = 30) {
  try {
    const data = await getPlatformAnalytics(days);
    return { success: true, data };
  } catch (err: unknown) {
    return { success: false, error: (err as Error)?.message || 'Failed to load platform analytics' };
  }
}

export async function recordAnalyticsEventAction(
  organizationId: string,
  eventName: string,
  source = 'widget',
  meta?: Record<string, unknown>
) {
  if (!organizationId || !eventName) return { success: false };

  try {
    await trackPrivacySafeEvent(organizationId, eventName, source, meta);
    return { success: true };
  } catch {
    return { success: false };
  }
}

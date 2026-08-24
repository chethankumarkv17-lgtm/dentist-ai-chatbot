'use server';

import { requirePlatformAdmin } from '@/lib/admin/auth';
import { runHealthDiagnostic, acknowledgeCriticalAlert } from '@/lib/monitoring/service';
import { revalidatePath } from 'next/cache';

export async function triggerHealthCheckAction() {
  try {
    await requirePlatformAdmin();
    const overview = await runHealthDiagnostic();
    revalidatePath('/admin/system-health');
    return { success: true, data: overview };
  } catch (err: unknown) {
    return { success: false, error: (err as Error)?.message || 'Failed to run health check' };
  }
}

export async function acknowledgeAlertAction(alertId: string) {
  try {
    await requirePlatformAdmin();
    const success = await acknowledgeCriticalAlert(alertId);
    revalidatePath('/admin/system-health');
    return { success };
  } catch (err: unknown) {
    return { success: false, error: (err as Error)?.message || 'Failed to acknowledge alert' };
  }
}

'use server';

import { requirePlatformAdmin } from '@/lib/admin/auth';
import { suspendOrganization, reactivateOrganization } from '@/lib/admin/service';
import { revalidatePath } from 'next/cache';

export async function suspendClinicAction(organizationId: string, reason: string) {
  try {
    const admin = await requirePlatformAdmin();
    const res = await suspendOrganization(admin.id, organizationId, reason);
    revalidatePath('/admin');
    revalidatePath('/admin/clinics');
    return res;
  } catch (err: unknown) {
    return { success: false, error: (err as Error)?.message || 'Failed to suspend clinic' };
  }
}

export async function reactivateClinicAction(organizationId: string) {
  try {
    const admin = await requirePlatformAdmin();
    const res = await reactivateOrganization(admin.id, organizationId);
    revalidatePath('/admin');
    revalidatePath('/admin/clinics');
    return res;
  } catch (err: unknown) {
    return { success: false, error: (err as Error)?.message || 'Failed to reactivate clinic' };
  }
}

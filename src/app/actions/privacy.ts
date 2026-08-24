'use server';

import { createClient } from '@/lib/supabase/server-auth';
import {
  exportOrganizationData,
  updateRetentionPolicy,
  erasePatientData,
  deleteUserAccount,
  deleteOrganization,
  getRetentionPolicy,
} from '@/lib/privacy/service';
import { RetentionPolicy } from '@/lib/privacy/types';
import { revalidatePath } from 'next/cache';

export async function getRetentionPolicyAction(organizationId: string) {
  try {
    const policy = await getRetentionPolicy(organizationId);
    return { success: true, policy };
  } catch (err: unknown) {
    return { success: false, error: (err as Error)?.message || 'Failed to fetch policy' };
  }
}

export async function updateRetentionPolicyAction(
  organizationId: string,
  policy: Partial<RetentionPolicy>
) {
  try {
    const res = await updateRetentionPolicy(organizationId, policy);
    revalidatePath('/dashboard/settings');
    return res;
  } catch (err: unknown) {
    return { success: false, error: (err as Error)?.message || 'Failed to update retention policy' };
  }
}

export async function exportClinicDataAction(organizationId: string) {
  try {
    const res = await exportOrganizationData(organizationId);
    return res;
  } catch (err: unknown) {
    return { success: false, error: (err as Error)?.message || 'Failed to export data' };
  }
}

export async function erasePatientDataAction(
  organizationId: string,
  patientIdentifier: string
): Promise<{ success: boolean; redactedRecordsCount?: number; error?: string }> {
  const supabase = createClient();
  let userId = 'user-1';

  try {
    const { data: { user } } = await supabase.auth.getUser();
    if (user) userId = user.id;
  } catch {
    // Fallback
  }

  try {
    const res = await erasePatientData(organizationId, patientIdentifier, userId);
    revalidatePath('/dashboard/settings');
    revalidatePath('/dashboard/appointments');
    return res;
  } catch (err: unknown) {
    return { success: false, error: (err as Error)?.message || 'Failed to erase patient data' };
  }
}

export async function deleteUserAccountAction() {
  const supabase = createClient();
  try {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return { success: false, error: 'User not found' };

    const res = await deleteUserAccount(user.id);
    return res;
  } catch (err: unknown) {
    return { success: false, error: (err as Error)?.message || 'Failed to delete account' };
  }
}

export async function deleteOrganizationAction(organizationId: string) {
  const supabase = createClient();
  let userId = 'user-1';

  try {
    const { data: { user } } = await supabase.auth.getUser();
    if (user) userId = user.id;
  } catch {
    // Fallback
  }

  try {
    const res = await deleteOrganization(organizationId, userId);
    return res;
  } catch (err: unknown) {
    return { success: false, error: (err as Error)?.message || 'Failed to delete organization' };
  }
}

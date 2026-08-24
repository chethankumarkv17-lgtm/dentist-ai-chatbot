'use server';

import { createClient } from '@/lib/supabase/server-auth';
import { uploadClinicAsset, deleteClinicAsset } from '@/lib/storage/service';
import { AllowedAssetType } from '@/lib/storage/validator';
import { revalidatePath } from 'next/cache';

export async function uploadAssetAction(formData: FormData) {
  const organizationId = formData.get('organizationId') as string;
  const assetType = (formData.get('assetType') as AllowedAssetType) || 'clinic_image';
  const file = formData.get('file') as File | null;

  if (!organizationId || !file) {
    return { success: false, error: 'Organization and file are required.' };
  }

  const supabase = createClient();
  let userId = 'user-1';

  try {
    const { data: { user } } = await supabase.auth.getUser();
    if (user) userId = user.id;
  } catch {
    // Fallback
  }

  try {
    const arrayBuffer = await file.arrayBuffer();
    const buffer = new Uint8Array(arrayBuffer);

    const res = await uploadClinicAsset(organizationId, userId, assetType, {
      name: file.name,
      buffer,
    });

    revalidatePath('/dashboard/settings');
    revalidatePath('/dashboard/site-builder');
    return res;
  } catch (err: unknown) {
    return { success: false, error: (err as Error)?.message || 'Failed to upload asset' };
  }
}

export async function deleteAssetAction(organizationId: string, assetId: string) {
  try {
    const res = await deleteClinicAsset(organizationId, assetId);
    revalidatePath('/dashboard/settings');
    revalidatePath('/dashboard/site-builder');
    return res;
  } catch (err: unknown) {
    return { success: false, error: (err as Error)?.message || 'Failed to delete asset' };
  }
}

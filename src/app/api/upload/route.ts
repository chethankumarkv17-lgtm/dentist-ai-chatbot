import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server-auth';
import { uploadClinicAsset } from '@/lib/storage/service';
import { AllowedAssetType } from '@/lib/storage/validator';

export async function POST(request: NextRequest) {
  try {
    const formData = await request.formData();
    const organizationId = formData.get('organizationId') as string;
    const assetType = (formData.get('assetType') as AllowedAssetType) || 'clinic_image';
    const file = formData.get('file') as File | null;

    if (!organizationId || !file) {
      return NextResponse.json(
        { success: false, error: 'Missing organization ID or file.' },
        { status: 400 }
      );
    }

    const supabase = createClient();
    let userId = 'user-1';
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (user) userId = user.id;
    } catch {
      // Fallback
    }

    const arrayBuffer = await file.arrayBuffer();
    const buffer = new Uint8Array(arrayBuffer);

    const result = await uploadClinicAsset(organizationId, userId, assetType, {
      name: file.name,
      buffer,
    });

    if (!result.success) {
      return NextResponse.json(
        { success: false, error: result.error },
        { status: 422 }
      );
    }

    return NextResponse.json(result);
  } catch (err: unknown) {
    return NextResponse.json(
      { success: false, error: (err as Error)?.message || 'Internal upload error' },
      { status: 500 }
    );
  }
}

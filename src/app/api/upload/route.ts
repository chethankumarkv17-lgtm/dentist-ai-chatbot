import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server-auth';
import { uploadClinicAsset } from '@/lib/storage/service';
import { AllowedAssetType } from '@/lib/storage/validator';

export async function POST(request: NextRequest) {
  let formData: FormData;
  try {
    formData = await request.formData();
  } catch {
    return NextResponse.json(
      { success: false, error: 'Invalid or missing multipart form data.' },
      { status: 400 }
    );
  }

  try {
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
    let userId: string | null = null;
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (user) userId = user.id;
    } catch {
      // Fallback
    }

    if (!userId) {
      const isDemoAllowed = process.env.NODE_ENV !== 'production' || process.env.ENABLE_DEMO_LOGIN === 'true';
      const demoEmail = isDemoAllowed ? request.cookies.get('demo_user_email')?.value : undefined;
      if (demoEmail) {
        userId = 'demo-user-id';
      }
    }

    if (!userId) {
      return NextResponse.json(
        { success: false, error: 'Unauthorized. You must be authenticated to upload assets.' },
        { status: 401 }
      );
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

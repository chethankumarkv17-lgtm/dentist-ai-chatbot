'use server';

import { createClient } from '@/lib/supabase/server-auth';
import { revalidatePath } from 'next/cache';
import { z } from 'zod';

const siteSchema = z.object({
  template_id: z.enum(['modern', 'classic', 'elegant']),
  content: z.object({
    description: z.string().optional(),
    services: z.string().optional(),
    dentists: z.string().optional(),
    hours: z.string().optional(),
    phone: z.string().optional(),
    email: z.string().email().or(z.literal('')).optional(),
    address: z.string().optional(),
    faq: z.string().optional(),
    social_links: z.string().optional(),
  }),
  theme_settings: z.object({
    primary_color: z.string(),
  })
});

export async function saveSiteBuilderData(clinicId: string, formData: unknown) {
  const supabase = createClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) {
    return { success: false, error: 'Unauthorized' };
  }

  // Tenant Isolation Check (Mocked since no DB)
  // Real DB would verify user belongs to clinicId

  const parsed = siteSchema.safeParse(formData);
  if (!parsed.success) {
    return { success: false, error: 'Invalid site configuration data' };
  }

  // Real DB: upsert into clinic_websites
  // await supabase.from('clinic_websites').upsert({ clinic_id: clinicId, ...parsed.data, updated_at: 'now()' });

  revalidatePath('/dashboard/site-builder');
  return { success: true, data: parsed.data };
}

export async function setSiteStatus(clinicId: string, status: 'draft' | 'published') {
  const supabase = createClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) {
    return { success: false, error: 'Unauthorized' };
  }

  // Tenant Isolation Check
  
  // Real DB: UPDATE clinic_websites SET status = status WHERE clinic_id = clinicId

  revalidatePath('/dashboard/site-builder');
  return { success: true, status };
}

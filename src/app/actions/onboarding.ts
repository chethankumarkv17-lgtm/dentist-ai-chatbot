'use server';

import { 
  step1Schema, 
  step2Schema, 
  pathASchema, 
  pathBSchema 
} from '@/lib/validations/onboarding';
import { createClient } from '@/lib/supabase/server-auth';
import { revalidatePath } from 'next/cache';

// Simulating DB delay for realistic UI states
const delay = (ms: number) => new Promise((res) => setTimeout(res, ms));

export async function saveStep1(formData: FormData) {
  const data = Object.fromEntries(formData.entries());
  
  const parsed = step1Schema.safeParse(data);
  if (!parsed.success) {
    return { success: false, errors: parsed.error.flatten().fieldErrors };
  }

  const supabase = createClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) {
    return { success: false, error: 'Unauthorized' };
  }

  // Real logic would:
  // 1. Insert into `organizations`
  // 2. Insert into `organization_members`
  // 3. Insert into `clinics`
  
  await delay(500); // Simulate network

  // We return a mock clinicId for the next steps to use
  return { success: true, clinicId: 'mock-clinic-id' };
}

export async function saveStep2(formData: FormData) {
  const data = Object.fromEntries(formData.entries());
  
  const parsed = step2Schema.safeParse(data);
  if (!parsed.success) {
    return { success: false, errors: parsed.error.flatten().fieldErrors };
  }

  await delay(300);

  return { success: true, hasWebsite: parsed.data.hasWebsite };
}

export async function savePathA(formData: FormData) {
  const data = Object.fromEntries(formData.entries());
  
  const parsed = pathASchema.safeParse(data);
  if (!parsed.success) {
    return { success: false, errors: parsed.error.flatten().fieldErrors };
  }

  // Real logic: Insert into `website_installations`
  await delay(500);
  
  return { success: true };
}

export async function savePathB(formData: FormData) {
  const data = Object.fromEntries(formData.entries());
  
  const parsed = pathBSchema.safeParse(data);
  if (!parsed.success) {
    return { success: false, errors: parsed.error.flatten().fieldErrors };
  }

  // Real logic: Insert into `clinic_websites`, `services`, `dentists`, etc.
  await delay(800);

  return { success: true };
}

export async function completeOnboarding() {
  // Finalize setup and revalidate
  revalidatePath('/dashboard');
  return { success: true, redirect: '/dashboard' };
}

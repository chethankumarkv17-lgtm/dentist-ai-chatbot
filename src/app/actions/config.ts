'use server';

import { createClient } from '@/lib/supabase/server-auth';
import { revalidatePath } from 'next/cache';
import { z } from 'zod';
import { isValidTimezone } from '@/lib/validations/timezones';

// Schemas
const serviceSchema = z.object({
  id: z.string().uuid().optional(),
  name: z.string().min(1, "Name is required").max(255),
  description: z.string().optional(),
  duration_minutes: z.number().int().min(1, "Duration must be at least 1 minute").max(1440),
  buffer_time_minutes: z.number().int().min(0).max(1440).default(0),
  price: z.number().min(0).optional(),
  is_active: z.boolean().default(true),
  is_bookable: z.boolean().default(true),
});

const timeStringSchema = z.string().regex(/^([01]\d|2[0-3]):([0-5]\d)(:([0-5]\d))?$/, "Invalid time format (HH:MM)");

const businessHoursSchema = z.object({
  day_of_week: z.number().int().min(0).max(6),
  open_time: timeStringSchema,
  close_time: timeStringSchema,
}).refine(data => {
  return data.open_time < data.close_time;
}, {
  message: "Open time must be before close time",
  path: ["close_time"]
});

const blockedTimeSchema = z.object({
  id: z.string().uuid().optional(),
  dentist_id: z.string().uuid(),
  start_timestamp: z.string().datetime(),
  end_timestamp: z.string().datetime(),
  reason: z.string().optional(),
}).refine(data => {
  return new Date(data.start_timestamp) < new Date(data.end_timestamp);
}, {
  message: "Start time must be before end time",
  path: ["end_timestamp"]
});

export async function saveService(clinicId: string, data: z.infer<typeof serviceSchema>) {
  const supabase = createClient();
  const parsed = serviceSchema.safeParse(data);
  
  if (!parsed.success) {
    return { success: false, error: parsed.error.issues[0].message };
  }

  // In real db, insert or update
  // await supabase.from('services').upsert({ clinic_id: clinicId, ...parsed.data });
  
  revalidatePath('/dashboard/services');
  return { success: true, data: parsed.data };
}

export async function saveBusinessHours(clinicId: string, hours: z.infer<typeof businessHoursSchema>[], timezone: string) {
  if (!isValidTimezone(timezone)) {
    return { success: false, error: "Invalid timezone" };
  }

  for (const h of hours) {
    const parsed = businessHoursSchema.safeParse(h);
    if (!parsed.success) {
      return { success: false, error: `Day ${h.day_of_week}: ${parsed.error.issues[0].message}` };
    }
  }

  // Real DB: 
  // await supabase.from('clinics').update({ timezone }).eq('id', clinicId);
  // await supabase.from('business_hours').delete().eq('clinic_id', clinicId);
  // await supabase.from('business_hours').insert(hours.map(h => ({ clinic_id: clinicId, ...h })));

  revalidatePath('/dashboard/availability');
  return { success: true };
}

export async function addBlockedTime(data: z.infer<typeof blockedTimeSchema>) {
  const parsed = blockedTimeSchema.safeParse(data);
  if (!parsed.success) {
    return { success: false, error: parsed.error.issues[0].message };
  }

  // Real DB:
  // await supabase.from('blocked_times').insert(parsed.data);

  revalidatePath('/dashboard/availability');
  return { success: true, data: parsed.data };
}

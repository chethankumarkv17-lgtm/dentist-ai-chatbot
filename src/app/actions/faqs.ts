'use server';

import { z } from 'zod';
import { createClient } from '@/lib/supabase/server-auth';
import { revalidatePath } from 'next/cache';

const CreateFaqSchema = z.object({
  question: z.string().min(3, 'Question must be at least 3 characters long').max(500, 'Question is too long'),
  answer: z.string().min(3, 'Answer must be at least 3 characters long').max(2000, 'Answer is too long'),
});

const UpdateFaqSchema = z.object({
  question: z.string().min(3, 'Question must be at least 3 characters long').max(500).optional(),
  answer: z.string().min(3, 'Answer must be at least 3 characters long').max(2000).optional(),
});

export async function getClinicFaqs(clinicId: string) {
  if (!clinicId) return { success: false, error: 'Clinic ID is required' };

  const supabase = createClient();
  const { data, error } = await supabase
    .from('clinic_faqs')
    .select('id, clinic_id, question, answer, created_at, updated_at')
    .eq('clinic_id', clinicId)
    .order('created_at', { ascending: true });

  if (error) {
    return { success: false, error: error.message };
  }

  return { success: true, data: data || [] };
}

export async function createClinicFaq(clinicId: string, rawData: z.infer<typeof CreateFaqSchema>) {
  const parsed = CreateFaqSchema.safeParse(rawData);
  if (!parsed.success) {
    return {
      success: false,
      error: parsed.error.issues.map(i => i.message).join(', '),
    };
  }

  const supabase = createClient();
  const { data, error } = await supabase
    .from('clinic_faqs')
    .insert({
      clinic_id: clinicId,
      question: parsed.data.question.trim(),
      answer: parsed.data.answer.trim(),
    })
    .select('id, clinic_id, question, answer, created_at')
    .single();

  if (error) {
    return { success: false, error: error.message };
  }

  revalidatePath('/dashboard/settings');
  revalidatePath('/dashboard/chatbot');
  return { success: true, data };
}

export async function updateClinicFaq(clinicId: string, faqId: string, rawData: z.infer<typeof UpdateFaqSchema>) {
  if (!faqId) return { success: false, error: 'FAQ ID is required' };

  const parsed = UpdateFaqSchema.safeParse(rawData);
  if (!parsed.success) {
    return {
      success: false,
      error: parsed.error.issues.map(i => i.message).join(', '),
    };
  }

  const supabase = createClient();
  const updatePayload: Record<string, unknown> = {
    updated_at: new Date().toISOString(),
  };
  if (parsed.data.question) updatePayload.question = parsed.data.question.trim();
  if (parsed.data.answer) updatePayload.answer = parsed.data.answer.trim();

  const { data, error } = await supabase
    .from('clinic_faqs')
    .update(updatePayload)
    .eq('id', faqId)
    .eq('clinic_id', clinicId)
    .select('id, clinic_id, question, answer, updated_at')
    .single();

  if (error) {
    return { success: false, error: error.message };
  }

  revalidatePath('/dashboard/settings');
  revalidatePath('/dashboard/chatbot');
  return { success: true, data };
}

export async function deleteClinicFaq(clinicId: string, faqId: string) {
  if (!faqId || !clinicId) {
    return { success: false, error: 'Clinic ID and FAQ ID are required' };
  }

  const supabase = createClient();
  const { error } = await supabase
    .from('clinic_faqs')
    .delete()
    .eq('id', faqId)
    .eq('clinic_id', clinicId);

  if (error) {
    return { success: false, error: error.message };
  }

  revalidatePath('/dashboard/settings');
  revalidatePath('/dashboard/chatbot');
  return { success: true };
}

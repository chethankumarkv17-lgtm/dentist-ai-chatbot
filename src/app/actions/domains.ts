'use server';

import { createClient } from '@/lib/supabase/server-auth';
import { revalidatePath } from 'next/cache';
import { z } from 'zod';

const customDomainSchema = z.object({
  domain: z.string()
    .trim()
    .toLowerCase()
    .min(3, "Domain is too short")
    .max(255, "Domain is too long")
    .regex(/^[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/, "Invalid domain format"),
});

// VERCEL API ARCHITECTURE PREPARATION:
// In production, you would need:
// const VERCEL_API_URL = "https://api.vercel.com";
// const VERCEL_PROJECT_ID = process.env.VERCEL_PROJECT_ID;
// const VERCEL_TEAM_ID = process.env.VERCEL_TEAM_ID;
// const VERCEL_AUTH_TOKEN = process.env.VERCEL_AUTH_TOKEN;

export async function addCustomDomain(clinicId: string, rawDomain: string) {
  const supabase = createClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) {
    return { success: false, error: 'Unauthorized' };
  }

  const parsed = customDomainSchema.safeParse({ domain: rawDomain });
  if (!parsed.success) {
    return { success: false, error: parsed.error.issues[0].message };
  }

  const domain = parsed.data.domain;

  if (domain.includes('dentalai.test') || domain.includes('vercel.app')) {
    return { success: false, error: 'Cannot use platform domains as a custom domain.' };
  }

  // Real DB Execution:
  /*
  const { error } = await supabase.from('website_domains').insert({
    website_id: (SELECT id from clinic_websites WHERE clinic_id = clinicId),
    domain: domain,
    status: 'pending'
  });
  if (error) return { success: false, error: 'Domain is already registered by another clinic.' };
  */

  // Vercel API Call (Architecture prep)
  /*
  const res = await fetch(`${VERCEL_API_URL}/v9/projects/${VERCEL_PROJECT_ID}/domains?teamId=${VERCEL_TEAM_ID}`, {
    method: 'POST',
    headers: { Authorization: `Bearer ${VERCEL_AUTH_TOKEN}`, 'Content-Type': 'application/json' },
    body: JSON.stringify({ name: domain })
  });
  // Handle Vercel response...
  */

  revalidatePath('/dashboard/domains');
  return { success: true, domain, status: 'pending' };
}

export async function verifyDomainStatus(domain: string) {
  const supabase = createClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) {
    return { success: false, error: 'Unauthorized' };
  }

  // Vercel API verification check (Architecture prep)
  /*
  const res = await fetch(`${VERCEL_API_URL}/v9/projects/${VERCEL_PROJECT_ID}/domains/${domain}/verify?teamId=${VERCEL_TEAM_ID}`, {
    method: 'POST',
    headers: { Authorization: `Bearer ${VERCEL_AUTH_TOKEN}` }
  });
  const data = await res.json();
  if (data.verified) {
     await supabase.from('website_domains').update({ status: 'verified' }).eq('domain', domain);
     return { success: true, status: 'verified' };
  }
  */

  // Mocking verification behavior for MVP
  // Randomly returning verified or pending for demo purposes, but normally it strictly waits for DNS resolution
  const mockStatus = Math.random() > 0.5 ? 'verified' : 'pending';
  
  revalidatePath('/dashboard/domains');
  return { success: true, status: mockStatus, domain };
}

export async function removeCustomDomain(domain: string) {
  const supabase = createClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) {
    return { success: false, error: 'Unauthorized' };
  }

  // Remove from Vercel
  /*
  await fetch(`${VERCEL_API_URL}/v9/projects/${VERCEL_PROJECT_ID}/domains/${domain}?teamId=${VERCEL_TEAM_ID}`, {
    method: 'DELETE',
    headers: { Authorization: `Bearer ${VERCEL_AUTH_TOKEN}` }
  });
  */

  // Remove from DB
  /*
  await supabase.from('website_domains').delete().eq('domain', domain);
  */

  revalidatePath('/dashboard/domains');
  return { success: true };
}

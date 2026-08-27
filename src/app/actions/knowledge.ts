'use server';

import { createClient, getCurrentUser } from '@/lib/supabase/server-auth';
import { crawlWebsite } from '@/lib/knowledge/crawler';
import { extractStructuredClinicKnowledge, StructuredExtractionResult } from '@/lib/knowledge/extractor';
import {
  saveDraftKnowledgeSource,
  approveAndPublishKnowledge,
  deleteKnowledgeSource,
} from '@/lib/knowledge/manager';
import { revalidatePath } from 'next/cache';

/**
 * Validates that the current user has access to the specified clinic.
 */
async function authorizeClinicAccess(clinicId: string) {
  const user = await getCurrentUser();
  if (!user) return { authorized: false, error: 'Unauthorized. Please sign in.' };

  const supabase = createClient();

  const { data: clinic } = await supabase
    .from('clinics')
    .select('id, organization_id, name')
    .eq('id', clinicId)
    .maybeSingle();

  if (!clinic) {
    return { authorized: false, error: 'Clinic not found' };
  }

  const { data: member } = await supabase
    .from('organization_members')
    .select('role')
    .eq('organization_id', clinic.organization_id)
    .eq('user_id', user.id)
    .maybeSingle();

  if (!member) {
    return { authorized: false, error: 'You do not have access to this clinic.' };
  }

  return { authorized: true, clinic, organizationId: clinic.organization_id };
}

/**
 * Scans a dental clinic's website URL, extracts structured knowledge, and saves a draft.
 */
export async function scanWebsiteAction(clinicId: string, rawUrl: string) {
  const auth = await authorizeClinicAccess(clinicId);
  if (!auth.authorized || !auth.organizationId) {
    return { success: false, error: auth.error };
  }

  try {
    // 1. Run SSRF-Safe Crawler
    const crawlResult = await crawlWebsite(rawUrl, { maxPages: 8, timeoutMs: 8000 });

    if (!crawlResult.success || crawlResult.pages.length === 0) {
      return {
        success: false,
        error: crawlResult.error || 'Failed to crawl website. Ensure the URL is public and accessible.',
        warnings: crawlResult.warnings,
      };
    }

    // 2. Extract structured clinical entities
    const extracted = extractStructuredClinicKnowledge(crawlResult.pages);
    const combinedWarnings = [...crawlResult.warnings, ...extracted.warnings];

    // 3. Save draft knowledge source record
    const saveRes = await saveDraftKnowledgeSource(
      clinicId,
      auth.organizationId,
      crawlResult.startUrl,
      extracted,
      crawlResult.pages.length,
      combinedWarnings
    );

    if (!saveRes.success) {
      return { success: false, error: saveRes.error };
    }

    revalidatePath('/dashboard/chatbot');

    return {
      success: true,
      sourceId: saveRes.id,
      url: crawlResult.startUrl,
      pagesDiscovered: crawlResult.pages.length,
      extracted,
      warnings: combinedWarnings,
    };
  } catch (err: unknown) {
    return {
      success: false,
      error: (err as Error)?.message || 'An unexpected error occurred during website scanning.',
    };
  }
}

/**
 * Approves and publishes extracted clinical knowledge to authoritative database tables.
 */
export async function approveAndPublishKnowledgeAction(
  clinicId: string,
  sourceId: string,
  approvedData: StructuredExtractionResult
) {
  const auth = await authorizeClinicAccess(clinicId);
  if (!auth.authorized || !auth.organizationId) {
    return { success: false, error: auth.error };
  }

  try {
    const res = await approveAndPublishKnowledge(
      clinicId,
      auth.organizationId,
      sourceId,
      approvedData
    );

    if (!res.success) {
      return { success: false, error: res.error };
    }

    revalidatePath('/dashboard/chatbot');
    revalidatePath('/dashboard/services');
    revalidatePath('/dashboard/dentists');
    revalidatePath('/dashboard/availability');

    return { success: true };
  } catch (err: unknown) {
    return { success: false, error: (err as Error)?.message || 'Failed to approve knowledge' };
  }
}

/**
 * Deletes a clinic's knowledge base source.
 */
export async function deleteKnowledgeBaseAction(clinicId: string, sourceId: string) {
  const auth = await authorizeClinicAccess(clinicId);
  if (!auth.authorized) {
    return { success: false, error: auth.error };
  }

  try {
    const res = await deleteKnowledgeSource(clinicId, sourceId);
    if (!res.success) {
      return { success: false, error: res.error };
    }

    revalidatePath('/dashboard/chatbot');
    return { success: true };
  } catch (err: unknown) {
    return { success: false, error: (err as Error)?.message || 'Failed to delete knowledge source' };
  }
}

/**
 * Retrieves the current knowledge source status for a clinic.
 */
export async function getKnowledgeStatusAction(clinicId: string) {
  const auth = await authorizeClinicAccess(clinicId);
  if (!auth.authorized) {
    return { success: false, error: auth.error };
  }

  const supabase = createClient();
  const { data: source } = await supabase
    .from('clinic_knowledge_sources')
    .select('*')
    .eq('clinic_id', clinicId)
    .order('updated_at', { ascending: false })
    .limit(1)
    .maybeSingle();

  return { success: true, source: source || null };
}

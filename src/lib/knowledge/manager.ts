import { createClient } from '@/lib/supabase/server-auth';
import { sanitizeUntrustedContent } from '@/lib/ai/guardrails';
import { StructuredExtractionResult } from './extractor';

export interface StructuredClinicKnowledge {
  clinic: {
    id: string;
    name: string;
    address?: string;
    phone?: string;
    email?: string;
    timezone: string;
  };
  services: {
    id: string;
    name: string;
    description?: string;
    duration_minutes: number;
    price?: number;
  }[];
  dentists: {
    id: string;
    name: string;
    specialty?: string;
    bio?: string;
  }[];
  hours: {
    day_of_week: number;
    open_time: string;
    close_time: string;
  }[];
  faqs: {
    id: string;
    question: string;
    answer: string;
  }[];
}

export interface IngestedWebsiteData {
  url: string;
  sanitizedContent: string;
  ingestedAt: string;
  isAuthoritative: boolean;
}

export interface ClinicKnowledgeBundle {
  trustedData: StructuredClinicKnowledge;
  untrustedWebsiteContext: IngestedWebsiteData[];
  approvedKnowledge?: StructuredExtractionResult;
}

/**
 * Saves draft crawled knowledge for dentist review and approval.
 */
export async function saveDraftKnowledgeSource(
  clinicId: string,
  organizationId: string,
  url: string,
  extracted: StructuredExtractionResult,
  crawledPagesCount: number,
  warnings: string[]
): Promise<{ success: boolean; id?: string; error?: string }> {
  if (!clinicId || !url) {
    return { success: false, error: 'Clinic ID and URL are required' };
  }

  const supabase = createClient();

  try {
    const { data, error } = await supabase
      .from('clinic_knowledge_sources')
      .upsert(
        {
          clinic_id: clinicId,
          organization_id: organizationId,
          url,
          status: 'crawled',
          pages_discovered: crawledPagesCount,
          extracted_data: extracted,
          warnings,
          last_scanned_at: new Date().toISOString(),
          updated_at: new Date().toISOString(),
        },
        { onConflict: 'clinic_id,url' }
      )
      .select('id')
      .single();

    if (error) {
      return { success: false, error: error.message };
    }

    return { success: true, id: data?.id };
  } catch (err: unknown) {
    return { success: false, error: (err as Error)?.message || 'Failed to save draft knowledge source' };
  }
}

/**
 * Commits approved knowledge into authoritative tables and marks knowledge source as published.
 */
export async function approveAndPublishKnowledge(
  clinicId: string,
  organizationId: string,
  sourceId: string,
  approvedData: StructuredExtractionResult
): Promise<{ success: boolean; error?: string }> {
  if (!clinicId || !sourceId) {
    return { success: false, error: 'Clinic ID and Source ID are required' };
  }

  const supabase = createClient();

  try {
    // 1. Update clinic profile info
    if (approvedData.clinic) {
      await supabase
        .from('clinics')
        .update({
          name: approvedData.clinic.name,
          phone: approvedData.clinic.phone || null,
          email: approvedData.clinic.email || null,
          address: approvedData.clinic.address || null,
          updated_at: new Date().toISOString(),
        })
        .eq('id', clinicId);
    }

    // 2. Publish services
    if (approvedData.services && approvedData.services.length > 0) {
      for (const srv of approvedData.services) {
        await supabase.from('services').upsert(
          {
            clinic_id: clinicId,
            name: srv.name,
            description: srv.description || null,
            duration_minutes: srv.duration_minutes || 30,
            price: srv.price || null,
            is_active: true,
            is_bookable: true,
            updated_at: new Date().toISOString(),
          },
          { onConflict: 'clinic_id,name' }
        );
      }
    }

    // 3. Publish dentists
    if (approvedData.dentists && approvedData.dentists.length > 0) {
      for (const d of approvedData.dentists) {
        await supabase.from('dentists').upsert(
          {
            clinic_id: clinicId,
            name: d.name,
            specialty: d.specialty || null,
            bio: d.bio || null,
            is_active: true,
            updated_at: new Date().toISOString(),
          },
          { onConflict: 'clinic_id,name' }
        );
      }
    }

    // 4. Publish business hours
    if (approvedData.hours && approvedData.hours.length > 0) {
      for (const h of approvedData.hours) {
        await supabase.from('business_hours').upsert(
          {
            clinic_id: clinicId,
            day_of_week: h.day_of_week,
            open_time: h.open_time,
            close_time: h.close_time,
            updated_at: new Date().toISOString(),
          },
          { onConflict: 'clinic_id,day_of_week' }
        );
      }
    }

    // 5. Publish FAQs
    if (approvedData.faqs && approvedData.faqs.length > 0) {
      for (const faq of approvedData.faqs) {
        await supabase.from('clinic_faqs').upsert(
          {
            clinic_id: clinicId,
            question: faq.question,
            answer: faq.answer,
            updated_at: new Date().toISOString(),
          },
          { onConflict: 'clinic_id,question' }
        );
      }
    }

    // 6. Mark knowledge source record as published
    await supabase
      .from('clinic_knowledge_sources')
      .update({
        status: 'published',
        extracted_data: approvedData,
        approved_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      })
      .eq('id', sourceId)
      .eq('clinic_id', clinicId);

    return { success: true };
  } catch (err: unknown) {
    return { success: false, error: (err as Error)?.message || 'Failed to approve and publish knowledge' };
  }
}

/**
 * Deletes a clinic knowledge base source.
 */
export async function deleteKnowledgeSource(
  clinicId: string,
  sourceId: string
): Promise<{ success: boolean; error?: string }> {
  if (!clinicId || !sourceId) {
    return { success: false, error: 'Clinic ID and Source ID are required' };
  }

  const supabase = createClient();

  try {
    const { error } = await supabase
      .from('clinic_knowledge_sources')
      .delete()
      .eq('id', sourceId)
      .eq('clinic_id', clinicId);

    if (error) {
      return { success: false, error: error.message };
    }

    return { success: true };
  } catch (err: unknown) {
    return { success: false, error: (err as Error)?.message || 'Failed to delete knowledge source' };
  }
}

/**
 * Ingests and sanitizes public content from an existing website.
 */
export async function ingestWebsiteContent(
  clinicId: string,
  url: string,
  rawContent: string
): Promise<{ success: boolean; data?: IngestedWebsiteData; error?: string }> {
  if (!clinicId || !url) {
    return { success: false, error: 'Clinic ID and URL are required' };
  }

  // Basic URL validation
  try {
    const parsedUrl = new URL(url);
    if (!['http:', 'https:'].includes(parsedUrl.protocol)) {
      return { success: false, error: 'Invalid URL protocol' };
    }
  } catch {
    return { success: false, error: 'Invalid website URL format' };
  }

  // 1. Strict HTML & Prompt Injection Sanitization
  const cleanedText = rawContent
    .replace(/<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi, ' ')
    .replace(/<style\b[^<]*(?:(?!<\/style>)<[^<]*)*<\/style>/gi, ' ')
    .replace(/<[^>]+>/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();

  const sanitized = sanitizeUntrustedContent(cleanedText);

  const websiteRecord: IngestedWebsiteData = {
    url,
    sanitizedContent: sanitized,
    ingestedAt: new Date().toISOString(),
    isAuthoritative: false,
  };

  return { success: true, data: websiteRecord };
}

/**
 * Retrieves the complete clinic knowledge base with strict tier separation.
 */
export async function getClinicKnowledge(
  clinicId: string,
  untrustedExcerpts: IngestedWebsiteData[] = []
): Promise<{ success: boolean; data?: ClinicKnowledgeBundle; error?: string }> {
  if (!clinicId) return { success: false, error: 'Clinic ID is required' };

  const supabase = createClient();

  try {
    // 1. Fetch Authoritative Structured Data in parallel
    const [clinicRes, servicesRes, dentistsRes, hoursRes, faqsRes] = await Promise.all([
      supabase.from('clinics').select('id, name, address, phone, email, timezone').eq('id', clinicId).single(),
      supabase
        .from('services')
        .select('id, name, description, duration_minutes, price')
        .eq('clinic_id', clinicId)
        .eq('is_active', true)
        .eq('is_bookable', true),
      supabase.from('dentists').select('id, name, specialty, bio').eq('clinic_id', clinicId).eq('is_active', true),
      supabase
        .from('business_hours')
        .select('day_of_week, open_time, close_time')
        .eq('clinic_id', clinicId)
        .order('day_of_week', { ascending: true }),
      supabase
        .from('clinic_faqs')
        .select('id, question, answer')
        .eq('clinic_id', clinicId)
        .order('created_at', { ascending: true }),
    ]);

    if (clinicRes.error || !clinicRes.data) {
      return { success: false, error: 'Clinic not found' };
    }

    let approvedKnowledge: StructuredExtractionResult | undefined;
    try {
      const { data: source } = await supabase
        .from('clinic_knowledge_sources')
        .select('*')
        .eq('clinic_id', clinicId)
        .order('updated_at', { ascending: false })
        .limit(1)
        .maybeSingle();

      if (source && source.extracted_data) {
        approvedKnowledge = source.extracted_data as StructuredExtractionResult;
      }
    } catch {
      // Graceful fallback for mock/database variations
    }

    const trustedData: StructuredClinicKnowledge = {
      clinic: clinicRes.data,
      services: servicesRes.data || [],
      dentists: dentistsRes.data || [],
      hours: hoursRes.data || [],
      faqs: faqsRes.data || [],
    };

    return {
      success: true,
      data: {
        trustedData,
        untrustedWebsiteContext: untrustedExcerpts,
        approvedKnowledge,
      },
    };
  } catch (err: unknown) {
    return { success: false, error: (err as Error)?.message || 'Failed to retrieve knowledge' };
  }
}

/**
 * Evaluates business facts using strict priority resolution.
 */
export function resolveAuthoritativeFact(
  topic: 'hours' | 'services' | 'dentists' | 'pricing',
  structuredKnowledge: StructuredClinicKnowledge,
  _untrustedWebsiteText?: string
): { factSource: 'STRUCTURED_AUTHORITATIVE'; value: unknown } {
  switch (topic) {
    case 'hours':
      return {
        factSource: 'STRUCTURED_AUTHORITATIVE',
        value: structuredKnowledge.hours,
      };
    case 'services':
      return {
        factSource: 'STRUCTURED_AUTHORITATIVE',
        value: structuredKnowledge.services,
      };
    case 'dentists':
      return {
        factSource: 'STRUCTURED_AUTHORITATIVE',
        value: structuredKnowledge.dentists,
      };
    case 'pricing':
      return {
        factSource: 'STRUCTURED_AUTHORITATIVE',
        value: structuredKnowledge.services.map((s) => ({
          service: s.name,
          price: s.price !== undefined ? `$${s.price}` : 'Contact clinic for estimate',
        })),
      };
    default:
      return {
        factSource: 'STRUCTURED_AUTHORITATIVE',
        value: structuredKnowledge,
      };
  }
}

import { createClient } from '@/lib/supabase/server-auth';
import { sanitizeUntrustedContent } from '@/lib/ai/guardrails';

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
  isAuthoritative: false; // Explicitly marked non-authoritative
}

export interface ClinicKnowledgeBundle {
  trustedData: StructuredClinicKnowledge;
  untrustedWebsiteContext: IngestedWebsiteData[];
}

/**
 * Ingests and sanitizes public content from an existing website.
 * Never grants authoritative status to scraped text.
 */
export async function ingestWebsiteContent(
  clinicId: string,
  url: string,
  rawContent: string
): Promise<{ success: boolean; data?: IngestedWebsiteData; error?: string }> {
  if (!clinicId || !url) {
    return { success: false, error: 'Clinic ID and URL are required' };
  }

  // 1. Basic URL validation
  try {
    const parsedUrl = new URL(url);
    if (!['http:', 'https:'].includes(parsedUrl.protocol)) {
      return { success: false, error: 'Invalid URL protocol' };
    }
  } catch {
    return { success: false, error: 'Invalid website URL format' };
  }

  // 2. Strict HTML & Prompt Injection Sanitization
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

  const supabase = createClient();
  try {
    // Look up clinic website if exists
    const { data: website } = await supabase
      .from('clinic_websites')
      .select('id')
      .eq('clinic_id', clinicId)
      .maybeSingle();

    if (website) {
      await supabase.from('website_pages').upsert({
        website_id: website.id,
        path: url,
        title: 'Ingested Public Content',
        content: {
          text: sanitized,
          isAuthoritative: false,
        },
      });
    }
  } catch {
    // Database storage fallback
  }

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
      supabase.from('services').select('id, name, description, duration_minutes, price').eq('clinic_id', clinicId).eq('is_active', true).eq('is_bookable', true),
      supabase.from('dentists').select('id, name, specialty, bio').eq('clinic_id', clinicId).eq('is_active', true),
      supabase.from('business_hours').select('day_of_week, open_time, close_time').eq('clinic_id', clinicId).order('day_of_week', { ascending: true }),
      supabase.from('clinic_faqs').select('id, question, answer').eq('clinic_id', clinicId).order('created_at', { ascending: true }),
    ]);

    if (clinicRes.error || !clinicRes.data) {
      return { success: false, error: 'Clinic not found' };
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
      },
    };
  } catch (err: unknown) {
    return { success: false, error: (err as Error)?.message || 'Failed to retrieve knowledge' };
  }
}

/**
 * Evaluates business facts using strict priority resolution:
 * Structured data is unconditionally authoritative over untrusted scraped website content.
 */
export function resolveAuthoritativeFact(
  topic: 'hours' | 'services' | 'dentists' | 'pricing',
  structuredKnowledge: StructuredClinicKnowledge,
  _untrustedWebsiteText?: string
): { factSource: 'STRUCTURED_AUTHORITATIVE'; value: unknown } {
  // Discard any conflicting claims in untrustedWebsiteText
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
        value: structuredKnowledge.services.map(s => ({
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

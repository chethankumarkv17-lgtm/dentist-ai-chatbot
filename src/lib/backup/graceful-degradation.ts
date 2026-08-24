export interface GracePeriodResult {
  hasAccess: boolean;
  inGracePeriod: boolean;
  daysRemainingInGrace: number;
}

export interface DomainFallbackResult {
  targetHost: string;
  isCustomDomain: boolean;
  isFallback: boolean;
  clinicSlug: string;
}

/**
 * 1. AI Receptionist Graceful Fallback
 * Generates an intuitive structured menu when OpenAI API is experiencing an outage.
 */
export function getDegradedAiResponse(
  userMessage: string,
  clinicServices: string[] = ['Teeth Cleaning', 'Emergency Exam', 'Consultation']
): string {
  const lower = userMessage.toLowerCase();

  if (lower.includes('book') || lower.includes('appointment') || lower.includes('schedule')) {
    const serviceList = clinicServices.map((s, i) => `${i + 1}. ${s}`).join('\n');
    return `Our AI conversational assistant is temporarily operating in offline mode, but you can still book! Available treatments:\n${serviceList}\n\nPlease click "Select Time" below to choose an available slot directly.`;
  }

  if (lower.includes('hour') || lower.includes('open') || lower.includes('time')) {
    return 'Our clinic is generally open Monday through Friday from 8:00 AM to 5:00 PM. Please click "Book Appointment" to see active dentist shifts.';
  }

  if (lower.includes('emergency') || lower.includes('pain') || lower.includes('urgent')) {
    return 'If you are experiencing severe dental trauma or an acute emergency, please call our direct front desk phone number immediately or visit the nearest emergency dental center.';
  }

  return 'Hello! Our receptionist is currently operating in high-availability menu mode. How may we assist you today? You can schedule an appointment or view our dental services directly below.';
}

/**
 * 2. Stripe Downtime & Subscription Grace Period
 * Ensures existing paying clinics are not locked out immediately during payment gateway or webhook downtime.
 */
export function evaluateSubscriptionGracePeriod(
  subscriptionStatus: string,
  periodEndIso: string,
  gracePeriodDays = 3
): GracePeriodResult {
  const now = Date.now();
  const periodEndMs = new Date(periodEndIso).getTime();

  // Active or trialing subscriptions always have full access
  if (['active', 'trialing'].includes(subscriptionStatus)) {
    return { hasAccess: true, inGracePeriod: false, daysRemainingInGrace: 0 };
  }

  // If status is past_due or Stripe unreachable after period end, check grace window
  const diffDays = (now - periodEndMs) / (1000 * 60 * 60 * 24);

  if (diffDays <= gracePeriodDays) {
    const daysRemaining = Math.max(0, Math.ceil(gracePeriodDays - diffDays));
    return {
      hasAccess: true,
      inGracePeriod: true,
      daysRemainingInGrace: daysRemaining,
    };
  }

  return {
    hasAccess: false,
    inGracePeriod: false,
    daysRemainingInGrace: 0,
  };
}

/**
 * 3. Custom Domain Failure & Subdomain Fallback Resolver
 * If a dental clinic's custom apex domain experiences DNS misconfiguration,
 * resolves gracefully to the platform's immutable subdomain.
 */
export function resolveClinicDomainFallback(
  hostHeader: string,
  knownClinics: Record<string, string> = { 'smiles.com': 'downtown-dental', 'ortho.org': 'metro-ortho' }
): DomainFallbackResult {
  const cleanHost = hostHeader.toLowerCase().split(':')[0];

  // Check if apex / primary platform host
  if (cleanHost === 'radiantnobel.com' || cleanHost === 'localhost' || cleanHost === '127.0.0.1') {
    return {
      targetHost: cleanHost,
      isCustomDomain: false,
      isFallback: false,
      clinicSlug: '',
    };
  }

  // Check if platform subdomain (e.g. downtown-dental.radiantnobel.com)
  if (cleanHost.endsWith('.radiantnobel.com')) {
    const slug = cleanHost.replace('.radiantnobel.com', '');
    return {
      targetHost: cleanHost,
      isCustomDomain: false,
      isFallback: false,
      clinicSlug: slug,
    };
  }

  // Custom domain lookup
  const mappedSlug = knownClinics[cleanHost];
  if (mappedSlug) {
    return {
      targetHost: cleanHost,
      isCustomDomain: true,
      isFallback: false,
      clinicSlug: mappedSlug,
    };
  }

  // Fallback domain
  return {
    targetHost: cleanHost,
    isCustomDomain: true,
    isFallback: true,
    clinicSlug: 'default-clinic',
  };
}

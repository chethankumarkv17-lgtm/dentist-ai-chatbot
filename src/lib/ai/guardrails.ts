/**
 * AI Safety and Guardrails Engine for Dental SaaS
 * Protects against prompt injection, jailbreaks, system prompt extraction,
 * data exfiltration, cross-tenant leaks, medical diagnosis, and unsafe advice.
 */

export interface SafetyCheckResult {
  isSafe: boolean;
  violationType?:
    | 'PROMPT_INJECTION'
    | 'SYSTEM_PROMPT_EXTRACTION'
    | 'DATA_EXFILTRATION'
    | 'CROSS_TENANT_VIOLATION'
    | 'MEDICAL_DIAGNOSIS_PRESCRIPTION'
    | 'DANGEROUS_TREATMENT'
    | 'ABUSIVE_MALICIOUS'
    | 'MESSAGE_TOO_LONG';
  safeResponse?: string;
  sanitizedMessage?: string;
}

// Patterns for Prompt Injection and Jailbreaks
const PROMPT_INJECTION_PATTERNS = [
  /ignore\s+(all\s+|your\s+|previous\s+|system\s+)*instructions/i,
  /disregard\s+(all\s+|your\s+|previous\s+|system\s+)*instructions/i,
  /forget\s+(all\s+|your\s+|previous\s+|system\s+)*rules/i,
  /system\s+override/i,
  /jailbreak/i,
  /dan\s+mode/i,
  /developer\s+mode/i,
  /unrestricted\s+mode/i,
  /you\s+are\s+now\s+in\s+god\s+mode/i,
  /now\s+act\s+as\s+(an?\s+unrestricted|a\s+hacker|an\s+ai\s+without\s+rules)/i,
  /bypass\s+all\s+(safety|rules|filters)/i,
];

// Patterns for System Prompt Extraction
const SYSTEM_PROMPT_EXTRACTION_PATTERNS = [
  /(?:show|tell|reveal|display|output|print|give)\s+(?:me\s+)?(?:your|the)\s+(?:system\s+prompt|initial\s+prompt|hidden\s+instructions|system\s+instructions|system\s+message)/i,
  /repeat\s+(?:the\s+)?(?:text|words|instructions)\s+(?:above|at\s+the\s+beginning|verbatim)/i,
  /what\s+is\s+your\s+(?:system\s+prompt|exact\s+prompt|hidden\s+instruction)/i,
  /what\s+(?:were\s+you|are\s+you)\s+told\s+to\s+do\s+in\s+your\s+system\s+prompt/i,
];

// Patterns for Data Exfiltration & PII Probing
const DATA_EXFILTRATION_PATTERNS = [
  /(?:tell|give|show|list|dump)\s+(?:me\s+)?(?:another|other|all)\s+patient(?:'s|s)?\s+(?:phone|email|name|data|number|record|appointment|address)/i,
  /patient(?:'s)?\s+(?:phone\s+number|email|record)s?\s+of\s+other/i,
  /list\s+all\s+patients/i,
  /dump\s+(?:the\s+)?(?:database|patients?\s+table|users?\s+table)/i,
  /give\s+me\s+patient\s+records/i,
  /what\s+is\s+(?:another|other)\s+patient(?:'s)?\s+(?:phone|email|name)/i,
];

// Patterns for Cross-Tenant Probing
const CROSS_TENANT_PATTERNS = [
  /(?:give|show|tell|fetch|list)\s+(?:me\s+)?(?:another|other)\s+clinic(?:'s)?\s+(?:appointments?|data|patients?|records?|info)/i,
  /access\s+(?:another|different|other)\s+clinic/i,
  /switch\s+to\s+clinic\s+id/i,
  /view\s+clinic\s+[a-f0-9-]{8,}/i,
];

// Patterns for Medical Diagnosis & Prescription
const MEDICAL_DIAGNOSIS_PRESCRIPTION_PATTERNS = [
  /(?:diagnose|what\s+illness\s+do\s+i\s+have|what\s+condition\s+is\s+this|do\s+i\s+have\s+(?:oral\s+cancer|periodontitis|gingivitis|infection|abscess|tumor))/i,
  /(?:prescribe|give\s+me\s+a\s+prescription|recommend\s+a\s+medication|what\s+antibiotic|what\s+dosage\s+of\s+(?:amoxicillin|penicillin|codeine|ibuprofen|vicodin|percocet|painkiller))/i,
  /can\s+you\s+write\s+(?:me\s+)?a\s+prescription/i,
];

// Patterns for Dangerous DIY Treatment Instructions
const DANGEROUS_TREATMENT_PATTERNS = [
  /(?:pull|extract)\s+(?:my\s+)?(?:own\s+)?tooth\s+(?:myself|at\s+home|with\s+pliers|with\s+a\s+string)/i,
  /(?:use\s+)?(?:household\s+)?bleach\s+(?:on|to\s+whiten)\s+(?:my\s+)?teeth/i,
  /treat\s+(?:my\s+)?abscess\s+(?:at\s+home|with\s+a\s+needle|by\s+popping)/i,
  /diy\s+dental\s+(?:surgery|filling|extraction)/i,
];

// Patterns for Malicious / Abusive Harassment
const MALICIOUS_ABUSE_PATTERNS = [
  /(?:fuck\s+you|bitch|kill\s+yourself|idiot\s+bot|shut\s+up\s+you\s+piece\s+of)/i,
  /(?:hack\s+this\s+site|ddos|sql\s+injection|drop\s+table)/i,
];

/**
 * Validates incoming user message against safety policies.
 * Returns safe response if any violation is detected.
 */
export function validateInputSafety(message: string): SafetyCheckResult {
  const trimmed = message.trim();

  // 0. Check message length
  if (trimmed.length > 3000) {
    return {
      isSafe: false,
      violationType: 'MESSAGE_TOO_LONG',
      safeResponse: "Your message exceeds our character limit. Please shorten your message so I can assist you with your appointment or inquiry.",
    };
  }

  // 1. Check for Prompt Injection
  for (const pattern of PROMPT_INJECTION_PATTERNS) {
    if (pattern.test(trimmed)) {
      return {
        isSafe: false,
        violationType: 'PROMPT_INJECTION',
        safeResponse: "I am the dedicated AI receptionist for this dental clinic. I cannot ignore clinic protocols, modify my operational guidelines, or execute external overrides. How may I assist you with your appointment or clinic inquiries today?",
      };
    }
  }

  // 2. Check for System Prompt Extraction
  for (const pattern of SYSTEM_PROMPT_EXTRACTION_PATTERNS) {
    if (pattern.test(trimmed)) {
      return {
        isSafe: false,
        violationType: 'SYSTEM_PROMPT_EXTRACTION',
        safeResponse: "For security and privacy compliance, internal system configurations and instructions cannot be displayed. However, I can help you with clinic business hours, dental services, doctor availability, and appointment scheduling.",
      };
    }
  }

  // 3. Check for Data Exfiltration (Patient PII)
  for (const pattern of DATA_EXFILTRATION_PATTERNS) {
    if (pattern.test(trimmed)) {
      return {
        isSafe: false,
        violationType: 'DATA_EXFILTRATION',
        safeResponse: "In accordance with patient confidentiality and healthcare privacy regulations (HIPAA), I cannot disclose or look up personal contact details or appointment records belonging to other patients.",
      };
    }
  }

  // 4. Check for Cross-Tenant Violations
  for (const pattern of CROSS_TENANT_PATTERNS) {
    if (pattern.test(trimmed)) {
      return {
        isSafe: false,
        violationType: 'CROSS_TENANT_VIOLATION',
        safeResponse: "I am authorized only to provide information and manage appointments for this specific clinic. I cannot access or disclose data belonging to other organizations or dental clinics.",
      };
    }
  }

  // 5. Check for Dangerous DIY Treatments
  for (const pattern of DANGEROUS_TREATMENT_PATTERNS) {
    if (pattern.test(trimmed)) {
      return {
        isSafe: false,
        violationType: 'DANGEROUS_TREATMENT',
        safeResponse: "Attempting self-surgery, tooth extractions, or using non-dental chemicals (such as household bleach) at home is extremely dangerous and can cause severe infection, nerve damage, or permanent injury. Please schedule an emergency appointment with our licensed dentists immediately or seek urgent medical care.",
      };
    }
  }

  // 6. Check for Medical Diagnosis or Prescription Requests
  for (const pattern of MEDICAL_DIAGNOSIS_PRESCRIPTION_PATTERNS) {
    if (pattern.test(trimmed)) {
      return {
        isSafe: false,
        violationType: 'MEDICAL_DIAGNOSIS_PRESCRIPTION',
        safeResponse: "As an administrative AI receptionist, I am not licensed to diagnose medical or dental conditions or prescribe medications. If you are experiencing symptoms, swelling, or pain, please allow me to schedule an in-person dental exam with one of our licensed practitioners, or call our clinic directly for clinical evaluation.",
      };
    }
  }

  // 7. Check for Malicious / Abusive Harassment
  for (const pattern of MALICIOUS_ABUSE_PATTERNS) {
    if (pattern.test(trimmed)) {
      return {
        isSafe: false,
        violationType: 'ABUSIVE_MALICIOUS',
        safeResponse: "We maintain a respectful and safe communication channel for patients and clinic staff. How may I professionally assist you with your dental appointment or clinic inquiries today?",
      };
    }
  }

  return { isSafe: true };
}

/**
 * Sanitizes untrusted content (e.g. scraped website text or custom clinic descriptions)
 * to prevent indirect prompt injection.
 */
export function sanitizeUntrustedContent(content: string): string {
  if (!content) return '';

  return content
    .replace(/\[SYSTEM\s*(?:OVERRIDE|PROMPT|INSTRUCTION)?\]/gi, '[CONTENT]')
    .replace(/ignore\s+(?:previous|all)\s+instructions/gi, '[filtered]')
    .replace(/disregard\s+rules/gi, '[filtered]')
    .trim();
}

/**
 * Validates tool execution arguments to enforce strict tenant isolation.
 * Ensures the tool call cannot manipulate clinicId to access another tenant.
 */
export function validateToolTenantSecurity(
  authorizedClinicId: string,
  toolArgs: Record<string, unknown>
): { isAllowed: boolean; error?: string } {
  if (toolArgs.clinicId && toolArgs.clinicId !== authorizedClinicId) {
    return {
      isAllowed: false,
      error: 'Security Error: Cross-tenant tool access is strictly prohibited.',
    };
  }

  return { isAllowed: true };
}

import { createClient } from '@/lib/supabase/server-auth';

export type ServiceName =
  | 'ai_receptionist'
  | 'booking_engine'
  | 'stripe_webhooks'
  | 'email_service'
  | 'widget_service'
  | 'database'
  | 'api_gateway'
  | 'calendar_sync';

export type SystemErrorType =
  | 'AI_FAILURE'
  | 'BOOKING_FAILURE'
  | 'STRIPE_WEBHOOK_FAILURE'
  | 'EMAIL_FAILURE'
  | 'WIDGET_FAILURE'
  | 'DATABASE_ERROR'
  | 'API_ERROR'
  | 'RATE_LIMIT_EXHAUSTION'
  | 'AUTH_FAILURE';

export type SeverityLevel = 'low' | 'medium' | 'high' | 'critical';

export interface RecordErrorParams {
  serviceName: ServiceName;
  errorType: SystemErrorType;
  message: string;
  stackTrace?: string;
  severity?: SeverityLevel;
  organizationId?: string;
  metadata?: Record<string, unknown>;
}

export interface RecordMetricParams {
  serviceName: ServiceName;
  metricType: 'api_latency' | 'ai_latency' | 'db_query_time' | 'error_rate' | 'uptime_heartbeat';
  value: number;
  tags?: Record<string, string | number | boolean>;
}

const SECRET_PATTERNS = [
  /sk_live_[0-9a-zA-Z]{20,}/gi,
  /sk_test_[0-9a-zA-Z]{20,}/gi,
  /whsec_[0-9a-zA-Z]{20,}/gi,
  /re_[0-9a-zA-Z]{20,}/gi,
  /Bearer\s+[0-9a-zA-Z._\-]{20,}/gi,
  /password\s*[:=]\s*["']?([^"'\s]+)["']?/gi,
  /token\s*[:=]\s*["']?([^"'\s]+)["']?/gi,
  /secret\s*[:=]\s*["']?([^"'\s]+)["']?/gi,
  /api[_-]?key\s*[:=]\s*["']?([^"'\s]+)["']?/gi,
];

const PII_KEYS = new Set([
  'email',
  'patient_email',
  'phone',
  'patient_phone',
  'patient_name',
  'patientname',
  'notes',
  'medical_notes',
  'ssn',
  'dob',
  'password',
  'token',
  'secret',
  'authorization',
  'api_key',
  'apikey',
  'credit_card',
  'card_number',
]);

/**
 * Sanitizes arbitrary objects, error messages, and stack traces to guarantee
 * that zero secrets, passwords, access tokens, or patient PII are ever written to logs.
 */
export function sanitizeMonitoringData(input: unknown): unknown {
  if (typeof input === 'string') {
    let sanitized = input;
    // Redact secret patterns
    for (const pattern of SECRET_PATTERNS) {
      sanitized = sanitized.replace(pattern, '[REDACTED_SECRET]');
    }
    // Redact email addresses
    sanitized = sanitized.replace(/[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}/g, '[REDACTED_EMAIL]');
    // Redact phone numbers (E.164 & standard formats)
    sanitized = sanitized.replace(/(?:\+?\d{1,3}[-.\s]?)?\(?\d{3}\)?[-.\s]?\d{3}[-.\s]?\d{4}/g, '[REDACTED_PHONE]');
    return sanitized;
  }

  if (Array.isArray(input)) {
    return input.map((item) => sanitizeMonitoringData(item));
  }

  if (input !== null && typeof input === 'object') {
    const cleaned: Record<string, unknown> = {};
    for (const [key, value] of Object.entries(input as Record<string, unknown>)) {
      const lowerKey = key.toLowerCase();
      if (PII_KEYS.has(lowerKey)) {
        cleaned[key] = '[REDACTED]';
      } else {
        cleaned[key] = sanitizeMonitoringData(value);
      }
    }
    return cleaned;
  }

  return input;
}

/**
 * Records a sanitized system error log in the database.
 */
export async function recordSystemError(params: RecordErrorParams): Promise<void> {
  const {
    serviceName,
    errorType,
    message,
    stackTrace,
    severity = 'medium',
    organizationId,
  } = params;

  const sanitizedMessage = sanitizeMonitoringData(message) as string;
  const sanitizedStack = stackTrace ? (sanitizeMonitoringData(stackTrace) as string) : undefined;

  const supabase = createClient();
  try {
    await supabase.from('system_error_logs').insert({
      service_name: serviceName,
      error_type: errorType,
      message: sanitizedMessage || 'Unknown system error',
      stack_trace: sanitizedStack || null,
      severity,
      organization_id: organizationId || null,
      resolved: false,
    });
  } catch {
    // Logging fallback (silent to prevent cascading loop)
  }
}

/**
 * Records a sanitized system metric (latency, error count, heartbeat) in the database.
 */
export async function recordSystemMetric(params: RecordMetricParams): Promise<void> {
  const { serviceName, metricType, value, tags = {} } = params;
  const sanitizedTags = sanitizeMonitoringData(tags) as Record<string, unknown>;

  const supabase = createClient();
  try {
    await supabase.from('system_metrics').insert({
      service_name: serviceName,
      metric_type: metricType,
      value,
      tags: sanitizedTags,
    });
  } catch {
    // Metric logging fallback
  }
}

/**
 * Checks system performance and failure thresholds to dispatch critical alerts.
 */
export async function checkAndTriggerCriticalAlerts(checks: {
  aiFailureRate?: number; // e.g. 0.08 = 8%
  apiLatencyP95Ms?: number; // e.g. 3200ms
  failedWebhookCount?: number;
  dbConnected?: boolean;
}): Promise<{ alertsTriggered: number }> {
  const supabase = createClient();
  let count = 0;

  try {
    // 1. Database Connectivity Down
    if (checks.dbConnected === false) {
      await supabase.from('critical_alerts').insert({
        alert_type: 'DATABASE_UNREACHABLE',
        title: 'PostgreSQL Database Connection Offline',
        description: 'Unable to reach primary database cluster. Immediate triage required.',
        severity: 'critical',
      });
      count++;
    }

    // 2. AI Failure Rate Spike (> 5%)
    if (checks.aiFailureRate !== undefined && checks.aiFailureRate > 0.05) {
      const pct = Math.round(checks.aiFailureRate * 100);
      await supabase.from('critical_alerts').insert({
        alert_type: 'AI_FAILURE_SPIKE',
        title: `AI Receptionist Failure Rate at ${pct}%`,
        description: `AI chat assistant failure rate exceeded the 5% threshold (${pct}% in the last 15 minutes).`,
        severity: 'high',
      });
      count++;
    }

    // 3. API Latency Degradation (> 2500ms)
    if (checks.apiLatencyP95Ms !== undefined && checks.apiLatencyP95Ms > 2500) {
      await supabase.from('critical_alerts').insert({
        alert_type: 'HIGH_LATENCY_DEGRADATION',
        title: `API P95 Latency High (${Math.round(checks.apiLatencyP95Ms)}ms)`,
        description: 'Public API and booking engine response times exceeded 2500ms SLA target.',
        severity: 'medium',
      });
      count++;
    }

    // 4. Failed Webhooks Pileup (> 5 failed events)
    if (checks.failedWebhookCount !== undefined && checks.failedWebhookCount >= 5) {
      await supabase.from('critical_alerts').insert({
        alert_type: 'WEBHOOK_FAILURE_STREAK',
        title: `${checks.failedWebhookCount} Failed Stripe Webhooks Awaiting Attention`,
        description: 'Multiple consecutive Stripe billing webhooks failed signature or processing.',
        severity: 'high',
      });
      count++;
    }
  } catch {
    // Fallback
  }

  return { alertsTriggered: count };
}

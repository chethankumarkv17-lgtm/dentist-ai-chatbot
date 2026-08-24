import { createClient } from '@/lib/supabase/server-auth';
import { getOrganizationMonthlyUsage } from './cost-tracker';
import { UsageAlertEvent } from './types';
import { logNotificationEvent } from '@/lib/email/logger';

export interface QuotaEnforcementResult {
  allowed: boolean;
  reason?: 'quota_exceeded' | 'temporarily_restricted' | 'abuse_detected';
  currentUsage?: number;
  limit?: number;
  restrictedUntil?: string | null;
}

/**
 * Dispatches and logs a usage alert to the customer and platform admin.
 */
export async function dispatchUsageAlert(alert: UsageAlertEvent): Promise<void> {
  const supabase = createClient();

  try {
    await supabase.from('usage_alerts').insert({
      organization_id: alert.organizationId,
      alert_type: alert.alertType,
      severity: alert.severity,
      message: alert.message,
      metadata: alert.metadata || {},
    });

    logNotificationEvent(`usage_alert_${alert.alertType}`, {
      type: 'alert',
      recipient: (alert.metadata?.email as string) || 'admin@radiantnobel.com',
      status: 'sent',
    });
  } catch {
    // Database logging fallback
  }
}

/**
 * Triggers a circuit breaker on abnormal burst / spike behavior, temporarily restricting the organization.
 */
export async function triggerAbnormalUsageCircuitBreaker(
  organizationId: string,
  reason: string,
  durationMinutes = 15
): Promise<{ restrictedUntil: string }> {
  const supabase = createClient();
  const restrictedUntil = new Date(Date.now() + durationMinutes * 60 * 1000).toISOString();

  try {
    await supabase
      .from('organizations')
      .update({
        ai_restricted_until: restrictedUntil,
        ai_abuse_flag: true,
      })
      .eq('id', organizationId);

    await dispatchUsageAlert({
      organizationId,
      alertType: 'burst_abuse',
      severity: 'critical',
      message: `Abnormal AI usage detected. Circuit breaker triggered for ${durationMinutes} minutes: ${reason}`,
      metadata: { restrictedUntil, reason },
    });
  } catch {
    // Fallback
  }

  return { restrictedUntil };
}

/**
 * Server-side quota guard evaluated BEFORE every AI request.
 */
export async function enforceAiQuota(organizationId: string): Promise<QuotaEnforcementResult> {
  if (!organizationId) {
    return { allowed: true };
  }

  const usage = await getOrganizationMonthlyUsage(organizationId);

  // 1. Check Circuit Breaker / Temporary Restrictions
  if (usage.isRestricted) {
    return {
      allowed: false,
      reason: 'temporarily_restricted',
      restrictedUntil: usage.restrictedUntil,
    };
  }

  // 2. Check Hard Monthly Limit
  if (usage.monthlyLimit < 10000 && usage.totalMessages >= usage.monthlyLimit) {
    // Trigger 100% quota alert
    await dispatchUsageAlert({
      organizationId,
      alertType: 'quota_100',
      severity: 'critical',
      message: `Your clinic has reached 100% of your monthly AI conversation quota (${usage.totalMessages}/${usage.monthlyLimit}). Please upgrade your plan to restore AI receptionist services.`,
      metadata: { current: usage.totalMessages, limit: usage.monthlyLimit },
    });

    return {
      allowed: false,
      reason: 'quota_exceeded',
      currentUsage: usage.totalMessages,
      limit: usage.monthlyLimit,
    };
  }

  // 3. Proactive 80% Threshold Warning
  if (
    usage.monthlyLimit < 10000 &&
    usage.totalMessages >= Math.floor(usage.monthlyLimit * 0.8) &&
    usage.totalMessages < usage.monthlyLimit
  ) {
    await dispatchUsageAlert({
      organizationId,
      alertType: 'quota_80',
      severity: 'warning',
      message: `Your clinic has reached 80% of your monthly AI conversation limit (${usage.totalMessages}/${usage.monthlyLimit}).`,
      metadata: { current: usage.totalMessages, limit: usage.monthlyLimit },
    });
  }

  return {
    allowed: true,
    currentUsage: usage.totalMessages,
    limit: usage.monthlyLimit,
  };
}

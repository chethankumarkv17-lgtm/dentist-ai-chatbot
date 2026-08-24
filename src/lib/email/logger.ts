/**
 * Safe Logging and PII Masking Utilities for Email & Notification Services
 * Ensures HIPAA & privacy compliance by never leaking full patient PII in application logs.
 */

export function maskEmail(email: string): string {
  if (!email || !email.includes('@')) return '***@***.com';
  const [user, domain] = email.split('@');
  if (user.length <= 2) {
    return `${user[0]}***@${domain}`;
  }
  return `${user[0]}***${user[user.length - 1]}@${domain}`;
}

export function maskPhone(phone: string): string {
  if (!phone) return '***-***-****';
  const cleaned = phone.replace(/\D/g, '');
  if (cleaned.length < 4) return '***-****';
  const lastFour = cleaned.slice(-4);
  return `***-***-${lastFour}`;
}

export interface SafeLogMeta {
  notificationId?: string;
  type: string;
  recipient: string;
  status: 'pending' | 'sent' | 'failed' | 'duplicate_skipped';
  attempt?: number;
  error?: string;
  idempotencyKey?: string;
}

export function logNotificationEvent(event: string, meta: SafeLogMeta): void {
  const safeMeta = {
    notificationId: meta.notificationId,
    type: meta.type,
    recipientMasked: meta.recipient.includes('@') ? maskEmail(meta.recipient) : maskPhone(meta.recipient),
    status: meta.status,
    attempt: meta.attempt || 1,
    idempotencyKey: meta.idempotencyKey,
    error: meta.error,
  };

  // Structured sanitized log line
  if (process.env.NODE_ENV !== 'test') {
    console.info(`[Notification] ${event}:`, JSON.stringify(safeMeta));
  }
}

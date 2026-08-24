export interface RateLimitResult {
  allowed: boolean;
  limit: number;
  remaining: number;
  resetInSeconds: number;
  retryAfterSeconds?: number;
  reason?: string;
}

export interface AiUsageRecord {
  organizationId: string;
  date: string;
  requestsCount: number;
  messagesCount: number;
  promptTokens: number;
  completionTokens: number;
  estimatedCostUsd: number;
}

export interface MonthlyUsageSummary {
  billingMonth: string;
  totalRequests: number;
  totalMessages: number;
  totalPromptTokens: number;
  totalCompletionTokens: number;
  totalCostUsd: number;
  appointmentsCount: number;
  dentistsCount: number;
  websitesCount: number;
  planKey: string;
  monthlyLimit: number;
  usagePercentage: number;
  isRestricted: boolean;
  restrictedUntil?: string | null;
}

export interface UsageAlertEvent {
  organizationId: string;
  alertType: 'quota_80' | 'quota_100' | 'burst_abuse' | 'abnormal_spike';
  severity: 'info' | 'warning' | 'critical';
  message: string;
  metadata?: Record<string, unknown>;
}

import { createClient } from '@/lib/supabase/server-auth';
import { MonthlyUsageSummary } from './types';
import { getPlan, PlanKey } from '@/lib/billing/plans';

export const PROMPT_TOKEN_COST_PER_1K = 0.00015;
export const COMPLETION_TOKEN_COST_PER_1K = 0.00060;

/**
 * Calculates estimated AI cost in USD from token counts.
 */
export function calculateEstimatedAiCost(promptTokens = 0, completionTokens = 0): number {
  const promptCost = (promptTokens / 1000) * PROMPT_TOKEN_COST_PER_1K;
  const completionCost = (completionTokens / 1000) * COMPLETION_TOKEN_COST_PER_1K;
  return Number((promptCost + completionCost).toFixed(6));
}

/**
 * Records AI token usage, message counts, and estimated cost for an organization.
 */
export async function recordAiUsage(
  organizationId: string,
  stats: {
    promptTokens?: number;
    completionTokens?: number;
    messagesCount?: number;
    requestsCount?: number;
  }
): Promise<void> {
  if (!organizationId) return;

  const supabase = createClient();
  const today = new Date().toISOString().split('T')[0];
  const promptTokens = stats.promptTokens || 0;
  const completionTokens = stats.completionTokens || 0;
  const messagesCount = stats.messagesCount || 1;
  const requestsCount = stats.requestsCount || 1;
  const cost = calculateEstimatedAiCost(promptTokens, completionTokens);

  try {
    const { data: existing } = await supabase
      .from('ai_usage')
      .select('id, prompt_tokens, completion_tokens, requests_count, messages_count, estimated_cost_usd')
      .eq('organization_id', organizationId)
      .eq('usage_date', today)
      .maybeSingle();

    if (existing) {
      await supabase
        .from('ai_usage')
        .update({
          prompt_tokens: (existing.prompt_tokens || 0) + promptTokens,
          completion_tokens: (existing.completion_tokens || 0) + completionTokens,
          requests_count: (existing.requests_count || 0) + requestsCount,
          messages_count: (existing.messages_count || 0) + messagesCount,
          estimated_cost_usd: Number(((Number(existing.estimated_cost_usd) || 0) + cost).toFixed(4)),
        })
        .eq('id', existing.id);
    } else {
      await supabase.from('ai_usage').insert({
        organization_id: organizationId,
        usage_date: today,
        prompt_tokens: promptTokens,
        completion_tokens: completionTokens,
        requests_count: requestsCount,
        messages_count: messagesCount,
        estimated_cost_usd: Number(cost.toFixed(4)),
      });
    }
  } catch {
    // Database usage tracking fallback
  }
}

/**
 * Aggregates monthly usage, plan quota consumption, and restriction status for an organization.
 */
export async function getOrganizationMonthlyUsage(
  organizationId: string
): Promise<MonthlyUsageSummary> {
  const supabase = createClient();
  const now = new Date();
  const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1).toISOString().split('T')[0];

  try {
    const [subRes, usageRes, orgRes, dentistsRes, websitesRes, apptsRes] = await Promise.all([
      supabase
        .from('subscriptions')
        .select('plan_id, status')
        .eq('organization_id', organizationId)
        .maybeSingle(),
      supabase
        .from('ai_usage')
        .select('prompt_tokens, completion_tokens, requests_count, messages_count, estimated_cost_usd')
        .eq('organization_id', organizationId)
        .gte('usage_date', startOfMonth),
      supabase
        .from('organizations')
        .select('ai_restricted_until, ai_abuse_flag')
        .eq('id', organizationId)
        .maybeSingle(),
      supabase
        .from('dentists')
        .select('id', { count: 'exact', head: true })
        .eq('is_active', true),
      supabase
        .from('clinic_websites')
        .select('id', { count: 'exact', head: true }),
      supabase
        .from('appointments')
        .select('id', { count: 'exact', head: true })
        .gte('created_at', startOfMonth),
    ]);

    // Resolve plan definition
    let planKey: PlanKey = 'starter';
    if (subRes.data?.plan_id) {
      const { data: planRec } = await supabase
        .from('plans')
        .select('name')
        .eq('id', subRes.data.plan_id)
        .maybeSingle();

      if (planRec?.name?.toLowerCase().includes('pro')) planKey = 'pro';
      else if (planRec?.name?.toLowerCase().includes('growth')) planKey = 'growth';
    }

    const plan = getPlan(planKey);

    // Aggregate monthly numbers
    const rows = usageRes.data || [];
    const totalPromptTokens = rows.reduce((acc, r) => acc + (r.prompt_tokens || 0), 0);
    const totalCompletionTokens = rows.reduce((acc, r) => acc + (r.completion_tokens || 0), 0);
    const totalRequests = rows.reduce((acc, r) => acc + (r.requests_count || 0), 0);
    const totalMessages = rows.reduce((acc, r) => acc + (r.messages_count || 0), 0) || Math.floor((totalPromptTokens + totalCompletionTokens) / 150);
    const totalCostUsd = rows.reduce((acc, r) => acc + (Number(r.estimated_cost_usd) || 0), 0);

    const monthlyLimit = plan.limits.aiMessagesLimit;
    const usagePercentage = monthlyLimit >= 10000 ? 0 : Math.min(100, Math.round((totalMessages / (monthlyLimit || 1)) * 100));

    const restrictedUntil = orgRes.data?.ai_restricted_until;
    const isRestricted = !!(restrictedUntil && new Date(restrictedUntil) > new Date());

    return {
      billingMonth: startOfMonth,
      totalRequests,
      totalMessages,
      totalPromptTokens,
      totalCompletionTokens,
      totalCostUsd: Number(totalCostUsd.toFixed(4)),
      appointmentsCount: apptsRes.count || 0,
      dentistsCount: dentistsRes.count || 1,
      websitesCount: websitesRes.count || 1,
      planKey,
      monthlyLimit,
      usagePercentage,
      isRestricted,
      restrictedUntil,
    };
  } catch {
    return {
      billingMonth: startOfMonth,
      totalRequests: 0,
      totalMessages: 0,
      totalPromptTokens: 0,
      totalCompletionTokens: 0,
      totalCostUsd: 0,
      appointmentsCount: 0,
      dentistsCount: 1,
      websitesCount: 1,
      planKey: 'starter',
      monthlyLimit: 500,
      usagePercentage: 0,
      isRestricted: false,
    };
  }
}

export type PlanKey = 'starter' | 'growth' | 'pro';
export type BillingInterval = 'monthly' | 'yearly';

export interface PlanLimits {
  aiMessagesLimit: number;
  dentistsLimit: number;
  websitesLimit: number;
  locationsLimit: number;
  appointmentsLimit: number;
}

export interface PlanFeatureFlags {
  customDomains: boolean;
  calendarSync: boolean;
  prioritySupport: boolean;
  customWidgetBranding: boolean;
  analyticsReports: boolean;
}

export interface PlanDefinition {
  key: PlanKey;
  name: string;
  tagline: string;
  description: string;
  monthlyPrice: number;
  yearlyPrice: number; // 2 months free equivalent
  monthlyPriceId: string;
  yearlyPriceId: string;
  popular?: boolean;
  limits: PlanLimits;
  featureFlags: PlanFeatureFlags;
  highlights: string[];
}

export const BILLING_PLANS: Record<PlanKey, PlanDefinition> = {
  starter: {
    key: 'starter',
    name: 'Starter',
    tagline: 'Essential AI Receptionist for solo practices',
    description: 'Perfect for solo dentists and small clinics looking to automate appointment bookings 24/7.',
    monthlyPrice: 99,
    yearlyPrice: 950,
    monthlyPriceId: process.env.STRIPE_STARTER_MONTHLY_PRICE_ID || 'price_starter_monthly',
    yearlyPriceId: process.env.STRIPE_STARTER_YEARLY_PRICE_ID || 'price_starter_yearly',
    limits: {
      aiMessagesLimit: 500,
      dentistsLimit: 2,
      websitesLimit: 1,
      locationsLimit: 1,
      appointmentsLimit: 150,
    },
    featureFlags: {
      customDomains: false,
      calendarSync: true,
      prioritySupport: false,
      customWidgetBranding: false,
      analyticsReports: false,
    },
    highlights: [
      '24/7 AI Dental Receptionist',
      'Up to 2 Dentists & Staff',
      '500 AI Patient Conversations/mo',
      'Embeddable Chatbot & Website Widget',
      'Google Calendar Integration',
      'Automated Email Confirmations',
    ],
  },
  growth: {
    key: 'growth',
    name: 'Growth',
    tagline: 'High-performance AI for expanding clinics',
    description: 'Designed for thriving multi-chair practices requiring advanced scheduling and custom domains.',
    monthlyPrice: 199,
    yearlyPrice: 1900,
    monthlyPriceId: process.env.STRIPE_GROWTH_MONTHLY_PRICE_ID || 'price_growth_monthly',
    yearlyPriceId: process.env.STRIPE_GROWTH_YEARLY_PRICE_ID || 'price_growth_yearly',
    popular: true,
    limits: {
      aiMessagesLimit: 2500,
      dentistsLimit: 6,
      websitesLimit: 3,
      locationsLimit: 2,
      appointmentsLimit: 600,
    },
    featureFlags: {
      customDomains: true,
      calendarSync: true,
      prioritySupport: true,
      customWidgetBranding: true,
      analyticsReports: true,
    },
    highlights: [
      'Everything in Starter, plus:',
      'Up to 6 Dentists & Hygienists',
      '2,500 AI Patient Conversations/mo',
      'Custom Domain Connection (SSL)',
      'Custom Clinic Branding & Colors',
      'Comprehensive Analytics & Reports',
      'Priority Email & Chat Support',
    ],
  },
  pro: {
    key: 'pro',
    name: 'Pro Enterprise',
    tagline: 'Maximum power for multi-location dental groups',
    description: 'Unlimited capacity, multi-location support, and dedicated healthcare onboarding.',
    monthlyPrice: 399,
    yearlyPrice: 3800,
    monthlyPriceId: process.env.STRIPE_PRO_MONTHLY_PRICE_ID || 'price_pro_monthly',
    yearlyPriceId: process.env.STRIPE_PRO_YEARLY_PRICE_ID || 'price_pro_yearly',
    limits: {
      aiMessagesLimit: 100000, // Unlimited
      dentistsLimit: 1000,
      websitesLimit: 50,
      locationsLimit: 20,
      appointmentsLimit: 100000,
    },
    featureFlags: {
      customDomains: true,
      calendarSync: true,
      prioritySupport: true,
      customWidgetBranding: true,
      analyticsReports: true,
    },
    highlights: [
      'Everything in Growth, plus:',
      'Unlimited Dentists & Staff',
      'Unlimited AI Conversations',
      'Multi-Location Dental Clinics',
      'Outlook & Google Calendar Sync',
      'Custom Knowledge Base Training',
      'Dedicated Account Manager & SLA',
    ],
  },
};

export function getPlan(key: PlanKey | string): PlanDefinition {
  const normalized = (key || '').toLowerCase() as PlanKey;
  return BILLING_PLANS[normalized] || BILLING_PLANS.starter;
}

export function getPlanByPriceId(priceId: string): { plan: PlanDefinition; interval: BillingInterval } | null {
  for (const plan of Object.values(BILLING_PLANS)) {
    if (plan.monthlyPriceId === priceId) {
      return { plan, interval: 'monthly' };
    }
    if (plan.yearlyPriceId === priceId) {
      return { plan, interval: 'yearly' };
    }
  }
  return null;
}

export function getAllPlans(): PlanDefinition[] {
  return Object.values(BILLING_PLANS);
}

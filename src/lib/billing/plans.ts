export type PlanKey = 'starter' | 'growth' | 'pro';
export type BillingInterval = 'monthly' | 'yearly';

export interface PlanLimits {
  aiMessagesLimit: number;
  dentistsLimit: number;
  websitesLimit: number;
  locationsLimit: number;
  appointmentsLimit: number;
  whatsappMessagesLimit: number;
  voiceMinutesLimit: number;
}

export interface PlanFeatureFlags {
  customDomains: boolean;
  calendarSync: boolean;
  prioritySupport: boolean;
  customWidgetBranding: boolean;
  analyticsReports: boolean;
  whatsappChannel: boolean;
  voiceAgent: boolean;
}

export interface PlanDefinition {
  key: PlanKey;
  name: string;
  tagline: string;
  description: string;
  monthlyPrice: number; // INR
  yearlyPrice: number; // INR (2 months free equivalent)
  currency: 'INR' | 'USD';
  razorpayMonthlyPlanId: string;
  razorpayYearlyPlanId: string;
  monthlyPriceId: string; // Alias for backward compatibility
  yearlyPriceId: string; // Alias for backward compatibility
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
    monthlyPrice: 2999,
    yearlyPrice: 29990,
    currency: 'INR',
    razorpayMonthlyPlanId: process.env.RAZORPAY_STARTER_MONTHLY_PLAN_ID || 'plan_starter_monthly',
    razorpayYearlyPlanId: process.env.RAZORPAY_STARTER_YEARLY_PLAN_ID || 'plan_starter_yearly',
    monthlyPriceId: process.env.RAZORPAY_STARTER_MONTHLY_PLAN_ID || 'plan_starter_monthly',
    yearlyPriceId: process.env.RAZORPAY_STARTER_YEARLY_PLAN_ID || 'plan_starter_yearly',
    limits: {
      aiMessagesLimit: 500,
      dentistsLimit: 2,
      websitesLimit: 1,
      locationsLimit: 1,
      appointmentsLimit: 150,
      whatsappMessagesLimit: 100,
      voiceMinutesLimit: 0,
    },
    featureFlags: {
      customDomains: false,
      calendarSync: true,
      prioritySupport: false,
      customWidgetBranding: false,
      analyticsReports: false,
      whatsappChannel: false,
      voiceAgent: false,
    },
    highlights: [
      '24/7 AI Dental Receptionist',
      'UPI / Cards / Netbanking Payment',
      'Up to 2 Dentists & Staff',
      '500 AI Patient Conversations/mo',
      'Embeddable Chatbot & Website Widget',
      'Google Calendar Integration',
      'Automated Email & SMS Confirmations',
    ],
  },
  growth: {
    key: 'growth',
    name: 'Growth',
    tagline: 'High-performance AI for expanding clinics',
    description: 'Designed for thriving multi-chair practices requiring advanced scheduling, WhatsApp, and custom domains.',
    monthlyPrice: 5999,
    yearlyPrice: 59990,
    currency: 'INR',
    razorpayMonthlyPlanId: process.env.RAZORPAY_GROWTH_MONTHLY_PLAN_ID || 'plan_growth_monthly',
    razorpayYearlyPlanId: process.env.RAZORPAY_GROWTH_YEARLY_PLAN_ID || 'plan_growth_yearly',
    monthlyPriceId: process.env.RAZORPAY_GROWTH_MONTHLY_PLAN_ID || 'plan_growth_monthly',
    yearlyPriceId: process.env.RAZORPAY_GROWTH_YEARLY_PLAN_ID || 'plan_growth_yearly',
    popular: true,
    limits: {
      aiMessagesLimit: 2500,
      dentistsLimit: 6,
      websitesLimit: 3,
      locationsLimit: 2,
      appointmentsLimit: 600,
      whatsappMessagesLimit: 1000,
      voiceMinutesLimit: 0,
    },
    featureFlags: {
      customDomains: true,
      calendarSync: true,
      prioritySupport: true,
      customWidgetBranding: true,
      analyticsReports: true,
      whatsappChannel: true,
      voiceAgent: false,
    },
    highlights: [
      'Everything in Starter, plus:',
      'WhatsApp Business Booking Channel',
      'UPI Intent & AutoPay Support',
      'Up to 6 Dentists & Hygienists',
      '2,500 AI Patient Conversations/mo',
      'Custom Domain Connection (SSL)',
      'Custom Clinic Branding & Colors',
      'Comprehensive Analytics & Reports',
      'Priority Email & WhatsApp Support',
    ],
  },
  pro: {
    key: 'pro',
    name: 'Pro Enterprise',
    tagline: 'Maximum power for multi-location dental groups',
    description: 'Unlimited capacity, multi-location support, AI Voice Receptionist, and dedicated healthcare onboarding.',
    monthlyPrice: 11999,
    yearlyPrice: 119990,
    currency: 'INR',
    razorpayMonthlyPlanId: process.env.RAZORPAY_PRO_MONTHLY_PLAN_ID || 'plan_pro_monthly',
    razorpayYearlyPlanId: process.env.RAZORPAY_PRO_YEARLY_PLAN_ID || 'plan_pro_yearly',
    monthlyPriceId: process.env.RAZORPAY_PRO_MONTHLY_PLAN_ID || 'plan_pro_monthly',
    yearlyPriceId: process.env.RAZORPAY_PRO_YEARLY_PLAN_ID || 'plan_pro_yearly',
    limits: {
      aiMessagesLimit: 100000, // Unlimited
      dentistsLimit: 1000,
      websitesLimit: 50,
      locationsLimit: 20,
      appointmentsLimit: 100000,
      whatsappMessagesLimit: 100000,
      voiceMinutesLimit: 500,
    },
    featureFlags: {
      customDomains: true,
      calendarSync: true,
      prioritySupport: true,
      customWidgetBranding: true,
      analyticsReports: true,
      whatsappChannel: true,
      voiceAgent: true,
    },
    highlights: [
      'Everything in Growth, plus:',
      '24/7 AI Voice Phone Receptionist (500 mins/mo)',
      'Unlimited Dentists & Staff',
      'Unlimited AI Conversations & WhatsApp',
      'Multi-Location Dental Clinics',
      'Outlook & Google Calendar Sync',
      'Custom Knowledge Base Training',
      'Dedicated Account Manager & SLA',
    ],
  },
};

export function getPlan(key: PlanKey | string): PlanDefinition {
  const normalizedKey = (key || 'starter').toLowerCase();
  if (normalizedKey in BILLING_PLANS) {
    return BILLING_PLANS[normalizedKey as PlanKey];
  }
  return BILLING_PLANS.starter;
}

export function getPlanByPriceId(priceId: string): { plan: PlanDefinition; interval: BillingInterval } | null {
  for (const plan of Object.values(BILLING_PLANS)) {
    if (plan.razorpayMonthlyPlanId === priceId || plan.monthlyPriceId === priceId) {
      return { plan, interval: 'monthly' };
    }
    if (plan.razorpayYearlyPlanId === priceId || plan.yearlyPriceId === priceId) {
      return { plan, interval: 'yearly' };
    }
  }
  return null;
}

export const getPlanByRazorpayPlanId = getPlanByPriceId;

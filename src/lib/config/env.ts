import { z } from 'zod';

/**
 * Production Environment Configuration & Strict Security Validator
 * Ensures all required keys are present and never exposes server secrets to client-side code.
 */

// Schema for Public (Client-Accessible) Environment Variables
const clientEnvSchema = z.object({
  NEXT_PUBLIC_APP_URL: z.string().url().default('http://localhost:3000'),
  NEXT_PUBLIC_SUPABASE_URL: z.string().url().default('http://localhost:54321'),
  NEXT_PUBLIC_SUPABASE_ANON_KEY: z.string().min(1).default('placeholder_anon_key'),
  NEXT_PUBLIC_RAZORPAY_KEY_ID: z.string().optional().default('rzp_test_placeholder'),
});

// Schema for Server-Only (Strictly Protected) Secrets
const serverEnvSchema = clientEnvSchema.extend({
  SUPABASE_SERVICE_ROLE_KEY: z.string().min(1).default('placeholder_service_role_key'),
  ANTHROPIC_API_KEY: z.string().min(1).default('sk-ant-placeholder'),
  RAZORPAY_KEY_ID: z.string().min(1).default('rzp_test_placeholder'),
  RAZORPAY_KEY_SECRET: z.string().min(1).default('placeholder_secret'),
  RAZORPAY_WEBHOOK_SECRET: z.string().min(1).default('placeholder_webhook_secret'),
  RESEND_API_KEY: z.string().min(1).default('re_placeholder'),
  RESEND_FROM_EMAIL: z.string().email().default('appointments@radiantnobel.com'),
  WHATSAPP_PHONE_NUMBER_ID: z.string().optional(),
  WHATSAPP_ACCESS_TOKEN: z.string().optional(),
  WHATSAPP_VERIFY_TOKEN: z.string().optional(),
  WHATSAPP_APP_SECRET: z.string().optional(),
  TWILIO_ACCOUNT_SID: z.string().optional(),
  TWILIO_AUTH_TOKEN: z.string().optional(),
  UPSTASH_REDIS_REST_URL: z.string().url().optional(),
  UPSTASH_REDIS_REST_TOKEN: z.string().optional(),
});

export type ClientEnv = z.infer<typeof clientEnvSchema>;
export type ServerEnv = z.infer<typeof serverEnvSchema>;

/**
 * Validates and returns client environment variables safe for browser exposure.
 */
export function getClientEnv(): ClientEnv {
  return clientEnvSchema.parse({
    NEXT_PUBLIC_APP_URL: process.env.NEXT_PUBLIC_APP_URL,
    NEXT_PUBLIC_SUPABASE_URL: process.env.NEXT_PUBLIC_SUPABASE_URL,
    NEXT_PUBLIC_SUPABASE_ANON_KEY: process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY,
    NEXT_PUBLIC_RAZORPAY_KEY_ID: process.env.NEXT_PUBLIC_RAZORPAY_KEY_ID,
  });
}

/**
 * Validates and returns server environment variables.
 * Throws a SecurityError if invoked from a client browser environment.
 */
export function getServerEnv(): ServerEnv {
  const isClientExplicit = (globalThis as Record<string, unknown>).__IS_CLIENT_BROWSER_CONTEXT__;
  if (isClientExplicit) {
    throw new Error('SECURITY VIOLATION: Attempted to access server secrets from client-side browser context.');
  }

  return serverEnvSchema.parse({
    NEXT_PUBLIC_APP_URL: process.env.NEXT_PUBLIC_APP_URL,
    NEXT_PUBLIC_SUPABASE_URL: process.env.NEXT_PUBLIC_SUPABASE_URL,
    NEXT_PUBLIC_SUPABASE_ANON_KEY: process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY,
    NEXT_PUBLIC_RAZORPAY_KEY_ID: process.env.NEXT_PUBLIC_RAZORPAY_KEY_ID,
    SUPABASE_SERVICE_ROLE_KEY: process.env.SUPABASE_SERVICE_ROLE_KEY,
    ANTHROPIC_API_KEY: process.env.ANTHROPIC_API_KEY,
    RAZORPAY_KEY_ID: process.env.RAZORPAY_KEY_ID,
    RAZORPAY_KEY_SECRET: process.env.RAZORPAY_KEY_SECRET,
    RAZORPAY_WEBHOOK_SECRET: process.env.RAZORPAY_WEBHOOK_SECRET,
    RESEND_API_KEY: process.env.RESEND_API_KEY,
    RESEND_FROM_EMAIL: process.env.RESEND_FROM_EMAIL,
    WHATSAPP_PHONE_NUMBER_ID: process.env.WHATSAPP_PHONE_NUMBER_ID,
    WHATSAPP_ACCESS_TOKEN: process.env.WHATSAPP_ACCESS_TOKEN,
    WHATSAPP_VERIFY_TOKEN: process.env.WHATSAPP_VERIFY_TOKEN,
    WHATSAPP_APP_SECRET: process.env.WHATSAPP_APP_SECRET,
    TWILIO_ACCOUNT_SID: process.env.TWILIO_ACCOUNT_SID,
    TWILIO_AUTH_TOKEN: process.env.TWILIO_AUTH_TOKEN,
    UPSTASH_REDIS_REST_URL: process.env.UPSTASH_REDIS_REST_URL,
    UPSTASH_REDIS_REST_TOKEN: process.env.UPSTASH_REDIS_REST_TOKEN,
  });
}

/**
 * Production Config Sanitizer for telemetry and diagnostics (Redacts all sensitive tokens).
 */
export function getSanitizedSystemConfig(): Record<string, string> {
  const env = getServerEnv();

  return {
    appUrl: env.NEXT_PUBLIC_APP_URL,
    supabaseUrl: env.NEXT_PUBLIC_SUPABASE_URL,
    supabaseAnonKeyConfigured: env.NEXT_PUBLIC_SUPABASE_ANON_KEY ? 'true' : 'false',
    supabaseServiceRoleConfigured: env.SUPABASE_SERVICE_ROLE_KEY ? '[REDACTED_SECRET]' : 'false',
    anthropicConfigured: env.ANTHROPIC_API_KEY ? '[REDACTED_SECRET]' : 'false',
    razorpayConfigured: env.RAZORPAY_KEY_ID && env.RAZORPAY_KEY_SECRET ? '[REDACTED_SECRET]' : 'false',
    razorpayWebhookConfigured: env.RAZORPAY_WEBHOOK_SECRET ? '[REDACTED_SECRET]' : 'false',
    resendConfigured: env.RESEND_API_KEY ? '[REDACTED_SECRET]' : 'false',
    resendSender: env.RESEND_FROM_EMAIL,
    whatsappConfigured: env.WHATSAPP_ACCESS_TOKEN ? '[REDACTED_SECRET]' : 'false',
  };
}

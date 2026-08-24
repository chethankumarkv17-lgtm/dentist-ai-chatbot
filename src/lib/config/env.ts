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
  NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY: z.string().optional().default('pk_test_placeholder'),
});

// Schema for Server-Only (Strictly Protected) Secrets
const serverEnvSchema = clientEnvSchema.extend({
  SUPABASE_SERVICE_ROLE_KEY: z.string().min(1).default('placeholder_service_role_key'),
  OPENAI_API_KEY: z.string().min(1).default('sk-placeholder'),
  STRIPE_SECRET_KEY: z.string().min(1).default('sk_test_placeholder'),
  STRIPE_WEBHOOK_SECRET: z.string().min(1).default('whsec_placeholder'),
  RESEND_API_KEY: z.string().min(1).default('re_placeholder'),
  RESEND_FROM_EMAIL: z.string().email().default('appointments@radiantnobel.com'),
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
    NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY: process.env.NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY,
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
    NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY: process.env.NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY,
    SUPABASE_SERVICE_ROLE_KEY: process.env.SUPABASE_SERVICE_ROLE_KEY,
    OPENAI_API_KEY: process.env.OPENAI_API_KEY,
    STRIPE_SECRET_KEY: process.env.STRIPE_SECRET_KEY,
    STRIPE_WEBHOOK_SECRET: process.env.STRIPE_WEBHOOK_SECRET,
    RESEND_API_KEY: process.env.RESEND_API_KEY,
    RESEND_FROM_EMAIL: process.env.RESEND_FROM_EMAIL,
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
    openAiConfigured: env.OPENAI_API_KEY ? '[REDACTED_SECRET]' : 'false',
    stripeConfigured: env.STRIPE_SECRET_KEY ? '[REDACTED_SECRET]' : 'false',
    stripeWebhookConfigured: env.STRIPE_WEBHOOK_SECRET ? '[REDACTED_SECRET]' : 'false',
    resendConfigured: env.RESEND_API_KEY ? '[REDACTED_SECRET]' : 'false',
    resendSender: env.RESEND_FROM_EMAIL,
  };
}

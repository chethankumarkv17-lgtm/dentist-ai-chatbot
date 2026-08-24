import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import { getClientEnv, getServerEnv, getSanitizedSystemConfig } from './env';

describe('Phase 38 — Production Configuration & Security Isolation Suite', () => {
  beforeEach(() => {
    delete (globalThis as Record<string, unknown>).__IS_CLIENT_BROWSER_CONTEXT__;
  });

  afterEach(() => {
    delete (globalThis as Record<string, unknown>).__IS_CLIENT_BROWSER_CONTEXT__;
  });

  describe('1. Client Environment Safety', () => {
    it('returns only public variables without server secrets', () => {
      const clientEnv = getClientEnv();

      expect(clientEnv.NEXT_PUBLIC_APP_URL).toBeDefined();
      expect(clientEnv.NEXT_PUBLIC_SUPABASE_URL).toBeDefined();
      expect(clientEnv.NEXT_PUBLIC_SUPABASE_ANON_KEY).toBeDefined();

      // Ensure server secrets are NOT properties of clientEnv
      expect((clientEnv as Record<string, unknown>).SUPABASE_SERVICE_ROLE_KEY).toBeUndefined();
      expect((clientEnv as Record<string, unknown>).ANTHROPIC_API_KEY).toBeUndefined();
      expect((clientEnv as Record<string, unknown>).RAZORPAY_KEY_SECRET).toBeUndefined();
      expect((clientEnv as Record<string, unknown>).RAZORPAY_WEBHOOK_SECRET).toBeUndefined();
      expect((clientEnv as Record<string, unknown>).RESEND_API_KEY).toBeUndefined();
    });
  });

  describe('2. Server Environment Security Enforcement', () => {
    it('successfully retrieves server configuration in Node.js server context', () => {
      const serverEnv = getServerEnv();

      expect(serverEnv.NEXT_PUBLIC_APP_URL).toBeDefined();
      expect(serverEnv.SUPABASE_SERVICE_ROLE_KEY).toBeDefined();
      expect(serverEnv.ANTHROPIC_API_KEY).toBeDefined();
      expect(serverEnv.RAZORPAY_KEY_SECRET).toBeDefined();
      expect(serverEnv.RESEND_API_KEY).toBeDefined();
    });

    it('blocks access to server secrets and throws error if invoked from client-side browser context', () => {
      (globalThis as Record<string, unknown>).__IS_CLIENT_BROWSER_CONTEXT__ = true;

      expect(() => getServerEnv()).toThrowError(
        'SECURITY VIOLATION: Attempted to access server secrets from client-side browser context.'
      );
    });
  });

  describe('3. Production Config Sanitization (Zero-Secret Printing)', () => {
    it('redacts all sensitive production credentials before diagnostic output', () => {
      const sanitized = getSanitizedSystemConfig();

      expect(sanitized.appUrl).toBeDefined();
      expect(sanitized.supabaseServiceRoleConfigured).toContain('[REDACTED_SECRET]');
      expect(sanitized.anthropicConfigured).toContain('[REDACTED_SECRET]');
      expect(sanitized.razorpayConfigured).toContain('[REDACTED_SECRET]');
      expect(sanitized.razorpayWebhookConfigured).toContain('[REDACTED_SECRET]');
      expect(sanitized.resendConfigured).toContain('[REDACTED_SECRET]');

      // Must never contain actual secret values
      for (const val of Object.values(sanitized)) {
        expect(val).not.toContain('sk_live');
        expect(val).not.toContain('sk_test_real');
      }
    });
  });
});

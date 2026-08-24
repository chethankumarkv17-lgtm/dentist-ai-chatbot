import { describe, it, expect } from 'vitest';
import {
  computeBackupChecksum,
  verifyBackupArchive,
  simulateDatabaseRestoration,
  BackupArchive,
} from './verifier';
import {
  getDegradedAiResponse,
  evaluateSubscriptionGracePeriod,
  resolveClinicDomainFallback,
} from './graceful-degradation';

describe('Phase 31 — Backup Verification & Disaster Recovery', () => {
  const sampleBackupData = {
    organizations: [{ id: 'org-1', name: 'Downtown Dental' }],
    clinics: [{ id: 'c1', organization_id: 'org-1', name: 'Downtown Main' }],
    dentists: [{ id: 'd1', organization_id: 'org-1', name: 'Dr. Jane Smith' }],
    services: [{ id: 's1', organization_id: 'org-1', name: 'Cleaning', duration: 30 }],
    appointments: [{ id: 'a1', organization_id: 'org-1', patient_name: 'John Doe' }],
    subscriptions: [{ id: 'sub-1', organization_id: 'org-1', status: 'active' }],
  };

  const validArchive: BackupArchive = {
    manifest: {
      version: '1.0.0',
      timestamp: '2026-08-23T02:00:00Z',
      sourceEnvironment: 'production',
      checksum: computeBackupChecksum(sampleBackupData),
      tableCounts: {
        organizations: 1,
        clinics: 1,
        dentists: 1,
        services: 1,
        appointments: 1,
        subscriptions: 1,
      },
    },
    data: sampleBackupData,
  };

  describe('1. Backup Verification & Checksum Validation', () => {
    it('verifies a healthy, valid database backup archive', () => {
      const result = verifyBackupArchive(validArchive);
      expect(result.isValid).toBe(true);
      expect(result.checksumValid).toBe(true);
      expect(result.schemaComplete).toBe(true);
      expect(result.totalRecords).toBe(6);
    });

    it('rejects backup with corrupted/tampered checksum', () => {
      const tamperedArchive: BackupArchive = {
        ...validArchive,
        manifest: {
          ...validArchive.manifest,
          checksum: 'sha256-mock-tampered-12345',
        },
      };

      const result = verifyBackupArchive(tamperedArchive);
      expect(result.isValid).toBe(false);
      expect(result.checksumValid).toBe(false);
      expect(result.error).toContain('checksum mismatch');
    });

    it('rejects backup missing essential tables', () => {
      const incompleteData = { ...sampleBackupData };
      delete (incompleteData as Partial<typeof sampleBackupData>).appointments;

      const incompleteArchive = {
        manifest: {
          ...validArchive.manifest,
          checksum: computeBackupChecksum(incompleteData),
        },
        data: incompleteData,
      };

      const result = verifyBackupArchive(incompleteArchive);
      expect(result.isValid).toBe(false);
      expect(result.schemaComplete).toBe(false);
      expect(result.missingTables).toContain('appointments');
    });
  });

  describe('2. Test Restoration in Staging Environment', () => {
    it('simulates transactional database restoration successfully', () => {
      const restoreResult = simulateDatabaseRestoration(validArchive);
      expect(restoreResult.success).toBe(true);
      expect(restoreResult.restoredTables.length).toBe(6);
      expect(restoreResult.restoredRecordsCount).toBe(6);
      expect(restoreResult.durationMs).toBeGreaterThanOrEqual(0);
    });
  });

  describe('3. Graceful Degradation on Third-Party Failures', () => {
    it('provides structured interactive menu when OpenAI API is unreachable', () => {
      const degraded = getDegradedAiResponse('I need to book an appointment', ['Cleaning', 'Filling']);
      expect(degraded).toContain('Available treatments');
      expect(degraded).toContain('Cleaning');
      expect(degraded).toContain('Select Time');
    });

    it('provides immediate emergency triage advice in degraded AI mode', () => {
      const emergency = getDegradedAiResponse('My tooth is broken and I am in severe emergency pain');
      expect(emergency).toContain('acute emergency');
      expect(emergency).toContain('nearest emergency dental center');
    });

    it('allows 3-day grace period during Stripe billing / payment gateway downtime', () => {
      // Subscription past due 1 day ago
      const yesterday = new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString();
      const grace = evaluateSubscriptionGracePeriod('past_due', yesterday);

      expect(grace.hasAccess).toBe(true);
      expect(grace.inGracePeriod).toBe(true);
      expect(grace.daysRemainingInGrace).toBe(2);
    });

    it('denies access once grace period expires after Stripe downtime', () => {
      // Subscription past due 5 days ago (limit is 3 days)
      const fiveDaysAgo = new Date(Date.now() - 5 * 24 * 60 * 60 * 1000).toISOString();
      const expired = evaluateSubscriptionGracePeriod('past_due', fiveDaysAgo);

      expect(expired.hasAccess).toBe(false);
      expect(expired.inGracePeriod).toBe(false);
    });

    it('falls back to platform subdomain when custom domain DNS fails', () => {
      const known = resolveClinicDomainFallback('smiles.com');
      expect(known.isCustomDomain).toBe(true);
      expect(known.clinicSlug).toBe('downtown-dental');

      const subdomain = resolveClinicDomainFallback('uptown-smile.radiantnobel.com');
      expect(subdomain.isCustomDomain).toBe(false);
      expect(subdomain.clinicSlug).toBe('uptown-smile');
    });
  });
});

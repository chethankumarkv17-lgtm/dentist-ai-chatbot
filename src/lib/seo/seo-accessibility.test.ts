import { describe, it, expect } from 'vitest';
import sitemap from '@/app/sitemap';
import robots from '@/app/robots';
import {
  generateDentalClinicSchema,
  generateSaaSSoftwareSchema,
  generateBreadcrumbSchema,
} from './structured-data';

describe('Phase 35 — Accessibility and SEO Test Suite', () => {
  describe('1. Sitemap Generation & Privacy Protection', () => {
    it('generates complete sitemap for all public routes with proper priorities', () => {
      const sitemapEntries = sitemap();

      expect(sitemapEntries.length).toBeGreaterThanOrEqual(15);

      const urls = sitemapEntries.map((e) => e.url);
      expect(urls.some((u) => u.endsWith('/pricing'))).toBe(true);
      expect(urls.some((u) => u.endsWith('/features'))).toBe(true);
      expect(urls.some((u) => u.endsWith('/help'))).toBe(true);
      expect(urls.some((u) => u.endsWith('/help/ai-receptionist-setup'))).toBe(true);
      expect(urls.some((u) => u.endsWith('/privacy'))).toBe(true);
      expect(urls.some((u) => u.endsWith('/terms'))).toBe(true);
    });

    it('strictly excludes private clinic, admin, and patient data from sitemap', () => {
      const sitemapEntries = sitemap();
      const urls = sitemapEntries.map((e) => e.url);

      expect(urls.some((u) => u.includes('/dashboard'))).toBe(false);
      expect(urls.some((u) => u.includes('/admin'))).toBe(false);
      expect(urls.some((u) => u.includes('/api/'))).toBe(false);
      expect(urls.some((u) => u.includes('/onboarding'))).toBe(false);
    });
  });

  describe('2. Robots.txt Configuration', () => {
    it('configures search engine crawlers with strict privacy disallows', () => {
      const robotsConfig = robots();

      expect(robotsConfig.rules).toBeDefined();
      const rules = Array.isArray(robotsConfig.rules) ? robotsConfig.rules[0] : robotsConfig.rules;

      expect(rules.allow).toBe('/');
      expect(rules.disallow).toContain('/dashboard/');
      expect(rules.disallow).toContain('/admin/');
      expect(rules.disallow).toContain('/api/');
      expect(rules.disallow).toContain('/onboarding');
      expect(robotsConfig.sitemap).toContain('sitemap.xml');
    });
  });

  describe('3. JSON-LD Structured Data Schema Generation', () => {
    it('generates valid Schema.org Dentist rich snippet metadata', () => {
      const clinicSchema = generateDentalClinicSchema({
        name: 'Apex Dental Care',
        url: 'https://apexdental.com',
        telephone: '+1-555-0199',
        email: 'info@apexdental.com',
        address: {
          streetAddress: '456 High St',
          addressLocality: 'Boston',
          addressRegion: 'MA',
          postalCode: '02108',
        },
        services: ['Dental Implants', 'Teeth Whitening'],
      });

      expect(clinicSchema['@context']).toBe('https://schema.org');
      expect(clinicSchema['@type']).toBe('Dentist');
      expect(clinicSchema.name).toBe('Apex Dental Care');
      expect(clinicSchema.medicalSpecialty).toBe('Dentistry');
      expect(clinicSchema.address).toBeDefined();
      expect(Array.isArray(clinicSchema.availableService)).toBe(true);
      expect(Array.isArray(clinicSchema.openingHoursSpecification)).toBe(true);
    });

    it('generates valid SoftwareApplication schema for SaaS product', () => {
      const softwareSchema = generateSaaSSoftwareSchema();

      expect(softwareSchema['@context']).toBe('https://schema.org');
      expect(softwareSchema['@type']).toBe('SoftwareApplication');
      expect(softwareSchema.name).toBe('Radiant Nobel');
      expect(softwareSchema.applicationCategory).toContain('HealthApplication');
      expect(softwareSchema.offers).toBeDefined();
    });

    it('generates valid BreadcrumbList structured data', () => {
      const breadcrumbs = generateBreadcrumbSchema([
        { name: 'Home', item: 'https://radiantnobel.com' },
        { name: 'Help Center', item: 'https://radiantnobel.com/help' },
        { name: 'AI Setup', item: 'https://radiantnobel.com/help/ai-receptionist-setup' },
      ]);

      expect(breadcrumbs['@type']).toBe('BreadcrumbList');
      expect(Array.isArray(breadcrumbs.itemListElement)).toBe(true);
      expect((breadcrumbs.itemListElement as unknown[]).length).toBe(3);
    });
  });
});

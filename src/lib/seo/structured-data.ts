/**
 * JSON-LD Structured Data Generators for Dental Clinics and SaaS Marketing Pages
 * Enhances search engine visibility (Rich Snippets, Local Pack, Breadcrumbs)
 */

export interface DentalClinicSchemaOptions {
  name: string;
  description?: string;
  url: string;
  telephone?: string;
  email?: string;
  address?: {
    streetAddress?: string;
    addressLocality?: string;
    addressRegion?: string;
    postalCode?: string;
    addressCountry?: string;
  };
  openingHours?: {
    dayOfWeek: string[];
    opens: string;
    closes: string;
  }[];
  services?: string[];
  priceRange?: string;
  image?: string;
}

export function generateDentalClinicSchema(options: DentalClinicSchemaOptions): Record<string, unknown> {
  return {
    '@context': 'https://schema.org',
    '@type': 'Dentist',
    name: options.name,
    description: options.description || `${options.name} provides modern, gentle dental care and online appointment booking.`,
    url: options.url,
    telephone: options.telephone || '+1-555-0100',
    email: options.email || 'info@clinic.com',
    priceRange: options.priceRange || '$$',
    image: options.image || `${options.url}/og-image.jpg`,
    medicalSpecialty: 'Dentistry',
    address: {
      '@type': 'PostalAddress',
      streetAddress: options.address?.streetAddress || '123 Dental Practice Way',
      addressLocality: options.address?.addressLocality || 'New York',
      addressRegion: options.address?.addressRegion || 'NY',
      postalCode: options.address?.postalCode || '10001',
      addressCountry: options.address?.addressCountry || 'US',
    },
    openingHoursSpecification: options.openingHours?.map((h) => ({
      '@type': 'OpeningHoursSpecification',
      dayOfWeek: h.dayOfWeek,
      opens: h.opens,
      closes: h.closes,
    })) || [
      {
        '@type': 'OpeningHoursSpecification',
        dayOfWeek: ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday'],
        opens: '08:00',
        closes: '17:00',
      },
    ],
    availableService: options.services?.map((s) => ({
      '@type': 'MedicalProcedure',
      name: s,
      procedureType: 'https://schema.org/NoninvasiveProcedure',
    })) || [
      { '@type': 'MedicalProcedure', name: 'Dental Examination & Teeth Cleaning' },
      { '@type': 'MedicalProcedure', name: 'Composite Dental Fillings' },
      { '@type': 'MedicalProcedure', name: 'Cosmetic Teeth Whitening' },
    ],
  };
}

export function generateSaaSSoftwareSchema(): Record<string, unknown> {
  const baseUrl = process.env.NEXT_PUBLIC_APP_URL || 'https://radiantnobel.com';

  return {
    '@context': 'https://schema.org',
    '@type': 'SoftwareApplication',
    name: 'Radiant Nobel',
    applicationCategory: 'HealthApplication, BusinessApplication',
    operatingSystem: 'Web, Cloud',
    description: 'Autonomous AI Dental Receptionist & Practice Management SaaS for modern dental clinics.',
    url: baseUrl,
    offers: {
      '@type': 'AggregateOffer',
      priceCurrency: 'USD',
      lowPrice: '99',
      highPrice: '399',
      offerCount: '3',
    },
    aggregateRating: {
      '@type': 'AggregateRating',
      ratingValue: '4.9',
      ratingCount: '128',
      bestRating: '5',
      worstRating: '1',
    },
  };
}

export function generateBreadcrumbSchema(
  items: { name: string; item: string }[]
): Record<string, unknown> {
  return {
    '@context': 'https://schema.org',
    '@type': 'BreadcrumbList',
    itemListElement: items.map((crumb, index) => ({
      '@type': 'ListItem',
      position: index + 1,
      name: crumb.name,
      item: crumb.item,
    })),
  };
}

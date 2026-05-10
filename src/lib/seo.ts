/**
 * SEO constants and structured data generators for Clinic OS.
 * All public-facing pages should use the SEO component with data from this file.
 */

export const SITE_URL = 'https://clinic-os-beige.vercel.app';
export const SITE_NAME = 'ClinicOS';
export const DEFAULT_IMAGE = `${SITE_URL}/icons/icon-512.png`;

// ── Per-page SEO data ─────────────────────────────────────────────────────────

export const SEO_DATA = {
  landing: {
    title: 'ClinicOS — نظام إدارة العيادات الاحترافي | Clinic Management System',
    description:
      'ClinicOS هو نظام إدارة عيادات متكامل وثنائي اللغة (عربي/إنجليزي). إدارة طابور المرضى، الوصفات الطبية الذكية، التحليلات المالية، والتقارير — كل ذلك في منصة واحدة سهلة وآمنة.',
    keywords:
      'نظام إدارة عيادات, برنامج عيادة, طابور مرضى, وصفة طبية, تحليلات طبية, ClinicOS, clinic management, patient queue, medical software, hospital management, EMR, electronic medical records',
    canonical: '/',
  },
  track: {
    title: 'تتبع دورك في الانتظار | Patient Queue Tracker — ClinicOS',
    description:
      'تتبع موقعك في طابور انتظار العيادة بسهولة. أدخل رقم هاتفك لمعرفة ترتيبك الحالي وموعد دورك دون الحاجة لتسجيل دخول.',
    keywords:
      'تتبع دور المريض, طابور عيادة, انتظار عيادة, patient queue tracker, clinic wait time, queue number',
    canonical: '/track',
  },
} as const;

// ── Structured Data Generators (Schema.org / JSON-LD) ─────────────────────────

/** SoftwareApplication schema for the landing page */
export function getSoftwareSchema() {
  return {
    '@context': 'https://schema.org',
    '@type': 'SoftwareApplication',
    name: 'ClinicOS',
    applicationCategory: 'HealthApplication',
    applicationSubCategory: 'Clinic Management Software',
    operatingSystem: 'Web, Android, iOS (PWA)',
    url: SITE_URL,
    description:
      'A professional, bilingual (Arabic/English) clinic management system featuring real-time patient queuing, smart prescription building, financial analytics, and shift management.',
    screenshot: DEFAULT_IMAGE,
    featureList: [
      'Real-time patient queue management',
      'Smart prescription builder with drug autocomplete',
      'Drug allergy safety guard',
      'Financial analytics and shift close reports',
      'Bilingual interface (Arabic RTL + English LTR)',
      'Offline-first with Firestore persistent cache',
      'Multi-role access: Doctor, Receptionist, Admin',
      'PDF report generation',
      'PWA — installable on mobile',
    ],
    author: {
      '@type': 'Person',
      name: 'Bavly Hamdy',
      url: 'https://github.com/Bavly-Hamdy',
    },
    offers: {
      '@type': 'Offer',
      price: '0',
      priceCurrency: 'EGP',
      description: 'Contact us for pricing plans',
    },
    inLanguage: ['ar', 'en'],
    accessibilityFeature: ['alternativeText', 'readingOrder', 'structuralNavigation'],
  };
}

/** Organization schema for brand authority */
export function getOrganizationSchema() {
  return {
    '@context': 'https://schema.org',
    '@type': 'Organization',
    name: 'ClinicOS',
    url: SITE_URL,
    logo: DEFAULT_IMAGE,
    description:
      'Professional clinic management SaaS platform for the Egyptian and MENA healthcare market.',
    founder: {
      '@type': 'Person',
      name: 'Bavly Hamdy',
    },
    sameAs: ['https://github.com/Bavly-Hamdy/Clinic_OS'],
    contactPoint: {
      '@type': 'ContactPoint',
      contactType: 'customer support',
      availableLanguage: ['Arabic', 'English'],
    },
  };
}

/** WebSite schema with SiteSearch potential */
export function getWebsiteSchema() {
  return {
    '@context': 'https://schema.org',
    '@type': 'WebSite',
    name: 'ClinicOS',
    url: SITE_URL,
    description: 'Professional bilingual clinic management system for modern medical practices.',
    inLanguage: ['ar', 'en'],
    author: {
      '@type': 'Person',
      name: 'Bavly Hamdy',
    },
  };
}

/** FAQ schema for the FAQ section on the landing page */
export function getFAQSchema(faqs: Array<{ q: string; a: string }>) {
  return {
    '@context': 'https://schema.org',
    '@type': 'FAQPage',
    mainEntity: faqs.map(({ q, a }) => ({
      '@type': 'Question',
      name: q,
      acceptedAnswer: {
        '@type': 'Answer',
        text: a,
      },
    })),
  };
}

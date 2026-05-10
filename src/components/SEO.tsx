import { Helmet } from 'react-helmet-async';
import { SITE_NAME, SITE_URL, DEFAULT_IMAGE } from '@/lib/seo';

interface SEOProps {
  /** Page title — will be appended with "| ClinicOS" if not already included */
  title: string;
  /** Meta description — aim for 150-160 characters for optimal SERP display */
  description: string;
  /** Canonical path (e.g. '/track') — resolved against SITE_URL */
  canonical?: string;
  /** Set true on private/authenticated pages to prevent search engine indexing */
  noindex?: boolean;
  /** OG/Twitter card image URL — defaults to the app icon */
  image?: string;
  /** Open Graph type — 'website' for most pages */
  type?: 'website' | 'article';
  /** Comma-separated keyword string for the meta keywords tag */
  keywords?: string;
  /** JSON-LD structured data object(s) — rendered as <script type="application/ld+json"> */
  schema?: object | object[];
}

/**
 * SEO component for per-page meta tag management via react-helmet-async.
 *
 * Usage:
 * ```tsx
 * <SEO
 *   title="ClinicOS — Smart Clinic Management"
 *   description="Manage your clinic efficiently..."
 *   canonical="/"
 *   schema={getSoftwareSchema()}
 * />
 * ```
 */
export function SEO({
  title,
  description,
  canonical,
  noindex = false,
  image = DEFAULT_IMAGE,
  type = 'website',
  keywords,
  schema,
}: SEOProps) {
  const fullTitle = title.includes(SITE_NAME) ? title : `${title} | ${SITE_NAME}`;
  const canonicalUrl = canonical ? `${SITE_URL}${canonical}` : SITE_URL;
  const imageUrl = image.startsWith('http') ? image : `${SITE_URL}${image}`;

  const schemas = schema ? (Array.isArray(schema) ? schema : [schema]) : [];

  return (
    <Helmet>
      {/* ── Primary Meta ───────────────────────────────────────────── */}
      <title>{fullTitle}</title>
      <meta name="description" content={description} />
      {keywords && <meta name="keywords" content={keywords} />}
      <meta name="robots" content={noindex ? 'noindex, nofollow' : 'index, follow'} />
      <link rel="canonical" href={canonicalUrl} />

      {/* ── Open Graph ────────────────────────────────────────────── */}
      <meta property="og:title" content={fullTitle} />
      <meta property="og:description" content={description} />
      <meta property="og:type" content={type} />
      <meta property="og:url" content={canonicalUrl} />
      <meta property="og:image" content={imageUrl} />
      <meta property="og:image:width" content="512" />
      <meta property="og:image:height" content="512" />
      <meta property="og:image:alt" content={`${SITE_NAME} — Clinic Management System`} />
      <meta property="og:site_name" content={SITE_NAME} />
      <meta property="og:locale" content="ar_EG" />
      <meta property="og:locale:alternate" content="en_US" />

      {/* ── Twitter Card ──────────────────────────────────────────── */}
      <meta name="twitter:card" content="summary_large_image" />
      <meta name="twitter:title" content={fullTitle} />
      <meta name="twitter:description" content={description} />
      <meta name="twitter:image" content={imageUrl} />
      <meta name="twitter:image:alt" content={`${SITE_NAME} Preview`} />

      {/* ── Structured Data (JSON-LD) ─────────────────────────────── */}
      {schemas.map((s, i) => (
        <script key={i} type="application/ld+json">
          {JSON.stringify(s)}
        </script>
      ))}
    </Helmet>
  );
}

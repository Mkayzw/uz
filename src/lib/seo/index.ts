// SEO Infrastructure Exports
export { seoConfig, SEOConfigManager, defaultSEOConfig } from './config';
export { seoUtils } from './utils';
export { seoService, SEOService } from './service';

// Validation utilities
export {
  validateSEOMetadata,
  validateTitle,
  validateDescription,
  validateKeywords,
  validateCanonicalUrl,
  validateOpenGraph,
  validateTwitterCard,
  validateStructuredData,
  createSEOError,
  batchValidateMetadata
} from './validation';

// Next.js integration utilities
export {
  convertToNextjsMetadata,
  generateStructuredDataScript,
  // StructuredData component is not re-exported to avoid name clash with type StructuredData
  generateErrorPageMetadata,
  generateFallbackMetadata
} from './nextjs';

// Re-export types for convenience
export type {
  SEOMetadata,
  SEOConfig,
  PropertySEOData,
  PageMetadataTemplate,
  ValidationResult,
  OpenGraphData,
  TwitterCardData,
  StructuredData,
  Location,
  Property,
  Breadcrumb,
  FAQ,
  SitemapEntry,
  OrganizationSchema,
  RealEstateListingSchema,
  BreadcrumbSchema,
  FAQPageSchema,
  SEOError,
  SEOErrorType
} from '@/types/seo';

// Re-export validation types
export type {
  MetadataValidationOptions,
  DetailedValidationResult
} from './validation';
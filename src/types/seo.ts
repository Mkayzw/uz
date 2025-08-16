// SEO Type Definitions for Unistay Platform

export interface SEOMetadata {
  title: string;
  description: string;
  keywords?: string[];
  canonical?: string;
  openGraph: OpenGraphData;
  twitter: TwitterCardData;
  structuredData?: StructuredData[];
}

export interface OpenGraphData {
  title: string;
  description: string;
  url: string;
  type: 'website' | 'article' | 'product';
  image: string;
  imageAlt?: string;
  siteName: string;
  locale?: string;
}

export interface TwitterCardData {
  card: 'summary' | 'summary_large_image' | 'app' | 'player';
  site?: string;
  creator?: string;
  title: string;
  description: string;
  image: string;
  imageAlt?: string;
}

export interface StructuredData {
  '@context': string;
  '@type': string;
  [key: string]: any;
}

export interface SEOConfig {
  siteName: string;
  siteUrl: string;
  defaultTitle: string;
  defaultDescription: string;
  defaultKeywords: string[];
  socialMedia: {
    twitter: string;
    facebook: string;
    instagram: string;
  };
  analytics: {
    googleAnalyticsId: string;
    googleSearchConsoleId: string;
  };
}

export interface PropertySEOData {
  id: string;
  title: string;
  description: string;
  location: {
    city: string;
    area: string;
    coordinates: [number, number];
  };
  features: string[];
  price: number;
  images: string[];
  lastModified: Date;
  slug: string;
}

export interface PageMetadataTemplate {
  pageType: 'home' | 'property' | 'location' | 'search' | 'static';
  titleTemplate: string;
  descriptionTemplate: string;
  keywordPatterns: string[];
  structuredDataTypes: string[];
}

export interface ValidationResult {
  isValid: boolean;
  errors: string[];
  warnings: string[];
}

export interface SitemapEntry {
  url: string;
  lastModified: Date;
  changeFrequency: 'always' | 'hourly' | 'daily' | 'weekly' | 'monthly' | 'yearly' | 'never';
  priority: number;
}

export interface Breadcrumb {
  name: string;
  url: string;
}

export interface FAQ {
  question: string;
  answer: string;
}

export interface Location {
  city: string;
  area: string;
  country: string;
  coordinates: [number, number];
}

export interface Property {
  id: string;
  title: string;
  description: string;
  location: Location;
  price: number;
  features: string[];
  images: string[];
  slug: string;
  createdAt: Date;
  updatedAt: Date;
}

// Schema Types for Structured Data
export interface OrganizationSchema extends StructuredData {
  '@type': 'Organization';
  name: string;
  url: string;
  logo: string;
  contactPoint: {
    '@type': 'ContactPoint';
    telephone: string;
    contactType: string;
  };
  address: {
    '@type': 'PostalAddress';
    streetAddress: string;
    addressLocality: string;
    addressCountry: string;
  };
}

export interface RealEstateListingSchema extends StructuredData {
  '@type': 'RealEstateListing';
  name: string;
  description: string;
  url: string;
  image: string[];
  address: {
    '@type': 'PostalAddress';
    streetAddress: string;
    addressLocality: string;
    addressCountry: string;
  };
  offers: {
    '@type': 'Offer';
    price: number;
    priceCurrency: string;
    availability: string;
  };
}

export interface BreadcrumbSchema extends StructuredData {
  '@type': 'BreadcrumbList';
  itemListElement: Array<{
    '@type': 'ListItem';
    position: number;
    name: string;
    item: string;
  }>;
}

export interface FAQPageSchema extends StructuredData {
  '@type': 'FAQPage';
  mainEntity: Array<{
    '@type': 'Question';
    name: string;
    acceptedAnswer: {
      '@type': 'Answer';
      text: string;
    };
  }>;
}

// Error Types
export enum SEOErrorType {
  METADATA_VALIDATION_ERROR = 'metadata_validation_error',
  SITEMAP_GENERATION_ERROR = 'sitemap_generation_error',
  STRUCTURED_DATA_ERROR = 'structured_data_error',
  PERFORMANCE_THRESHOLD_ERROR = 'performance_threshold_error'
}

export interface SEOError {
  type: SEOErrorType;
  message: string;
  context: any;
  severity: 'low' | 'medium' | 'high' | 'critical';
}
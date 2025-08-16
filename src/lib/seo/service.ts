import { 
  SEOMetadata, 
  PropertySEOData, 
  Location, 
  Property, 
  ValidationResult,
  PageMetadataTemplate 
} from '@/types/seo';
import { seoConfig } from './config';
import { seoUtils } from './utils';
import { validateSEOMetadata, DetailedValidationResult, MetadataValidationOptions } from './validation';
import { 
  generateOrganizationSchema, 
  generateRealEstateListingSchema, 
  generateBreadcrumbSchema 
} from './structuredData';

/**
 * Core SEO Service for Unistay Platform
 * Handles metadata generation for different page types
 */
export class SEOService {
  private templates: Map<string, PageMetadataTemplate> = new Map();

  constructor() {
    this.initializeTemplates();
  }

  /**
   * Initialize page metadata templates
   */
  private initializeTemplates(): void {
    // Home page template
    this.templates.set('home', {
      pageType: 'home',
      titleTemplate: '{siteName} - {defaultTitle}',
      descriptionTemplate: '{defaultDescription}',
      keywordPatterns: ['student accommodation', 'student housing', 'university housing'],
      structuredDataTypes: ['Organization']
    });

    // Property page template
    this.templates.set('property', {
      pageType: 'property',
      titleTemplate: '{propertyTitle} - Student Accommodation in {city} | {siteName}',
      descriptionTemplate: '{propertyDescription} Located in {area}, {city}. {features} Starting from ${price}/month.',
      keywordPatterns: ['student accommodation {city}', 'student housing {area}', '{propertyType} {city}'],
      structuredDataTypes: ['RealEstateListing', 'Breadcrumb']
    });

    // Location page template
    this.templates.set('location', {
      pageType: 'location',
      titleTemplate: 'Student Accommodation in {city} - {area} | {siteName}',
      descriptionTemplate: 'Find the best student accommodation in {city}, {area}. Browse verified properties near universities with flexible lease terms.',
      keywordPatterns: ['student accommodation {city}', 'student housing {area}', 'university housing {city}'],
      structuredDataTypes: ['Organization', 'Breadcrumb']
    });

    // Search page template
    this.templates.set('search', {
      pageType: 'search',
      titleTemplate: 'Search Results: {query} | {siteName}',
      descriptionTemplate: 'Search results for "{query}". Find student accommodation that matches your criteria on {siteName}.',
      keywordPatterns: ['{query}', 'student accommodation', 'search results'],
      structuredDataTypes: ['Organization']
    });

    // Static page template
    this.templates.set('static', {
      pageType: 'static',
      titleTemplate: '{pageTitle} | {siteName}',
      descriptionTemplate: '{pageDescription}',
      keywordPatterns: ['{pageTitle}', 'unistay'],
      structuredDataTypes: ['Organization']
    });
  }

  /**
   * Generate metadata for any page type
   */
  async generateMetadata(pageType: string, data: any = {}): Promise<SEOMetadata> {
    try {
      const template = this.templates.get(pageType);
      if (!template) {
        throw new Error(`Unknown page type: ${pageType}`);
      }

      switch (pageType) {
        case 'home':
          return this.generateHomeMetadata();
        case 'property':
          return this.generatePropertyMetadata(data as Property);
        case 'location':
          return this.generateLocationMetadata(data as Location);
        case 'search':
          return this.generateSearchMetadata(data.query, data.results);
        case 'static':
          return this.generateStaticMetadata(data.title, data.description, data.path);
        default:
          return this.generateDefaultMetadata();
      }
    } catch (error) {
      console.error('Error generating SEO metadata:', error);
      return this.generateDefaultMetadata();
    }
  }

  /**
   * Generate metadata for home page
   */
  async generateHomeMetadata(): Promise<SEOMetadata> {
    const config = seoConfig.getConfig();
    
    const metadata: SEOMetadata = {
      title: config.defaultTitle,
      description: config.defaultDescription,
      keywords: config.defaultKeywords,
      canonical: seoConfig.generateCanonicalUrl('/'),
      openGraph: seoUtils.generateOpenGraphData(
        config.defaultTitle,
        config.defaultDescription,
        '/',
        '/images/og-home.jpg',
        'website'
      ),
      twitter: seoUtils.generateTwitterCardData(
        config.defaultTitle,
        config.defaultDescription,
        '/images/og-home.jpg'
      ),
      structuredData: [generateOrganizationSchema()]
    };

    return seoUtils.mergeWithDefaults(metadata);
  }

  /**
   * Generate metadata for property pages
   */
  async generatePropertyMetadata(property: Property): Promise<SEOMetadata> {
    const config = seoConfig.getConfig();
    
    // Generate property-specific title
    const title = `${property.title} - Student Accommodation in ${property.location.city} | ${config.siteName}`;
    
    // Generate property-specific description
    const featuresText = property.features.slice(0, 3).join(', ');
    const description = `${seoUtils.truncateText(property.description, 80)} Located in ${property.location.area}, ${property.location.city}. Features: ${featuresText}. Starting from $${property.price}/month.`;
    
    // Generate location-based keywords
    const keywords = [
      `student accommodation ${property.location.city.toLowerCase()}`,
      `student housing ${property.location.area.toLowerCase()}`,
      `furnished room ${property.location.city.toLowerCase()}`,
      ...property.features.map(f => f.toLowerCase()),
      ...config.defaultKeywords
    ];

    const propertyImage = property.images[0] || '/images/property-default.jpg';
    const propertyUrl = `/properties/${property.slug}`;

    const metadata: SEOMetadata = {
      title: seoUtils.truncateText(title, 60),
      description: seoUtils.truncateText(description, 160),
      keywords: keywords.slice(0, 10),
      canonical: seoConfig.generateCanonicalUrl(propertyUrl),
      openGraph: seoUtils.generateOpenGraphData(
        title,
        description,
        propertyUrl,
        propertyImage,
        'product'
      ),
      twitter: seoUtils.generateTwitterCardData(
        title,
        description,
        propertyImage
      ),
      structuredData: [
        generateRealEstateListingSchema(property),
        generateBreadcrumbSchema([
          { name: 'Home', item: seoConfig.getConfig().siteUrl },
          { name: property.location.city, item: `${seoConfig.getConfig().siteUrl}/locations/${property.location.city}` },
          { name: property.title, item: `${seoConfig.getConfig().siteUrl}/properties/${property.slug}` },
        ]),
      ]
    };

    return metadata;
  }

  /**
   * Generate metadata for location pages
   */
  async generateLocationMetadata(location: Location): Promise<SEOMetadata> {
    const config = seoConfig.getConfig();
    
    const title = `Student Accommodation in ${location.city} - ${location.area} | ${config.siteName}`;
    const description = `Find the best student accommodation in ${location.city}, ${location.area}. Browse verified properties near universities with flexible lease terms and modern amenities.`;
    
    const keywords = [
      `student accommodation ${location.city.toLowerCase()}`,
      `student housing ${location.area.toLowerCase()}`,
      `university housing ${location.city.toLowerCase()}`,
      `student apartments ${location.area.toLowerCase()}`,
      `student rentals ${location.city.toLowerCase()}`,
      ...config.defaultKeywords
    ];

    const locationUrl = `/locations/${seoUtils.generateSlug(location.city)}-${seoUtils.generateSlug(location.area)}`;
    const locationImage = `/images/locations/${seoUtils.generateSlug(location.city)}.jpg`;

    const metadata: SEOMetadata = {
      title: seoUtils.truncateText(title, 60),
      description: seoUtils.truncateText(description, 160),
      keywords: keywords.slice(0, 10),
      canonical: seoConfig.generateCanonicalUrl(locationUrl),
      openGraph: seoUtils.generateOpenGraphData(
        title,
        description,
        locationUrl,
        locationImage,
        'website'
      ),
      twitter: seoUtils.generateTwitterCardData(
        title,
        description,
        locationImage
      ),
      structuredData: [
        generateOrganizationSchema(),
        generateBreadcrumbSchema([
          { name: 'Home', item: seoConfig.getConfig().siteUrl },
          { name: location.city, item: `${seoConfig.getConfig().siteUrl}/locations/${location.city}` },
          { name: location.area, item: `${seoConfig.getConfig().siteUrl}/locations/${location.city}/${location.area}` },
        ]),
      ]
    };

    return metadata;
  }

  /**
   * Generate metadata for search pages
   */
  async generateSearchMetadata(query: string, resultCount: number = 0): Promise<SEOMetadata> {
    const config = seoConfig.getConfig();
    
    const cleanQuery = seoUtils.cleanText(query);
    const title = `Search Results: ${cleanQuery} | ${config.siteName}`;
    const description = `Found ${resultCount} student accommodation options for "${cleanQuery}". Browse verified properties and find your perfect student housing on ${config.siteName}.`;
    
    const keywords = [
      cleanQuery,
      `${cleanQuery} student accommodation`,
      'student housing search',
      'find student accommodation',
      ...config.defaultKeywords
    ];

    const searchUrl = `/search?q=${encodeURIComponent(query)}`;

    const metadata: SEOMetadata = {
      title: seoUtils.truncateText(title, 60),
      description: seoUtils.truncateText(description, 160),
      keywords: keywords.slice(0, 10),
      canonical: seoConfig.generateCanonicalUrl(searchUrl),
      openGraph: seoUtils.generateOpenGraphData(
        title,
        description,
        searchUrl,
        '/images/og-search.jpg',
        'website'
      ),
      twitter: seoUtils.generateTwitterCardData(
        title,
        description,
        '/images/og-search.jpg'
      ),
      structuredData: []
    };

    return metadata;
  }

  /**
   * Generate metadata for static pages
   */
  async generateStaticMetadata(pageTitle: string, pageDescription: string, path: string): Promise<SEOMetadata> {
    const config = seoConfig.getConfig();
    
    const title = `${pageTitle} | ${config.siteName}`;
    const description = pageDescription || `${pageTitle} - ${config.defaultDescription}`;
    
    const keywords = [
      ...seoUtils.extractKeywords(pageTitle + ' ' + pageDescription, 5),
      ...config.defaultKeywords
    ];

    const metadata: SEOMetadata = {
      title: seoUtils.truncateText(title, 60),
      description: seoUtils.truncateText(description, 160),
      keywords: keywords.slice(0, 10),
      canonical: seoConfig.generateCanonicalUrl(path),
      openGraph: seoUtils.generateOpenGraphData(
        title,
        description,
        path,
        '/images/og-default.jpg',
        'website'
      ),
      twitter: seoUtils.generateTwitterCardData(
        title,
        description,
        '/images/og-default.jpg'
      ),
      structuredData: []
    };

    return metadata;
  }

  /**
   * Generate default metadata fallback
   */
  private generateDefaultMetadata(): SEOMetadata {
    const config = seoConfig.getConfig();
    
    return {
      title: config.defaultTitle,
      description: config.defaultDescription,
      keywords: config.defaultKeywords,
      canonical: seoConfig.generateCanonicalUrl('/'),
      openGraph: seoUtils.generateOpenGraphData(
        config.defaultTitle,
        config.defaultDescription,
        '/',
        '/images/og-default.jpg'
      ),
      twitter: seoUtils.generateTwitterCardData(
        config.defaultTitle,
        config.defaultDescription,
        '/images/og-default.jpg'
      ),
      structuredData: []
    };
  }

  /**
   * Validate generated metadata with detailed analysis
   */
  validateMetadata(metadata: SEOMetadata, options?: MetadataValidationOptions): DetailedValidationResult {
    return validateSEOMetadata(metadata, options);
  }

  /**
   * Validate metadata with basic validation (backward compatibility)
   */
  validateMetadataBasic(metadata: SEOMetadata): ValidationResult {
    return seoUtils.validateMetadata(metadata);
  }

  /**
   * Get available page templates
   */
  getAvailableTemplates(): string[] {
    return Array.from(this.templates.keys());
  }

  /**
   * Get template for specific page type
   */
  getTemplate(pageType: string): PageMetadataTemplate | undefined {
    return this.templates.get(pageType);
  }
}

// Export singleton instance
export const seoService = new SEOService();
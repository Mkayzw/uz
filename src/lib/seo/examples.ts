/**
 * SEO Infrastructure Usage Examples
 * This file demonstrates how to use the SEO infrastructure components
 */

import { seoService, seoConfig, seoUtils, validateSEOMetadata, convertToNextjsMetadata } from './index';
import type { Property, Location } from '@/types/seo';

// Example: Generate metadata for home page
export async function generateHomePageMetadata() {
  const metadata = await seoService.generateMetadata('home');
  return metadata;
}

// Example: Generate metadata for a property page
export async function generatePropertyPageMetadata() {
  const exampleProperty: Property = {
    id: '1',
    title: 'Modern Student Studio in Camden',
    description: 'Fully furnished studio apartment perfect for students. Located just 5 minutes from UCL campus with all bills included.',
    location: {
      city: 'London',
      area: 'Camden',
      country: 'UK',
      coordinates: [51.5074, -0.1278]
    },
    price: 850,
    features: ['WiFi Included', 'Fully Furnished', 'Bills Included', 'Gym Access', '24/7 Security'],
    images: ['/images/properties/camden-studio-1.jpg', '/images/properties/camden-studio-2.jpg'],
    slug: 'modern-student-studio-camden',
    createdAt: new Date('2024-01-15'),
    updatedAt: new Date('2024-01-20')
  };

  const metadata = await seoService.generatePropertyMetadata(exampleProperty);
  return metadata;
}

// Example: Generate metadata for a location page
export async function generateLocationPageMetadata() {
  const exampleLocation: Location = {
    city: 'Manchester',
    area: 'City Centre',
    country: 'UK',
    coordinates: [53.4808, -2.2426]
  };

  const metadata = await seoService.generateLocationMetadata(exampleLocation);
  return metadata;
}

// Example: Generate metadata for search results
export async function generateSearchPageMetadata() {
  const searchQuery = 'student accommodation near university';
  const resultCount = 42;

  const metadata = await seoService.generateSearchMetadata(searchQuery, resultCount);
  return metadata;
}

// Example: Generate metadata for static pages
export async function generateStaticPageMetadata() {
  const metadata = await seoService.generateStaticMetadata(
    'About Us',
    'Learn more about Unistay and our mission to help students find the perfect accommodation.',
    '/about'
  );
  return metadata;
}

// Example: Validate metadata with detailed analysis
export function validateSEOMetadataExample() {
  const exampleMetadata = {
    title: 'Student Accommodation in London | Unistay',
    description: 'Find the perfect student accommodation in London with Unistay. Browse verified properties near universities.',
    keywords: ['student accommodation london', 'student housing', 'university housing'],
    canonical: 'https://unistay.com/locations/london',
    openGraph: seoUtils.generateOpenGraphData(
      'Student Accommodation in London | Unistay',
      'Find the perfect student accommodation in London with Unistay.',
      '/locations/london',
      '/images/london-og.jpg'
    ),
    twitter: seoUtils.generateTwitterCardData(
      'Student Accommodation in London | Unistay',
      'Find the perfect student accommodation in London with Unistay.',
      '/images/london-og.jpg'
    ),
    structuredData: []
  };

  // Basic validation using service
  const basicValidation = seoService.validateMetadataBasic(exampleMetadata);
  console.log('Basic validation:', basicValidation);

  // Detailed validation with options
  const detailedValidation = validateSEOMetadata(exampleMetadata, {
    strict: true,
    checkImages: true,
    checkStructuredData: true
  });
  
  console.log('Detailed validation:', detailedValidation);
  console.log('SEO Score:', detailedValidation.score);
  console.log('Suggestions:', detailedValidation.suggestions);

  return {
    basic: basicValidation,
    detailed: detailedValidation
  };
}

// Example: Next.js integration
export async function nextjsIntegrationExample() {
  // Generate SEO metadata
  const seoMetadata = await seoService.generateMetadata('home');
  
  // Convert to Next.js Metadata format
  const nextjsMetadata = convertToNextjsMetadata(
    seoMetadata, 
    process.env.NEXT_PUBLIC_SITE_URL || 'https://unistay.com'
  );
  
  console.log('Next.js Metadata:', nextjsMetadata);
  return nextjsMetadata;
}

// Example: Using SEO utilities
export function demonstrateSEOUtils() {
  // Generate slug from text
  const slug = seoUtils.generateSlug('Modern Student Apartment in Central London');
  console.log('Generated slug:', slug); // modern-student-apartment-in-central-london

  // Extract keywords from text
  const text = 'Beautiful student accommodation in Manchester city centre with modern facilities';
  const keywords = seoUtils.extractKeywords(text, 5);
  console.log('Extracted keywords:', keywords);

  // Validate title and description
  const titleValidation = seoUtils.validateTitle('Student Accommodation in London | Unistay');
  const descValidation = seoUtils.validateDescription('Find verified student properties in London with flexible lease terms and modern amenities.');
  
  console.log('Title validation:', titleValidation);
  console.log('Description validation:', descValidation);

  return {
    slug,
    keywords,
    titleValidation,
    descValidation
  };
}

// Example: Configuration management
export function demonstrateConfigManagement() {
  // Get current configuration
  const config = seoConfig.getConfig();
  console.log('Current SEO config:', config);

  // Generate canonical URL
  const canonicalUrl = seoConfig.generateCanonicalUrl('/properties/student-apartment-london');
  console.log('Canonical URL:', canonicalUrl);

  // Validate configuration
  const configValidation = seoConfig.validateConfig();
  console.log('Config validation:', configValidation);

  return {
    config,
    canonicalUrl,
    configValidation
  };
}
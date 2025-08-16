import { SEOService } from '../service';
import { 
  generateOrganizationSchema, 
  generateRealEstateListingSchema, 
  generateBreadcrumbSchema, 
  generateFAQSchema 
} from '../structuredData';
import { Property } from '@/types/seo';

describe('SEO Service', () => {
  const seoService = new SEOService();

  it('should generate metadata for the home page', async () => {
    const metadata = await seoService.generateHomeMetadata();
    expect(metadata.title).toBe('Unistay - Find Your Perfect Student Home');
    expect(metadata.structuredData).toHaveLength(1);
    expect(metadata.structuredData[0]['@type']).toBe('Organization');
  });

  it('should generate metadata for a property page', async () => {
    const property: Property = {
      id: '1',
      title: 'Modern Apartment',
      description: 'A modern apartment in the city center.',
      location: { city: 'Harare', area: 'CBD', coordinates: [0, 0] },
      features: ['wifi', 'parking'],
      price: 1000,
      images: ['/image.jpg'],
      lastModified: new Date(),
      slug: 'modern-apartment',
    };
    const metadata = await seoService.generatePropertyMetadata(property);
    expect(metadata.title).toContain('Modern Apartment');
    expect(metadata.structuredData).toHaveLength(2);
    expect(metadata.structuredData[0]['@type']).toBe('RealEstateListing');
    expect(metadata.structuredData[1]['@type']).toBe('BreadcrumbList');
  });

  it('should generate metadata for a location page', async () => {
    const location = { city: 'Harare', area: 'CBD' };
    const metadata = await seoService.generateLocationMetadata(location);
    expect(metadata.title).toContain('Student Accommodation in Harare');
    expect(metadata.structuredData).toHaveLength(2);
    expect(metadata.structuredData[0]['@type']).toBe('Organization');
    expect(metadata.structuredData[1]['@type']).toBe('BreadcrumbList');
  });
});

describe('Structured Data', () => {
  it('should generate a valid Organization schema', () => {
    const schema = generateOrganizationSchema();
    expect(schema['@type']).toBe('Organization');
    expect(schema.name).toBe('Unistay');
  });

  it('should generate a valid RealEstateListing schema', () => {
    const property: Property = {
      id: '1',
      title: 'Modern Apartment',
      description: 'A modern apartment in the city center.',
      location: { city: 'Harare', area: 'CBD', coordinates: [0, 0] },
      features: ['wifi', 'parking'],
      price: 1000,
      images: ['/image.jpg'],
      lastModified: new Date(),
      slug: 'modern-apartment',
    };
    const schema = generateRealEstateListingSchema(property);
    expect(schema['@type']).toBe('RealEstateListing');
    expect(schema.name).toBe('Modern Apartment');
  });

  it('should generate a valid Breadcrumb schema', () => {
    const breadcrumbs = [{ name: 'Home', item: '/' }];
    const schema = generateBreadcrumbSchema(breadcrumbs);
    expect(schema['@type']).toBe('BreadcrumbList');
    expect(schema.itemListElement).toHaveLength(1);
  });

  it('should generate a valid FAQ schema', () => {
    const faqs = [{ question: 'Q1', answer: 'A1' }];
    const schema = generateFAQSchema(faqs);
    expect(schema['@type']).toBe('FAQPage');
    expect(schema.mainEntity).toHaveLength(1);
  });
});

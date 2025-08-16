import { seoConfig } from './config';
import { Property, StructuredData } from '@/types/seo';

export const generateOrganizationSchema = (): StructuredData => {
  const config = seoConfig.getConfig();
  return {
    '@context': 'https://schema.org',
    '@type': 'Organization',
    name: config.siteName,
    url: config.siteUrl,
    logo: `${config.siteUrl}/images/logo.png`,
    contactPoint: {
      '@type': 'ContactPoint',
      telephone: '+263-XXX-XXXXXX',
      contactType: 'Customer Service',
    },
  };
};

export const generateRealEstateListingSchema = (property: Property): StructuredData => {
  const config = seoConfig.getConfig();
  return {
    '@context': 'https://schema.org',
    '@type': 'RealEstateListing',
    name: property.title,
    description: property.description,
    image: property.images.map(img => `${config.siteUrl}${img}`),
    url: `${config.siteUrl}/properties/${property.slug}`,
    leasingOnline: true,
    propertyType: 'Apartment',
    address: {
      '@type': 'PostalAddress',
      streetAddress: property.location.area,
      addressLocality: property.location.city,
      addressCountry: 'ZW',
    },
    geo: {
      '@type': 'GeoCoordinates',
      latitude: property.location.coordinates[0],
      longitude: property.location.coordinates[1],
    },
    value: {
      '@type': 'MonetaryAmount',
      value: property.price,
      currency: 'USD',
    },
  };
};

export const generateBreadcrumbSchema = (breadcrumbs: { name: string; item: string }[]): StructuredData => {
  return {
    '@context': 'https://schema.org',
    '@type': 'BreadcrumbList',
    itemListElement: breadcrumbs.map((breadcrumb, index) => ({
      '@type': 'ListItem',
      position: index + 1,
      name: breadcrumb.name,
      item: breadcrumb.item,
    })),
  };
};

export const generateFAQSchema = (faqs: { question: string; answer: string }[]): StructuredData => {
  return {
    '@context': 'https://schema.org',
    '@type': 'FAQPage',
    mainEntity: faqs.map(faq => ({
      '@type': 'Question',
      name: faq.question,
      acceptedAnswer: {
        '@type': 'Answer',
        text: faq.answer,
      },
    })),
  };
};

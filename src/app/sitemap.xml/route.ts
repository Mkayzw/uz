import { MetadataRoute } from 'next';
import { seoConfig } from '@/lib/seo/config';

// Mock data fetching functions
async function getAllProperties() {
  // In a real application, you would fetch this data from a database or API
  return [
    { slug: 'modern-apartment-in-downtown-1', lastModified: new Date() },
    { slug: 'cozy-studio-near-campus-2', lastModified: new Date() },
  ];
}

async function getAllLocations() {
  // In a real application, you would fetch this data from a database or API
  return [
    { city: 'Harare', area: 'CBD' },
    { city: 'Harare', area: 'Avenues' },
    { city: 'Bulawayo', area: 'City Center' },
  ];
}

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const config = seoConfig.getConfig();
  const staticPages = [
    '/',
    '/about',
    '/contact',
    '/support',
    '/merchant-agreement',
    '/changelog',
    '/auth/login',
    '/auth/signup',
  ].map(path => ({
    url: `${config.siteUrl}${path}`,
    lastModified: new Date(),
  }));

  const properties = await getAllProperties();
  const propertyPages = properties.map(property => ({
    url: `${config.siteUrl}/p/${property.slug}`,
    lastModified: property.lastModified,
  }));

  const locations = await getAllLocations();
  const locationPages = locations.map(location => ({
    url: `${config.siteUrl}/locations/${location.city}/${location.area}`,
    lastModified: new Date(),
  }));

  return [...staticPages, ...propertyPages, ...locationPages];
}

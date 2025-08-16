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

export async function GET() {
  const config = seoConfig.getConfig();
  const baseUrl = config.siteUrl.replace(/\/$/, '');

  const staticPages = [
    '/',
    '/about',
    '/contact',
    '/support',
    '/merchant-agreement',
    '/changelog',
    '/auth/login',
    '/auth/signup',
  ].map((path) => ({
    loc: `${baseUrl}${path}`,
    lastmod: new Date().toISOString(),
    changefreq: 'weekly',
    priority: '0.7',
  }));

  const properties = await getAllProperties();
  const propertyPages = properties.map((property) => ({
    loc: `${baseUrl}/p/${property.slug}`,
    lastmod: property.lastModified.toISOString(),
    changefreq: 'weekly',
    priority: '0.8',
  }));

  const locations = await getAllLocations();
  const locationPages = locations.map((location) => ({
    loc: `${baseUrl}/locations/${encodeURIComponent(location.city)}/${encodeURIComponent(location.area)}`,
    lastmod: new Date().toISOString(),
    changefreq: 'weekly',
    priority: '0.6',
  }));

  const all = [...staticPages, ...propertyPages, ...locationPages];

  const xml = `<?xml version="1.0" encoding="UTF-8"?>\n` +
    `<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n` +
    all.map((entry) => (
      `  <url>\n` +
      `    <loc>${entry.loc}</loc>\n` +
      `    <lastmod>${entry.lastmod}</lastmod>\n` +
      `    <changefreq>${entry.changefreq}</changefreq>\n` +
      `    <priority>${entry.priority}</priority>\n` +
      `  </url>`
    )).join('\n') +
    `\n</urlset>`;

  return new Response(xml, {
    headers: { 'Content-Type': 'application/xml' },
  });
}

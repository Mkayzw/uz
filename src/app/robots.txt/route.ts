import { MetadataRoute } from 'next';
import { seoConfig } from '@/lib/seo/config';

export default function robots(): MetadataRoute.Robots {
  const config = seoConfig.getConfig();
  return {
    rules: {
      userAgent: '*',
      allow: '/',
      disallow: ['/admin', '/dashboard'],
    },
    sitemap: `${config.siteUrl}/sitemap.xml`,
  };
}

import { seoConfig } from '@/lib/seo/config';

export function GET() {
  const config = seoConfig.getConfig();
  const body = [
    'User-agent: *',
    'Allow: /',
    'Disallow: /admin',
    'Disallow: /dashboard',
    `Sitemap: ${config.siteUrl}/sitemap.xml`,
    ''
  ].join('\n');

  return new Response(body, {
    headers: { 'Content-Type': 'text/plain' },
  });
}

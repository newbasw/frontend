import type { MetadataRoute } from 'next';
import { siteUrl } from '@/lib/siteUrl';

const SITE_URL = siteUrl();

export default function robots(): MetadataRoute.Robots {
  return {
    rules: [
      {
        userAgent: '*',
        allow: '/',
        // Mirrors the reference site's robots.txt: authenticated and
        // parameterised routes are kept out of the index.
        disallow: ['/login', '/register', '/favorites', '/account', '/admin', '/api/', '/forgot-password'],
      },
    ],
    sitemap: `${SITE_URL}/sitemap.xml`,
  };
}

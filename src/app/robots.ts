import type { MetadataRoute } from 'next';

const SITE_URL = process.env.NEXT_PUBLIC_SITE_URL ?? 'http://localhost:3000';

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

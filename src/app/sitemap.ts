import type { MetadataRoute } from 'next';
import { serverApi } from '@/lib/api.server';
import { getCategoryNav, getContentIndex } from '@/lib/queries';
import type { VehicleListResponse } from '@shared/types';

const SITE_URL = process.env.NEXT_PUBLIC_SITE_URL ?? 'http://localhost:3000';

export const revalidate = 3600;

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const entries: MetadataRoute.Sitemap = [
    { url: `${SITE_URL}/`, changeFrequency: 'daily', priority: 1 },
    { url: `${SITE_URL}/stock/all`, changeFrequency: 'hourly', priority: 0.9 },
    { url: `${SITE_URL}/news`, changeFrequency: 'weekly', priority: 0.5 },
  ];

  const [categories, content] = await Promise.all([getCategoryNav(), getContentIndex()]);

  for (const category of categories) {
    entries.push({
      url: `${SITE_URL}/stock/${category.slug}`,
      changeFrequency: 'daily',
      priority: 0.8,
    });
    for (const bodyType of category.body_types) {
      entries.push({ url: `${SITE_URL}/stock/${category.slug}/${bodyType.slug}`, priority: 0.6 });
    }
    for (const brand of category.brands) {
      entries.push({ url: `${SITE_URL}/stock/${category.slug}/${brand.slug}`, priority: 0.6 });
    }
  }

  for (const page of content) {
    entries.push({
      url: `${SITE_URL}/content/${page.slug}`,
      lastModified: page.published_at,
      priority: page.kind === 'article' ? 0.4 : 0.6,
    });
  }

  // Vehicle detail pages, paged through the listing API.
  try {
    for (let page = 1; page <= 40; page++) {
      const result = await serverApi<VehicleListResponse>(`/api/vehicles?page=${page}`, {
        revalidate: 3600,
      });
      for (const vehicle of result.items) {
        entries.push({
          url: `${SITE_URL}${vehicle.href}`,
          changeFrequency: 'weekly',
          priority: 0.7,
        });
      }
      if (page >= result.totalPages) break;
    }
  } catch {
    // A sitemap missing vehicle URLs is better than a 500.
  }

  return entries;
}

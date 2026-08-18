import { serverApi } from './api.server';
import type {
  Category,
  BodyType,
  Brand,
  ContentPage,
  Model,
  Review,
  VehicleDetail,
  VehicleListResponse,
  VehicleSummary,
} from '@shared/types';

/** The mega-menu / category-bar payload, with live stock counts. */
export interface CategoryNav extends Category {
  vehicle_count: number;
  body_types: BodyType[];
  brands: Brand[];
  emission_norms: { value: string; count: number }[];
  axle_configurations: { value: string; count: number }[];
}

export async function getCategoryNav(): Promise<CategoryNav[]> {
  try {
    const { items } = await serverApi<{ items: CategoryNav[] }>('/api/categories', {
      revalidate: 300,
    });
    return items;
  } catch {
    // The chrome must still render if the API is briefly unavailable.
    return [];
  }
}

export async function getModelsForBrand(brandSlug: string): Promise<Model[]> {
  try {
    const { items } = await serverApi<{ items: Model[] }>(
      `/api/brands/${encodeURIComponent(brandSlug)}/models`,
      { revalidate: 3600 },
    );
    return items;
  } catch {
    return [];
  }
}

export async function getVehicleList(query: string): Promise<VehicleListResponse | null> {
  try {
    return await serverApi<VehicleListResponse>(`/api/vehicles${query}`, {
      revalidate: 0,
      withAuth: true,
    });
  } catch {
    return null;
  }
}

export async function getVehicle(slug: string): Promise<VehicleDetail | null> {
  try {
    return await serverApi<VehicleDetail>(`/api/vehicles/${encodeURIComponent(slug)}`, {
      revalidate: 60,
      withAuth: true,
    });
  } catch {
    return null;
  }
}

export async function getRelatedVehicles(slug: string): Promise<VehicleSummary[]> {
  try {
    const { items } = await serverApi<{ items: VehicleSummary[] }>(
      `/api/vehicles/${encodeURIComponent(slug)}/related`,
      { revalidate: 300 },
    );
    return items;
  } catch {
    return [];
  }
}

export async function getReviews(): Promise<{ items: Review[]; total: number; average: number }> {
  try {
    return await serverApi('/api/reviews', { revalidate: 3600 });
  } catch {
    return { items: [], total: 0, average: 0 };
  }
}

export async function getContentPage(slug: string): Promise<ContentPage | null> {
  try {
    return await serverApi<ContentPage>(`/api/content/${encodeURIComponent(slug)}`, {
      revalidate: 600,
    });
  } catch {
    return null;
  }
}

export async function getArticles(limit = 60): Promise<ContentPage[]> {
  try {
    const { items } = await serverApi<{ items: ContentPage[] }>(
      `/api/content?kind=article&limit=${limit}`,
      { revalidate: 600 },
    );
    return items;
  } catch {
    return [];
  }
}

export async function getContentIndex(): Promise<ContentPage[]> {
  try {
    const { items } = await serverApi<{ items: ContentPage[] }>('/api/content?limit=100', {
      revalidate: 600,
    });
    return items;
  } catch {
    return [];
  }
}

export interface Location {
  id: string;
  slug: string;
  name: string;
  address: string | null;
  postcode: string | null;
  city: string | null;
  country_code: string | null;
  phone: string | null;
}

export async function getLocations(): Promise<Location[]> {
  try {
    const { items } = await serverApi<{ items: Location[] }>('/api/locations', { revalidate: 3600 });
    return items;
  } catch {
    return [];
  }
}

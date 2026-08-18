/**
 * Shared contract between the Express API and the Next.js frontend.
 * Kept dependency-free so both sides can import it directly.
 */

export type VehicleCondition = 'used' | 'new';
export type VehicleStatus = 'online' | 'reserved' | 'sold' | 'draft';
export type SellerKind = 'bas_world' | 'trusted_partner';
export type InquiryKind = 'offer_request' | 'seller_message' | 'general_contact';
export type ContentKind = 'page' | 'article' | 'legal' | 'landing';

/** Sort keys, in the exact order the reference site lists them. */
export const SORT_OPTIONS = [
  { value: 'relevance', label: 'Relevance' },
  { value: 'newest', label: 'Newest stock' },
  { value: 'registration_desc', label: '1st registration (new-old)' },
  { value: 'registration_asc', label: '1st registration (old–new)' },
  { value: 'price_asc', label: 'Price (low-high)' },
  { value: 'price_desc', label: 'Price (high-low)' },
] as const;

export type SortValue = (typeof SORT_OPTIONS)[number]['value'];

export const PAGE_SIZE = 36;

export interface Country {
  code: string;
  name: string;
  flag_path: string;
}

export interface Category {
  id: string;
  slug: string;
  label: string;
  sort_order: number;
  seo_title?: string | null;
  seo_heading?: string | null;
  seo_body?: string | null;
  vehicle_count?: number;
}

export interface BodyType {
  id: string;
  category_id: string;
  slug: string;
  label: string;
  sort_order: number;
}

export interface Brand {
  id: string;
  slug: string;
  label: string;
  vehicle_count?: number;
}

export interface Model {
  id: string;
  brand_id: string;
  slug: string;
  label: string;
}

export interface Feature {
  id: string;
  slug: string;
  label: string;
  feature_group: string;
  is_key_feature: boolean;
}

export interface Seller {
  id: string;
  slug: string;
  name: string;
  kind: SellerKind;
  is_trusted: boolean;
  country_code: string | null;
  phone: string | null;
}

export interface VehicleImage {
  id: string;
  url: string;
  alt: string | null;
  view_tag: string | null;
  width: number;
  height: number;
  position: number;
}

/** Shape returned by list endpoints — everything a vehicle card renders. */
export interface VehicleSummary {
  id: string;
  reference: string;
  slug: string;
  condition: VehicleCondition;
  status: VehicleStatus;
  title: string;
  subtitle: string | null;
  category: { slug: string; label: string } | null;
  body_type: { slug: string; label: string } | null;
  brand: { slug: string; label: string } | null;
  model: { slug: string; label: string } | null;
  registration_year: number | null;
  mileage_km: number | null;
  operating_hours: number | null;
  price_cents: number | null;
  price_before_cents: number | null;
  auction_price_cents: number | null;
  transmission: string | null;
  emission_norm: string | null;
  power_type: string | null;
  country: Country | null;
  seller: Pick<Seller, 'name' | 'kind' | 'is_trusted'> | null;
  primary_image: VehicleImage | null;
  is_favorite?: boolean;
  href: string;
}

/** Shape returned by the detail endpoint. */
export interface VehicleDetail extends VehicleSummary {
  description: string | null;
  type_extended: string | null;
  production_date: string | null;
  registration_date: string | null;
  engine_hp: number | null;
  axle_configuration: string | null;
  axle_count: number | null;
  undercarriage: string | null;
  wheelbase_mm: number | null;
  gvw_kg: number | null;
  gcw_kg: number | null;
  cab_type: string | null;
  air_conditioning: string | null;
  colour: string | null;
  has_crane: boolean;
  has_pto: boolean;
  vin: string | null;
  vat_deductible: boolean;
  specifications: Record<string, Record<string, string>>;
  images: VehicleImage[];
  features: Feature[];
  seller_full: Seller | null;
  published_at: string;
}

/** One selectable option inside a filter group, with its live facet count. */
export interface FacetOption {
  value: string;
  label: string;
  count: number;
  selected: boolean;
}

export type FilterGroupType = 'checkbox' | 'range';

export interface FilterGroup {
  key: string;
  label: string;
  type: FilterGroupType;
  /**
   * True for groups the reference renders as radio buttons rather than
   * checkboxes — picking one value replaces the current selection instead of
   * adding to it. "Vehicle type" is the only such group.
   */
  singleSelect?: boolean;
  /** Show a "Search in filters" box above the options (Brand, Model). */
  searchable?: boolean;
  /** checkbox groups */
  options?: FacetOption[];
  /** range groups */
  min?: number | null;
  max?: number | null;
  selectedMin?: number | null;
  selectedMax?: number | null;
  unit?: string;
  /** collapse to the first N options behind a "Show more" link */
  collapseAfter?: number;
}

export interface AppliedFilter {
  key: string;
  value: string;
  label: string;
}

export interface VehicleListResponse {
  items: VehicleSummary[];
  total: number;
  page: number;
  pageSize: number;
  totalPages: number;
  sort: SortValue;
  filters: FilterGroup[];
  applied: AppliedFilter[];
}

export interface SearchSuggestion {
  type: 'vehicle' | 'brand' | 'category' | 'reference';
  label: string;
  sublabel?: string;
  href: string;
}

export interface AuthUser {
  id: string;
  email: string;
  first_name: string | null;
  last_name: string | null;
  company_name: string | null;
  phone: string | null;
  country_code: string | null;
  newsletter_opt_in: boolean;
  created_at: string;
}

export interface ApiError {
  error: string;
  message: string;
  details?: Record<string, string[]>;
}

export interface ContentPage {
  id: string;
  slug: string;
  kind: ContentKind;
  title: string;
  excerpt: string | null;
  body: string | null;
  hero_image: string | null;
  card_image: string | null;
  meta_title: string | null;
  meta_description: string | null;
  published_at: string;
}

export interface Review {
  id: string;
  author: string;
  rating: number;
  title: string;
  body: string;
  published_at: string;
}

export interface Inquiry {
  id: string;
  vehicle_id: string | null;
  kind: InquiryKind;
  name: string;
  email: string;
  message: string;
  created_at: string;
}

/** Query parameter names — single source of truth for URL <-> API mapping. */
export const FILTER_PARAMS = {
  q: 'q',
  category: 'category',
  bodyType: 'bodyType',
  brand: 'brand',
  model: 'model',
  condition: 'condition',
  transmission: 'transmission',
  powerType: 'powerType',
  stageTier: 'stageTier',
  axleConfiguration: 'axleConfiguration',
  cabType: 'cabType',
  colour: 'colour',
  country: 'country',
  feature: 'feature',
  crane: 'crane',
  pto: 'pto',
  airConditioning: 'airConditioning',
  priceFrom: 'priceFrom',
  priceTo: 'priceTo',
  auctionPriceFrom: 'auctionPriceFrom',
  auctionPriceTo: 'auctionPriceTo',
  yearFrom: 'yearFrom',
  yearTo: 'yearTo',
  mileageFrom: 'mileageFrom',
  mileageTo: 'mileageTo',
  hpFrom: 'hpFrom',
  hpTo: 'hpTo',
  gvwFrom: 'gvwFrom',
  gvwTo: 'gvwTo',
  wheelbaseFrom: 'wheelbaseFrom',
  wheelbaseTo: 'wheelbaseTo',
  sort: 'sort',
  page: 'page',
  view: 'view',
} as const;

export type FilterParam = (typeof FILTER_PARAMS)[keyof typeof FILTER_PARAMS];

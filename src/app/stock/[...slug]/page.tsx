import type { Metadata } from 'next';
import Link from 'next/link';
import { notFound } from 'next/navigation';

import { VehicleCard } from '@/components/vehicle/VehicleCard';
import { Reveal } from '@/components/ui/Reveal';
import { FilterPanel } from '@/components/stock/FilterPanel';
import { ActiveFilters } from '@/components/stock/ActiveFilters';
import { ResultsToolbar } from '@/components/stock/ResultsToolbar';
import { Pagination } from '@/components/stock/Pagination';
import { MobileFilterBar } from '@/components/stock/MobileFilterBar';
import { StockScopeProvider } from '@/components/stock/StockScope';
import { getCategoryNav, getModelsForBrand, getVehicleList } from '@/lib/queries';
import { humanizeSlug } from '@/lib/format';
import type { SortValue } from '@shared/types';

export const dynamic = 'force-dynamic';

type SearchParams = Record<string, string | string[] | undefined>;

interface Resolved {
  categories: Awaited<ReturnType<typeof getCategoryNav>>;
  category: Awaited<ReturnType<typeof getCategoryNav>>[number] | null;
  bodyType: string | null;
  brand: string | null;
  model: string | null;
  /** Human labels from the taxonomy, so headings read "Volvo FH", not "Volvo Fh". */
  labels: { bodyType?: string; brand?: string; model?: string };
  valid: boolean;
}

/**
 * Resolves a `/stock/...` path into filter parameters.
 *
 * The reference overloads the same path shape five ways — all of these are real
 * URLs taken from its own sitemap page:
 *   /stock/all                             -> everything
 *   /stock/truck                           -> category
 *   /stock/truck/crane_truck               -> category + super structure
 *   /stock/truck/volvo                     -> category + brand
 *   /stock/tractorhead/volvo/fh            -> category + brand + model
 *   /stock/truck/mercedes/box              -> category + brand + super structure
 *   /stock/montracon                       -> brand across all categories
 */
async function resolvePath(slug: string[]): Promise<Resolved> {
  const categories = await getCategoryNav();
  const segments = slug.map((s) => decodeURIComponent(s).toLowerCase());
  const base = {
    categories,
    category: null,
    bodyType: null,
    brand: null,
    model: null,
    labels: {} as Resolved['labels'],
  };

  if (segments.length === 0 || segments[0] === 'all') {
    return { ...base, valid: true };
  }

  // With no taxonomy we cannot tell a real slug from a bogus one, so take the
  // path at face value and let the listing render its own error state rather
  // than 404-ing a page that is actually fine.
  const taxonomyUnavailable = categories.length === 0;
  const category = categories.find((c) => c.slug === segments[0]) ?? null;

  if (!category) {
    // A single segment that is not a category is treated as a brand.
    const brandSlug = segments[0]!;
    const known = categories
      .flatMap((c) => c.brands)
      .find((b) => b.slug === brandSlug);
    return {
      ...base,
      brand: brandSlug,
      labels: { brand: known?.label },
      valid: !!known || taxonomyUnavailable,
    };
  }

  if (segments.length === 1) {
    return { ...base, category, valid: true };
  }

  const second = segments[1]!;
  const bodyType = category.body_types.find((b) => b.slug === second) ?? null;
  const brand = category.brands.find((b) => b.slug === second) ?? null;

  if (segments.length === 2) {
    if (bodyType) {
      return { ...base, category, bodyType: bodyType.slug, labels: { bodyType: bodyType.label }, valid: true };
    }
    if (brand) {
      return { ...base, category, brand: brand.slug, labels: { brand: brand.label }, valid: true };
    }
    return { ...base, category, valid: taxonomyUnavailable };
  }

  // Three segments: category / brand / (model | body type).
  const third = segments[2]!;
  if (brand) {
    const models = await getModelsForBrand(brand.slug);
    const model = models.find((m) => m.slug === third) ?? null;
    if (model) {
      return {
        ...base,
        category,
        brand: brand.slug,
        model: model.slug,
        labels: { brand: brand.label, model: model.label },
        valid: true,
      };
    }
    const nestedBody = category.body_types.find((b) => b.slug === third) ?? null;
    if (nestedBody) {
      return {
        ...base,
        category,
        brand: brand.slug,
        bodyType: nestedBody.slug,
        labels: { brand: brand.label, bodyType: nestedBody.label },
        valid: true,
      };
    }
    return { ...base, category, brand: brand.slug, labels: { brand: brand.label }, valid: false };
  }

  return { ...base, category, valid: taxonomyUnavailable };
}

/** Merges the path-derived filters with the user's query string. */
function buildQuery(
  resolved: Awaited<ReturnType<typeof resolvePath>>,
  searchParams: SearchParams,
): string {
  const params = new URLSearchParams();

  if (resolved.category) params.append('category', resolved.category.slug);
  if (resolved.bodyType) params.append('bodyType', resolved.bodyType);
  if (resolved.brand) params.append('brand', resolved.brand);
  if (resolved.model) params.append('model', resolved.model);

  for (const [key, value] of Object.entries(searchParams)) {
    if (value == null) continue;
    if (key === 'view') continue; // presentation only
    for (const v of Array.isArray(value) ? value : [value]) {
      if (v !== '') params.append(key, v);
    }
  }

  return `?${params.toString()}`;
}

export async function generateMetadata({
  params,
}: {
  params: { slug: string[] };
}): Promise<Metadata> {
  const resolved = await resolvePath(params.slug);
  const path = `/stock/${(params.slug).join('/')}`;

  if (resolved.category) {
    const heading = buildHeading(resolved);
    const title =
      resolved.bodyType || resolved.brand
        ? heading
        : (resolved.category.seo_title ?? `${resolved.category.label} for sale`);
    return {
      title,
      description:
        resolved.category.seo_body ??
        `Browse new and used ${resolved.category.label.toLowerCase()} at BAS World.`,
      alternates: { canonical: path },
      openGraph: { title, type: 'website', url: path },
    };
  }

  if (resolved.brand) {
    const label = resolved.labels.brand ?? humanizeSlug(resolved.brand);
    return {
      title: `${label} for sale`,
      description: `Browse new and used ${label} vehicles and machines at BAS World.`,
      alternates: { canonical: path },
    };
  }

  return {
    title: 'All stock — trucks, vans, trailers & machines',
    description:
      'Browse the complete BAS World stock: trucks, tractor units, trailers, commercial vehicles and construction equipment.',
    alternates: { canonical: '/stock/all' },
  };
}

export default async function StockPage({
  params,
  searchParams,
}: {
  params: { slug: string[] };
  searchParams: SearchParams;
}) {
  const resolved = await resolvePath(params.slug);
  if (!resolved.valid) notFound();

  const query = buildQuery(resolved, searchParams);
  const result = await getVehicleList(query);

  const view = searchParams.view === 'list' ? 'list' : 'grid';
  const sort = (typeof searchParams.sort === 'string' ? searchParams.sort : 'relevance') as SortValue;

  const heading = buildHeading(resolved);
  const brandLabel = resolved.labels.brand ?? (resolved.brand ? humanizeSlug(resolved.brand) : '');
  const leafLabel =
    resolved.labels.model ??
    resolved.labels.bodyType ??
    (resolved.model ?? resolved.bodyType ? humanizeSlug((resolved.model ?? resolved.bodyType)!) : null);

  const intro = resolved.category?.seo_body ?? null;

  // API unreachable — an explicit error state rather than a blank page.
  if (!result) {
    return (
      <div className="page-wrapper py-16 text-center">
        <h1 className="text-2xl font-semibold">We could not load the stock right now</h1>
        <p className="mt-2 text-base text-grey-800">
          Our search service is temporarily unavailable. Please try again in a moment.
        </p>
        <Link href="/stock/all" className="bw-btn-black mt-6">
          Retry
        </Link>
      </div>
    );
  }

  return (
    <StockScopeProvider
      scope={{
        category: resolved.category?.slug ?? null,
        bodyType: resolved.bodyType,
        brand: resolved.brand,
        model: resolved.model,
      }}
    >
    <div className="page-wrapper py-6">
      <Breadcrumbs
        category={resolved.category ? { slug: resolved.category.slug, label: resolved.category.label } : null}
        brand={resolved.brand ? { slug: resolved.brand, label: brandLabel } : null}
        leaf={leafLabel}
      />

      <div className="flex gap-8">
        {/* Filter sidebar — 283px, sticky, desktop only */}
        <aside className="hidden w-[283px] shrink-0 lg:block">
          <div className="sticky top-[152px] max-h-[calc(100vh-172px)] overflow-y-auto pr-2">
            <FilterPanel filters={result.filters} />
          </div>
        </aside>

        <div className="min-w-0 flex-1">
          <header className="mb-4">
            <h1 className="text-2xl font-semibold">{heading}</h1>
            {intro && <p className="mt-2 max-w-3xl text-base text-grey-800">{intro}</p>}
          </header>

          <ResultsToolbar total={result.total} sort={sort} view={view} />
          <ActiveFilters applied={result.applied} />

          {result.items.length === 0 ? (
            <EmptyState />
          ) : (
            <div
              data-testid="vehicle-list"
              className={
                view === 'list'
                  ? 'flex flex-col gap-4'
                  : 'grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-3'
              }
            >
              {result.items.map((vehicle, index) => (
                /*
                  Cards settle in as the grid scrolls. Only the first screenful
                  is staggered — beyond that every card reveals at once, so a
                  fast scroll never leaves a trail of empty boxes.
                */
                <Reveal key={vehicle.id} delay={index < 6 ? index * 60 : 0}>
                  <VehicleCard vehicle={vehicle} view={view} priority={index < 3} />
                </Reveal>
              ))}
            </div>
          )}

          <Pagination page={result.page} totalPages={result.totalPages} />
        </div>
      </div>

      <MobileFilterBar
        filters={result.filters}
        appliedCount={result.applied.length}
        sort={sort}
        total={result.total}
      />
    </div>
    </StockScopeProvider>
  );
}

/**
 * Mirrors the reference's H1 for each path shape, using real taxonomy labels so
 * models read "FH" rather than a humanised slug, and avoiding "Crane truck
 * truck" when the body type already contains the category noun.
 */
function buildHeading(resolved: Resolved): string {
  const category = resolved.category?.label.toLowerCase() ?? '';
  const brand = resolved.labels.brand ?? (resolved.brand ? humanizeSlug(resolved.brand) : null);
  const model = resolved.labels.model ?? (resolved.model ? humanizeSlug(resolved.model) : null);
  const bodyType =
    resolved.labels.bodyType ?? (resolved.bodyType ? humanizeSlug(resolved.bodyType) : null);

  const withCategory = (lead: string) =>
    category && !lead.toLowerCase().includes(category) ? `${lead} ${category}` : lead;

  if (brand && model) return `${withCategory(`${brand} ${model}`)} for sale`;
  if (brand && bodyType) return `${withCategory(`${brand} ${bodyType.toLowerCase()}`)} for sale`;
  if (bodyType) return `${withCategory(bodyType)} for sale`;
  if (brand) return `${withCategory(brand)} for sale`;
  return resolved.category?.seo_heading ?? 'All stock';
}

function Breadcrumbs({
  category,
  brand,
  leaf,
}: {
  category: { slug: string; label: string } | null;
  brand: { slug: string; label: string } | null;
  leaf: string | null;
}) {
  return (
    <nav aria-label="Breadcrumb" className="mb-4 text-xs text-grey-800">
      <ol className="flex flex-wrap items-center gap-1">
        <li>
          <Link href="/" className="hover:underline">
            Home
          </Link>
        </li>
        <li aria-hidden="true">/</li>
        <li>
          <Link href="/stock/all" className="hover:underline">
            Stock
          </Link>
        </li>
        {category && (
          <>
            <li aria-hidden="true">/</li>
            <li>
              <Link href={`/stock/${category.slug}`} className="hover:underline">
                {category.label}
              </Link>
            </li>
          </>
        )}
        {brand && (
          <>
            <li aria-hidden="true">/</li>
            <li>
              <Link
                href={category ? `/stock/${category.slug}/${brand.slug}` : `/stock/${brand.slug}`}
                className="hover:underline"
              >
                {brand.label}
              </Link>
            </li>
          </>
        )}
        {leaf && (
          <>
            <li aria-hidden="true">/</li>
            <li className="text-ink">{leaf}</li>
          </>
        )}
      </ol>
    </nav>
  );
}

function EmptyState() {
  return (
    <div
      data-testid="empty-state"
      className="border border-dashed border-grey-400 px-6 py-16 text-center"
    >
      <p className="text-lg font-semibold">No vehicles match your filters</p>
      <p className="mx-auto mt-2 max-w-md text-base text-grey-800">
        Try removing a filter or widening a price or year range. You can also browse the complete
        stock and narrow it down from there.
      </p>
      <Link href="/stock/all" className="bw-btn-black mt-6">
        View all stock
      </Link>
    </div>
  );
}

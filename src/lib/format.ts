/**
 * Formatting helpers matching exactly what the reference renders:
 *   price      "€ 53,900"
 *   mileage    "790,000 km"
 *   power      "500 hp"
 */

const NUMBER = new Intl.NumberFormat('en-GB');

export function formatPrice(cents: number | null | undefined): string | null {
  if (cents == null) return null;
  return `€ ${NUMBER.format(Math.round(cents / 100))}`;
}

export function formatMileage(km: number | null | undefined): string | null {
  if (km == null) return null;
  return `${NUMBER.format(km)} km`;
}

export function formatHours(hours: number | null | undefined): string | null {
  if (hours == null) return null;
  return `${NUMBER.format(hours)} h`;
}

export function formatPower(hp: number | null | undefined): string | null {
  if (hp == null) return null;
  return `${hp} hp`;
}

export function formatNumber(value: number | null | undefined): string | null {
  if (value == null) return null;
  return NUMBER.format(value);
}

export function formatWeight(kg: number | null | undefined): string | null {
  if (kg == null) return null;
  return `${NUMBER.format(kg)} kg`;
}

export function formatDate(iso: string | null | undefined): string | null {
  if (!iso) return null;
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return null;
  const dd = String(d.getUTCDate()).padStart(2, '0');
  const mm = String(d.getUTCMonth() + 1).padStart(2, '0');
  return `${dd}-${mm}-${d.getUTCFullYear()}`;
}

/** "Buy" price line: the spec chips shown under a card title. */
export function cardSpecs(v: {
  brand?: { label: string } | null;
  registration_year?: number | null;
  mileage_km?: number | null;
  operating_hours?: number | null;
  transmission?: string | null;
  emission_norm?: string | null;
}): string[] {
  return [
    v.brand?.label,
    v.registration_year ? String(v.registration_year) : null,
    formatMileage(v.mileage_km) ?? formatHours(v.operating_hours),
    v.transmission,
    v.emission_norm,
  ].filter(Boolean) as string[];
}

/** The chips beside the PDP title: "500 hp · 790,000 km · 2019 · Euro 6 · Automatic". */
export function pdpHeadSpecs(v: {
  engine_hp?: number | null;
  mileage_km?: number | null;
  operating_hours?: number | null;
  registration_year?: number | null;
  emission_norm?: string | null;
  transmission?: string | null;
}): string[] {
  return [
    formatPower(v.engine_hp),
    formatMileage(v.mileage_km) ?? formatHours(v.operating_hours),
    v.registration_year ? String(v.registration_year) : null,
    v.emission_norm,
    v.transmission,
  ].filter(Boolean) as string[];
}

export function titleCase(input: string): string {
  return input.charAt(0).toUpperCase() + input.slice(1);
}

/** `light_commercial_vehicle` -> `Light commercial vehicle` */
export function humanizeSlug(slug: string): string {
  return titleCase(slug.replace(/[-_]+/g, ' '));
}

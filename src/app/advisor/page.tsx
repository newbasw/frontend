import type { Metadata } from 'next';
import Link from 'next/link';
import { Suspense } from 'react';
import { SearchBar } from '@/components/search/SearchBar';
import { getCategoryNav } from '@/lib/queries';

export const metadata: Metadata = {
  title: 'AI Search',
  description: 'Describe the vehicle you need and we will point you to matching stock.',
  alternates: { canonical: '/advisor' },
};

const EXAMPLES = [
  { label: 'Euro 6 tractor unit with retarder', href: '/stock/tractorhead?stageTier=Euro%206&feature=retarder' },
  { label: 'Automatic crane truck under €80,000', href: '/stock/truck?crane=yes&transmission=Automatic&priceTo=80000' },
  { label: 'Electric van, low mileage', href: '/stock/light_commercial_vehicle?powerType=electric&mileageTo=50000' },
  { label: 'Track excavator, Stage V', href: '/stock/construction_equipment/track_excavator?stageTier=Stage%20V' },
  { label: 'Refrigerated semi-trailer', href: '/stock/semi-trailer/refrigerated' },
];

export default async function AdvisorPage() {
  const categories = await getCategoryNav();

  return (
    <div className="page-wrapper py-12">
      <div className="mx-auto max-w-2xl text-center">
        <p className="text-xs font-semibold uppercase tracking-wide text-brand">Try AI Search</p>
        <h1 className="mt-1 text-3xl font-semibold">Describe what you are looking for</h1>
        <p className="mt-2 text-base text-grey-800">
          Type a brand, model, reference number or the kind of work the vehicle needs to do. We will
          search the full stock and take you straight to the matching results.
        </p>

        <Suspense fallback={<div className="mt-6 h-11 animate-pulse bg-grey-100" />}>
          <SearchBar className="mt-6" autoFocus placeholder="e.g. Volvo FH 6x2 with retarder" />
        </Suspense>

        <div className="mt-6 flex flex-wrap justify-center gap-2">
          {EXAMPLES.map((example) => (
            <Link
              key={example.href}
              href={example.href}
              className="rounded-full border border-grey-400 px-3 py-1 text-base hover:border-ink"
            >
              {example.label}
            </Link>
          ))}
        </div>
      </div>

      <section className="mx-auto mt-12 max-w-4xl">
        <h2 className="mb-3 text-xl font-semibold">Or start from a category</h2>
        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
          {categories.map((category) => (
            <Link
              key={category.slug}
              href={`/stock/${category.slug}`}
              className="border border-grey-300 p-4 hover:bg-grey-100"
            >
              <p className="text-md font-semibold">{category.label}</p>
              <p className="text-base text-grey-800">{category.vehicle_count} in stock</p>
            </Link>
          ))}
        </div>
      </section>
    </div>
  );
}

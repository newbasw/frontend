import Link from 'next/link';

/**
 * Segment-level 404 for `/stock/...`.
 *
 * Colocating it here also makes Next emit a real HTTP 404 for this route
 * instead of a soft 404 (200 with 404 content), which matters for SEO: a soft
 * 404 leaves a non-existent listing page indexable.
 */
export default function StockNotFound() {
  return (
    <div className="page-wrapper py-24 text-center">
      <p className="text-5xl font-semibold text-grey-400">404</p>
      <h1 className="mt-4 text-2xl font-semibold">We could not find that category</h1>
      <p className="mx-auto mt-2 max-w-md text-base text-grey-800">
        That category, brand or model does not exist in our stock. Browse everything we have, or
        search for a specific vehicle.
      </p>
      <div className="mt-8 flex flex-wrap justify-center gap-3">
        <Link href="/stock/all" className="bw-btn-black">
          View all stock
        </Link>
        <Link href="/" className="bw-btn-outline">
          Back to home
        </Link>
      </div>
    </div>
  );
}

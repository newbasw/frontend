import Link from 'next/link';

export default function NotFound() {
  return (
    <div className="page-wrapper py-24 text-center">
      <p className="text-5xl font-semibold text-grey-400">404</p>
      <h1 className="mt-4 text-2xl font-semibold">We could not find that page</h1>
      <p className="mx-auto mt-2 max-w-md text-base text-grey-800">
        The page may have moved, or the vehicle may have been sold. Try our stock overview or search
        for a reference number.
      </p>
      <div className="mt-8 flex flex-wrap justify-center gap-3">
        <Link href="/stock/all" className="bw-btn-black">
          View stock
        </Link>
        <Link href="/" className="bw-btn-outline">
          Back to home
        </Link>
      </div>
    </div>
  );
}

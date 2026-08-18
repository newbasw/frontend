'use client';

import { useEffect } from 'react';

export default function GlobalError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    // Surfaced in the browser console and any attached error reporter.
    console.error('Unhandled page error', error);
  }, [error]);

  return (
    <div className="page-wrapper py-24 text-center">
      <h1 className="text-2xl font-semibold">Something went wrong</h1>
      <p className="mx-auto mt-2 max-w-md text-base text-grey-800">
        We hit an unexpected error loading this page. Trying again usually fixes it.
      </p>
      {error.digest && <p className="mt-2 text-xs text-grey-800">Reference: {error.digest}</p>}
      <button type="button" onClick={reset} className="bw-btn-black mt-8">
        Try again
      </button>
    </div>
  );
}

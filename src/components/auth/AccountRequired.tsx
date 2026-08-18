'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';

/**
 * Shown where an action needs an account.
 *
 * Browsing the whole catalogue is deliberately open — nobody is asked to
 * register to look at a truck. An account is only wanted at the two points
 * where we take on an obligation to a real person: buying, and starting a
 * conversation we have promised to answer.
 *
 * It carries the current page in `next`, so signing in returns the reader to
 * exactly what they were looking at rather than dumping them on the homepage.
 */
export function AccountRequired({
  action,
  reason,
}: {
  /** What they were trying to do, e.g. "message us". */
  action: string;
  /** Why an account is needed, in plain words. */
  reason?: string;
}) {
  const pathname = usePathname();
  const next = encodeURIComponent(pathname || '/');

  return (
    <div data-testid="account-required" className="rounded-minimal border border-grey-300 p-4">
      <p className="text-md font-semibold">Create an account to {action}</p>
      <p className="mt-1 text-base text-grey-800">
        {reason ??
          'It takes a moment, and it means we can keep your request together in one place and get back to you.'}
      </p>

      <div className="mt-4 flex flex-wrap gap-2">
        <Link href={`/register?next=${next}`} className="bw-btn-cta">
          Create an account
        </Link>
        <Link href={`/login?next=${next}`} className="bw-btn-outline">
          I already have one
        </Link>
      </div>

      <p className="mt-3 text-xs text-grey-800">
        Browsing stays open — you never need an account to look around.
      </p>
    </div>
  );
}

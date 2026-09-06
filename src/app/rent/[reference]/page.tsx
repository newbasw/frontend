import type { Metadata } from 'next';
import Link from 'next/link';
import { RentStatus } from '@/components/rent/RentStatus';

export const dynamic = 'force-dynamic';

export const metadata: Metadata = {
  title: 'Your rental',
  robots: { index: false, follow: false },
};

/**
 * Where a renter picks their booking back up. The reference alone is not enough
 * to see it — the API still checks the session or guest token — so this page is
 * safe to bookmark or send in a reminder.
 */
export default async function RentalPage({
  params,
}: {
  params: Promise<{ reference: string }>;
}) {
  const { reference } = await params;

  return (
    <div className="page-wrapper max-w-[640px] py-10">
      <nav className="mb-4 text-base text-grey-800">
        <Link href="/" className="hover:underline">Home</Link>
        <span className="mx-2">/</span>
        <span>Rental {reference}</span>
      </nav>

      <h1 className="mb-1 text-3xl font-semibold">Your rental</h1>
      <p className="mb-6 text-base text-grey-800">
        Reference <strong>{reference}</strong>. Complete the payment to confirm your booking.
      </p>

      <RentStatus reference={reference} />

      <p className="mt-6 text-base text-grey-800">
        Something not right?{' '}
        <Link href="/content/contact-us" className="text-link hover:underline">Contact us</Link>{' '}
        and quote your reference.
      </p>
    </div>
  );
}

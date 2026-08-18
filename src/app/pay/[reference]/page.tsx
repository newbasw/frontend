import type { Metadata } from 'next';
import Link from 'next/link';
import { PaymentStatus } from '@/components/payment/PaymentStatus';

export const dynamic = 'force-dynamic';

export const metadata: Metadata = {
  title: 'Your payment',
  robots: { index: false, follow: false },
};

/**
 * Where a buyer picks their payment back up. The reference alone is not enough
 * to see it — the API still checks the session or guest token — so this page
 * is safe to bookmark or send in a reminder.
 */
export default async function PaymentPage({
  params,
}: {
  params: Promise<{ reference: string }>;
}) {
  const { reference } = await params;

  return (
    <div className="page-wrapper max-w-[640px] py-10">
      <nav className="mb-4 text-base text-grey-800">
        <Link href="/" className="hover:underline">
          Home
        </Link>
        <span className="mx-2">/</span>
        <span>Payment {reference}</span>
      </nav>

      <h1 className="mb-1 text-3xl font-semibold">Your payment</h1>
      <p className="mb-6 text-base text-grey-800">
        Reference <strong>{reference}</strong>. Quote this when you send the money.
      </p>

      <PaymentStatus reference={reference} />

      <p className="mt-6 text-base text-grey-800">
        Something not right?{' '}
        <Link href="/content/contact-us" className="text-link hover:underline">
          Contact us
        </Link>{' '}
        and quote your reference.
      </p>
    </div>
  );
}

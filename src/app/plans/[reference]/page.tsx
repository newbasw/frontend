import type { Metadata } from 'next';
import Link from 'next/link';
import { PlanDashboard } from '@/components/plan/PlanDashboard';

export const dynamic = 'force-dynamic';

export const metadata: Metadata = {
  title: 'Your payment plan',
  robots: { index: false, follow: false },
};

/**
 * A buyer's plan. The reference alone does not open it — the API still checks
 * the session or guest token — so the link is safe to bookmark or be sent in a
 * reminder.
 */
export default async function PlanPage({
  params,
}: {
  params: Promise<{ reference: string }>;
}) {
  const { reference } = await params;

  return (
    <div className="page-wrapper max-w-[860px] py-10">
      <nav className="mb-4 text-base text-grey-800">
        <Link href="/" className="hover:underline">
          Home
        </Link>
        <span className="mx-2">/</span>
        <Link href="/account/plans" className="hover:underline">
          My plans
        </Link>
        <span className="mx-2">/</span>
        <span>{reference}</span>
      </nav>

      <h1 className="mb-1 text-3xl font-semibold">Your payment plan</h1>
      <p className="mb-6 text-base text-grey-800">
        Pay at your own pace. Once you reach half the price we deliver the vehicle, and you settle
        the rest from here.
      </p>

      <PlanDashboard reference={reference} />
    </div>
  );
}

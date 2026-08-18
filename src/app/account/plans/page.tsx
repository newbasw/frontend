import type { Metadata } from 'next';
import Link from 'next/link';
import { PlanList } from '@/components/plan/PlanList';

export const dynamic = 'force-dynamic';

export const metadata: Metadata = {
  title: 'My payment plans',
  robots: { index: false, follow: false },
};

export default function AccountPlansPage() {
  return (
    <div className="page-wrapper max-w-[860px] py-10">
      <nav className="mb-4 text-base text-grey-800">
        <Link href="/account" className="hover:underline">
          My account
        </Link>
        <span className="mx-2">/</span>
        <span>Payment plans</span>
      </nav>

      <h1 className="mb-1 text-3xl font-semibold">My payment plans</h1>
      <p className="mb-6 text-base text-grey-800">
        Track what you have paid, pay the next instalment, or move a payment back if you need more
        time.
      </p>

      <PlanList />
    </div>
  );
}

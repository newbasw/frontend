import type { Metadata } from 'next';
import { AdminPlans } from '@/components/admin/AdminPlans';

export const dynamic = 'force-dynamic';

export const metadata: Metadata = {
  title: 'Admin — payment plans',
  robots: { index: false, follow: false },
};

export default function AdminPlansPage() {
  return (
    <div className="page-wrapper py-8">
      <h1 className="mb-1 text-3xl font-semibold">Payment plans</h1>
      <p className="mb-6 text-base text-grey-800">
        Check each buyer&rsquo;s paperwork, approve the plan, and release the vehicle once enough
        has cleared.
      </p>
      <AdminPlans />
    </div>
  );
}

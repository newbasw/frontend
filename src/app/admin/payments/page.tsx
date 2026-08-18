import type { Metadata } from 'next';
import { AdminPayments } from '@/components/admin/AdminPayments';

export const dynamic = 'force-dynamic';

export const metadata: Metadata = {
  title: 'Admin — payments',
  robots: { index: false, follow: false },
};

export default function AdminPaymentsPage() {
  return (
    <div className="page-wrapper py-8">
      <h1 className="mb-1 text-3xl font-semibold">Payment requests</h1>
      <p className="mb-6 text-base text-grey-800">
        Send the account details for each request. The buyer sees them straight away on the site.
      </p>
      <AdminPayments />
    </div>
  );
}

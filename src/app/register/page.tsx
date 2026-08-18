import type { Metadata } from 'next';
import Link from 'next/link';
import { RegisterForm } from '@/components/auth/RegisterForm';

export const metadata: Metadata = {
  title: 'Create an account',
  description: 'Create a BAS World account to save vehicles, keep searches and manage enquiries.',
  robots: { index: false, follow: false },
};

export default function RegisterPage() {
  return (
    <div className="page-wrapper py-12">
      <div className="mx-auto max-w-xl">
        <h1 className="text-2xl font-semibold">Create your account</h1>
        <p className="mt-2 text-base text-grey-800">
          Save vehicles to your favourites, keep your searches and follow up on your enquiries.
        </p>

        <RegisterForm />

        <p className="mt-6 text-base">
          Already have an account?{' '}
          <Link href="/login" className="cds-link">
            Login
          </Link>
        </p>
      </div>
    </div>
  );
}

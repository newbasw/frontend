import type { Metadata } from 'next';
import Link from 'next/link';
import { Suspense } from 'react';
import { LoginForm } from '@/components/auth/LoginForm';

export const metadata: Metadata = {
  title: 'Login',
  description: 'Sign in to your BAS World account to manage saved vehicles and enquiries.',
  robots: { index: false, follow: false },
};

export default function LoginPage() {
  return (
    <div className="page-wrapper py-12">
      <div className="mx-auto max-w-md">
        <h1 className="text-2xl font-semibold">Login</h1>
        <p className="mt-2 text-base text-grey-800">
          Sign in to save vehicles, keep your searches and follow up on your enquiries.
        </p>

        <Suspense fallback={<div className="mt-6 h-64 animate-pulse bg-grey-100" />}>
          <LoginForm />
        </Suspense>

        <p className="mt-6 text-base">
          No account yet?{' '}
          <Link href="/register" className="cds-link">
            Create one
          </Link>
        </p>
      </div>
    </div>
  );
}

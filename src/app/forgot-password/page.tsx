import type { Metadata } from 'next';
import Link from 'next/link';
import { ForgotPasswordForm } from '@/components/auth/ForgotPasswordForm';

export const metadata: Metadata = {
  title: 'Forgot your password',
  robots: { index: false, follow: false },
};

export default function ForgotPasswordPage() {
  return (
    <div className="page-wrapper py-12">
      <div className="mx-auto max-w-md">
        <h1 className="text-2xl font-semibold">Forgot your password</h1>
        <p className="mt-2 text-base text-grey-800">
          Enter the email address on your account and we will send you a link to choose a new
          password.
        </p>
        <ForgotPasswordForm />
        <p className="mt-6 text-base">
          <Link href="/login" className="cds-link">
            Back to login
          </Link>
        </p>
      </div>
    </div>
  );
}

import type { Metadata } from 'next';
import Link from 'next/link';
import { ResetPasswordForm } from '@/components/auth/ResetPasswordForm';

export const dynamic = 'force-dynamic';

export const metadata: Metadata = {
  title: 'Choose a new password',
  robots: { index: false, follow: false },
};

/**
 * Where an emailed password-reset link lands.
 *
 * The API already sends people to this URL with a `token` query parameter, so
 * the page has to exist for the reset flow to work at all. Without a token
 * there is nothing to act on, so it points back at requesting a fresh link
 * rather than showing a form that cannot succeed.
 */
export default async function ResetPasswordPage({
  searchParams,
}: {
  searchParams: Promise<{ token?: string }>;
}) {
  const { token } = await searchParams;

  return (
    <div className="page-wrapper py-12">
      <div className="mx-auto max-w-md">
        <h1 className="text-2xl font-semibold">Choose a new password</h1>

        {token ? (
          <>
            <p className="mt-2 text-base text-grey-800">
              Pick a new password for your account. Reset links expire, so if this one has been
              sitting in your inbox a while you may need a fresh one.
            </p>
            <ResetPasswordForm token={token} />
          </>
        ) : (
          <>
            <p className="mt-2 text-base text-grey-800">
              This page needs the link from your reset email. Open that email and use the button
              inside it, or request a new link below.
            </p>
            <Link href="/forgot-password" className="bw-btn-cta mt-6">
              Send me a new link
            </Link>
          </>
        )}

        <p className="mt-6 text-base">
          <Link href="/login" className="cds-link">
            Back to login
          </Link>
        </p>
      </div>
    </div>
  );
}

import type { Metadata } from 'next';
import Link from 'next/link';
import { redirect } from 'next/navigation';
import { serverApi } from '@/lib/api.server';
import { ProfileForm } from '@/components/account/ProfileForm';
import { LogoutButton } from '@/components/account/LogoutButton';
import type { AuthUser, VehicleSummary } from '@shared/types';

export const dynamic = 'force-dynamic';

export const metadata: Metadata = {
  title: 'My account',
  robots: { index: false, follow: false },
};

interface InquiryRow {
  id: string;
  kind: string;
  status: string;
  message: string;
  created_at: string;
  vehicle: { slug: string; title: string; condition: string; reference: string } | null;
}

export default async function AccountPage() {
  let user: AuthUser | null = null;
  try {
    const res = await serverApi<{ user: AuthUser | null }>('/api/auth/me', {
      withAuth: true,
      revalidate: 0,
    });
    user = res.user;
  } catch {
    user = null;
  }
  // Middleware only checks that a cookie exists; this is where a forged or
  // expired token is actually rejected.
  if (!user) redirect('/login?next=%2Faccount');

  const [favorites, inquiries] = await Promise.all([
    serverApi<{ items: VehicleSummary[] }>('/api/favorites', { withAuth: true, revalidate: 0 })
      .then((r) => r.items)
      .catch(() => [] as VehicleSummary[]),
    serverApi<{ items: InquiryRow[] }>('/api/inquiries', { withAuth: true, revalidate: 0 })
      .then((r) => r.items)
      .catch(() => [] as InquiryRow[]),
  ]);

  return (
    <div className="page-wrapper py-8">
      <div className="mb-8 flex flex-wrap items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-semibold">
            {user.first_name ? `Hello, ${user.first_name}` : 'My account'}
          </h1>
          <p className="text-base text-grey-800">{user.email}</p>
        </div>
        <LogoutButton />
      </div>

      <div className="grid gap-8 lg:grid-cols-[1fr_360px]">
        <div className="space-y-10">
          <section>
            <div className="mb-3 flex items-center justify-between">
              <h2 className="text-xl font-semibold">Saved vehicles</h2>
              <Link href="/favorites" className="cds-link text-base">
                View all ({favorites.length})
              </Link>
            </div>
            {favorites.length === 0 ? (
              <p className="border border-dashed border-grey-400 p-6 text-base text-grey-800">
                You have not saved any vehicles yet. Use the star on any vehicle to save it here.
              </p>
            ) : (
              <ul className="divide-y divide-grey-300 border border-grey-300">
                {favorites.slice(0, 5).map((vehicle) => (
                  <li key={vehicle.id} className="flex items-center justify-between gap-4 p-3">
                    <Link href={vehicle.href} className="text-base font-medium hover:underline">
                      {vehicle.title}
                    </Link>
                    <span className="shrink-0 text-base text-grey-800">{vehicle.reference}</span>
                  </li>
                ))}
              </ul>
            )}
          </section>

          <section>
            <div className="mb-3 flex flex-wrap items-baseline justify-between gap-2">
              <h2 className="text-xl font-semibold">My payment plans</h2>
              <Link href="/account/plans" className="text-base text-link hover:underline">
                View all plans
              </Link>
            </div>
            <p className="mb-6 border border-grey-300 p-4 text-base text-grey-800">
              Buying in instalments? Track what you have paid, pay the next one, or move a payment
              back if you need more time.{' '}
              <Link href="/account/plans" className="text-link hover:underline">
                Go to my plans
              </Link>
              .
            </p>
          </section>

          <section>
            <h2 className="mb-3 text-xl font-semibold">My enquiries</h2>
            {inquiries.length === 0 ? (
              <p className="border border-dashed border-grey-400 p-6 text-base text-grey-800">
                You have not sent any enquiries yet.
              </p>
            ) : (
              <ul className="divide-y divide-grey-300 border border-grey-300">
                {inquiries.map((inquiry) => (
                  <li key={inquiry.id} className="p-3">
                    <div className="flex flex-wrap items-baseline justify-between gap-2">
                      <p className="text-base font-medium">
                        {inquiry.vehicle ? (
                          <Link
                            href={`/vehicles/${inquiry.vehicle.condition === 'new' ? 'new' : 'used'}/${inquiry.vehicle.slug}`}
                            className="hover:underline"
                          >
                            {inquiry.vehicle.title}
                          </Link>
                        ) : (
                          'General enquiry'
                        )}
                      </p>
                      <span className="text-xs text-grey-800">
                        {new Date(inquiry.created_at).toLocaleDateString('en-GB')} · {inquiry.status}
                      </span>
                    </div>
                    <p className="mt-1 line-clamp-2 text-base text-grey-800">{inquiry.message}</p>
                  </li>
                ))}
              </ul>
            )}
          </section>
        </div>

        <aside>
          <h2 className="mb-3 text-xl font-semibold">Account settings</h2>
          <ProfileForm user={user} />
        </aside>
      </div>
    </div>
  );
}

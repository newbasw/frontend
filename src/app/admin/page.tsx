import type { Metadata } from 'next';
import Link from 'next/link';
import { redirect } from 'next/navigation';
import { serverApi } from '@/lib/api.server';
import { AdminActivity } from '@/components/admin/AdminActivity';
import type { AuthUser } from '@shared/types';

export const dynamic = 'force-dynamic';

export const metadata: Metadata = {
  title: 'Admin',
  robots: { index: false, follow: false },
};

interface Stats {
  vehicles_online: number;
  users: number;
  users_this_week: number;
  inquiries: number;
  inquiries_new: number;
  conversations: number;
  conversations_waiting: number;
  unread_messages: number;
  auctions_live: number;
  bids: number;
  bot_counters: number;
  auctions_sold: number;
  favorites: number;
  searches_this_week: number;
  payments: number;
  payments_waiting: number;
  payments_confirmed_cents: number;
}

export default async function AdminPage() {
  // Two gates: a session, and the admin flag read fresh from the database.
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
  if (!user) redirect('/login?next=%2Fadmin');

  let stats: Stats | null = null;
  try {
    const res = await serverApi<{ stats: Stats }>('/api/admin/overview', {
      withAuth: true,
      revalidate: 0,
    });
    stats = res.stats;
  } catch {
    // 403 for a signed-in non-admin.
    return (
      <div className="page-wrapper py-24 text-center">
        <h1 className="text-2xl font-semibold">Admin access only</h1>
        <p className="mx-auto mt-2 max-w-md text-base text-grey-800">
          Your account does not have admin rights. Ask an administrator to grant them, or run{' '}
          <code className="bg-grey-100 px-1">npm run seed:admin</code> against this account.
        </p>
        <Link href="/" className="bw-btn-black mt-8">
          Back to the site
        </Link>
      </div>
    );
  }

  const cards = [
    { label: 'Vehicles online', value: stats.vehicles_online, href: '/stock/all' },
    { label: 'Chats waiting', value: stats.conversations_waiting, href: '/admin/chat', accent: stats.conversations_waiting > 0 },
    { label: 'Unread messages', value: stats.unread_messages, href: '/admin/chat', accent: stats.unread_messages > 0 },
    { label: 'New enquiries', value: stats.inquiries_new, href: '/admin/inquiries', accent: stats.inquiries_new > 0 },
    { label: 'Live auctions', value: stats.auctions_live, href: '/admin/auctions' },
    { label: 'Offers received', value: stats.bids, href: '/admin/auctions' },
    { label: 'Bot counter-offers', value: stats.bot_counters, href: '/admin/auctions' },
    { label: 'Deals agreed', value: stats.auctions_sold, href: '/admin/auctions' },
    { label: 'Payments waiting', value: stats.payments_waiting, href: '/admin/payments', accent: stats.payments_waiting > 0 },
    { label: 'Payment requests', value: stats.payments, href: '/admin/payments' },
    { label: 'Registered users', value: stats.users, href: '/admin' },
    { label: 'Saved vehicles', value: stats.favorites, href: '/admin' },
    { label: 'Searches this week', value: stats.searches_this_week, href: '/admin' },
    { label: 'New users this week', value: stats.users_this_week, href: '/admin' },
  ];

  return (
    <div className="page-wrapper py-8">
      <header className="mb-6 flex flex-wrap items-end justify-between gap-3">
        <div>
          <h1 className="text-3xl font-semibold">Admin dashboard</h1>
          <p className="text-base text-grey-800">Everything happening across the platform.</p>
        </div>
        <nav className="flex flex-wrap gap-2">
          <Link href="/admin/chat" className="bw-btn-outline">
            Chats
            {stats.conversations_waiting > 0 && (
              <span className="ml-1 rounded-full bg-sale px-2 py-0.5 text-xs text-white">
                {stats.conversations_waiting}
              </span>
            )}
          </Link>
          <Link href="/admin/inquiries" className="bw-btn-outline">
            Enquiries
          </Link>
          <Link href="/admin/auctions" className="bw-btn-outline">
            Auctions
          </Link>
          <Link href="/admin/plans" className="bw-btn-outline">
            Plans
          </Link>
          <Link href="/admin/payments" className="bw-btn-outline">
            Payments
            {stats.payments_waiting > 0 && (
              <span className="ml-1 rounded-full bg-sale px-2 py-0.5 text-xs text-white">
                {stats.payments_waiting}
              </span>
            )}
          </Link>
        </nav>
      </header>

      <div className="grid grid-cols-2 gap-3 md:grid-cols-4 xl:grid-cols-6">
        {cards.map((card) => (
          <Link
            key={card.label}
            href={card.href}
            className={`rounded-minimal border p-4 transition-colors hover:bg-grey-100 ${
              card.accent ? 'border-sale' : 'border-grey-300'
            }`}
          >
            <p className={`text-2xl font-semibold ${card.accent ? 'text-sale' : ''}`}>
              {card.value.toLocaleString('en-GB')}
            </p>
            <p className="mt-1 text-base text-grey-800">{card.label}</p>
          </Link>
        ))}
      </div>

      <section className="mt-10">
        <h2 className="mb-3 text-xl font-semibold">Activity</h2>
        <AdminActivity />
      </section>
    </div>
  );
}

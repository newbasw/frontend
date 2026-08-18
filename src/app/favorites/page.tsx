import type { Metadata } from 'next';
import Link from 'next/link';
import { redirect } from 'next/navigation';
import { serverApi } from '@/lib/api.server';
import { VehicleCard } from '@/components/vehicle/VehicleCard';
import type { VehicleSummary } from '@shared/types';

export const dynamic = 'force-dynamic';

export const metadata: Metadata = {
  title: 'Saved vehicles',
  robots: { index: false, follow: false },
};

export default async function FavoritesPage() {
  let items: VehicleSummary[];
  try {
    const res = await serverApi<{ items: VehicleSummary[] }>('/api/favorites', {
      withAuth: true,
      revalidate: 0,
    });
    items = res.items;
  } catch {
    redirect('/login?next=%2Ffavorites');
  }

  return (
    <div className="page-wrapper py-8">
      <h1 className="text-2xl font-semibold">Saved vehicles</h1>
      <p className="mt-1 text-base text-grey-800">
        {items.length === 0
          ? 'Nothing saved yet.'
          : `${items.length} vehicle${items.length === 1 ? '' : 's'} saved.`}
      </p>

      {items.length === 0 ? (
        <div className="mt-6 border border-dashed border-grey-400 px-6 py-16 text-center">
          <p className="text-lg font-semibold">Your list is empty</p>
          <p className="mx-auto mt-2 max-w-md text-base text-grey-800">
            Use the star on any vehicle card or detail page to save it here. Saved vehicles stay in
            your account across devices.
          </p>
          <Link href="/stock/all" className="bw-btn-black mt-6">
            Browse stock
          </Link>
        </div>
      ) : (
        <div className="mt-6 grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-3">
          {items.map((vehicle) => (
            <VehicleCard key={vehicle.id} vehicle={vehicle} />
          ))}
        </div>
      )}
    </div>
  );
}

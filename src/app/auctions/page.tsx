import type { Metadata } from 'next';
import Link from 'next/link';
import { serverApi } from '@/lib/api.server';
import { VehicleCard } from '@/components/vehicle/VehicleCard';
import { formatPrice } from '@/lib/format';
import type { VehicleSummary } from '@shared/types';

export const dynamic = 'force-dynamic';

export const metadata: Metadata = {
  title: 'Auction — browse live lots',
  description:
    'Bid on trucks, trailers, vans and machines at auction prices. Make an offer and negotiate directly.',
  alternates: { canonical: '/auctions' },
};

interface Lot {
  id: string;
  vehicle_id: string;
  status: string;
  starting_price_cents: number;
  ends_at: string;
  bid_count: number;
  highest_bid_cents: number | null;
  vehicle: VehicleSummary;
}

function endsIn(iso: string): string {
  const ms = new Date(iso).getTime() - Date.now();
  if (ms <= 0) return 'Ended';
  const days = Math.floor(ms / 86_400_000);
  if (days > 0) return `${days} day${days === 1 ? '' : 's'} left`;
  return `${Math.max(1, Math.floor(ms / 3_600_000))}h left`;
}

export default async function AuctionsPage() {
  let lots: Lot[] = [];
  try {
    const res = await serverApi<{ items: Lot[] }>('/api/auctions?limit=60', { revalidate: 0 });
    lots = res.items;
  } catch {
    lots = [];
  }

  return (
    <div className="page-wrapper py-8">
      <header className="mb-6 overflow-hidden rounded-minimal bg-brand p-8 text-white">
        <p className="text-xs font-semibold uppercase tracking-wide opacity-90">Don&rsquo;t miss out</p>
        <h1 className="mt-1 text-3xl font-semibold md:text-4xl">Weekly auctions. Sharp prices.</h1>
        <p className="mt-2 max-w-2xl text-md opacity-95">
          Every lot takes offers. Name your price and our team answers straight away — if it is
          under the floor we will come back with a counter until we meet.
        </p>
      </header>

      {lots.length === 0 ? (
        <p className="rounded-minimal border border-dashed border-grey-400 p-10 text-center text-base text-grey-800">
          No live lots right now. <Link href="/stock/all" className="cds-link">Browse the full stock</Link>.
        </p>
      ) : (
        <>
          <p className="mb-4 text-base">
            <strong>{lots.length}</strong> live lots
          </p>
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-3">
            {lots.map((lot) => (
              <div key={lot.id} className="relative">
                <span className="absolute right-3 top-3 z-20 rounded-minimal bg-ink/85 px-2 py-1 text-xs font-semibold text-white">
                  {endsIn(lot.ends_at)}
                </span>
                <VehicleCard vehicle={lot.vehicle} />
                <p className="mt-1 flex items-center justify-between px-1 text-base">
                  <span className="text-grey-800">Opening bid</span>
                  <span className="font-semibold text-brand">
                    {formatPrice(lot.starting_price_cents)}
                  </span>
                </p>
              </div>
            ))}
          </div>
        </>
      )}
    </div>
  );
}

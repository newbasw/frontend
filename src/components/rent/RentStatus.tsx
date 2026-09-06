'use client';

import { useEffect, useState } from 'react';
import { clientApi } from '@/lib/api';
import { formatPrice } from '@/lib/format';
import { Spinner } from '../icons';
import { PaymentStatus } from '../payment/PaymentStatus';

interface Rental {
  reference: string;
  status: string;
  start_date: string;
  end_date: string;
  duration_days: number;
  daily_rate_cents: number;
  price_cents: number;
  vehicle_title: string | null;
  vehicle_reference: string | null;
  payment_reference: string | null;
  payment_status: string | null;
}

const STATUS_LABEL: Record<string, string> = {
  requested: 'Awaiting payment',
  confirmed: 'Booking confirmed',
  active: 'Rental active',
  completed: 'Completed',
  cancelled: 'Cancelled',
};

export function RentStatus({ reference }: { reference: string }) {
  const [rental, setRental] = useState<Rental | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    clientApi<{ rental: Rental }>(`/api/rentals/${reference}`)
      .then((r) => setRental(r.rental))
      .catch(() => setError('We could not find this rental, or it is not linked to your account.'));
  }, [reference]);

  if (error) return <p className="rounded-minimal border border-sale/50 bg-sale/10 p-3 text-base text-sale">{error}</p>;
  if (!rental) return <p className="text-base text-grey-800"><Spinner size={14} /> Loading…</p>;

  return (
    <div className="space-y-4">
      <div className="rounded-minimal border border-grey-300 p-4">
        <div className="flex items-center justify-between">
          <p className="text-md font-semibold">{rental.vehicle_title ?? 'Vehicle'}</p>
          <span className="rounded-full bg-brand/10 px-3 py-1 text-xs font-semibold text-brand-dark">
            {STATUS_LABEL[rental.status] ?? rental.status}
          </span>
        </div>
        <dl className="mt-3 grid grid-cols-2 gap-y-2 text-base">
          <dt className="text-grey-800">Dates</dt>
          <dd className="text-right">{rental.start_date} → {rental.end_date}</dd>
          <dt className="text-grey-800">Duration</dt>
          <dd className="text-right">{rental.duration_days} day{rental.duration_days === 1 ? '' : 's'}</dd>
          <dt className="text-grey-800">Daily rate</dt>
          <dd className="text-right">{formatPrice(rental.daily_rate_cents)}</dd>
          <dt className="text-grey-800">Total</dt>
          <dd className="text-right font-semibold">{formatPrice(rental.price_cents)}</dd>
          {rental.vehicle_reference && (<><dt className="text-grey-800">Vehicle ref</dt><dd className="text-right">{rental.vehicle_reference}</dd></>)}
        </dl>
      </div>

      {rental.payment_reference && (
        <div>
          <p className="mb-2 text-md font-semibold">Payment</p>
          <PaymentStatus reference={rental.payment_reference} />
        </div>
      )}
    </div>
  );
}

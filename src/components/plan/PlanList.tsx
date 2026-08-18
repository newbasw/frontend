'use client';

import Link from 'next/link';
import { useEffect, useState } from 'react';
import { clientApi } from '@/lib/api';
import { formatPrice } from '@/lib/format';
import { SmartImage as Image } from '../ui/SmartImage';

/** Every plan belonging to the caller, signed in or not. */

interface PlanSummary {
  reference: string;
  status: string;
  total_cents: number;
  deposit_cents: number;
  term_months: number;
  created_at: string;
  delivered_at: string | null;
  vehicle_title: string | null;
  vehicle_slug: string | null;
  vehicle_condition: string | null;
  vehicle_image: string | null;
  paid_cents: number;
  remaining: number;
}

const STATUS_LABEL: Record<string, { text: string; className: string }> = {
  documents_pending: { text: 'Documents needed', className: 'bg-cta text-ink' },
  under_review: { text: 'Under review', className: 'bg-link text-white' },
  approved: { text: 'Approved', className: 'bg-brand/25 text-brand-dark' },
  active: { text: 'Active', className: 'bg-brand/25 text-brand-dark' },
  delivered: { text: 'Delivered', className: 'bg-ctaGreen text-white' },
  completed: { text: 'Paid in full', className: 'bg-ctaGreen text-white' },
  rejected: { text: 'Not approved', className: 'bg-sale text-white' },
  cancelled: { text: 'Cancelled', className: 'bg-grey-300 text-ink' },
  draft: { text: 'Draft', className: 'bg-grey-300 text-ink' },
};

export function PlanList() {
  const [items, setItems] = useState<PlanSummary[] | null>(null);

  useEffect(() => {
    clientApi<{ items: PlanSummary[] }>('/api/plans')
      .then((res) => setItems(res.items))
      .catch(() => setItems([]));
  }, []);

  if (items === null) return <div className="h-64 animate-pulse rounded-minimal bg-grey-100" />;

  if (items.length === 0) {
    return (
      <div className="rounded-minimal border border-dashed border-grey-400 p-8 text-center">
        <p className="text-base text-grey-800">You have no payment plans yet.</p>
        <Link href="/stock/all" className="bw-btn-cta mt-4">
          Find a vehicle
        </Link>
      </div>
    );
  }

  return (
    <ul data-testid="plan-list" className="space-y-4">
      {items.map((p) => {
        const label = STATUS_LABEL[p.status] ?? STATUS_LABEL.draft!;
        const pct = p.total_cents > 0 ? Math.min(100, (p.paid_cents / p.total_cents) * 100) : 0;

        return (
          <li key={p.reference} className="rounded-minimal border border-grey-300">
            <Link href={`/plans/${p.reference}`} className="flex flex-wrap gap-4 p-4 hover:bg-grey-100">
              {p.vehicle_image && (
                <div className="relative h-24 w-32 shrink-0 overflow-hidden rounded-minimal bg-grey-100">
                  <Image
                    src={p.vehicle_image}
                    alt=""
                    fill
                    sizes="128px"
                    className="object-cover"
                  />
                </div>
              )}

              <div className="min-w-[12rem] flex-1">
                <div className="flex flex-wrap items-center gap-2">
                  <span className={`rounded-minimal px-2 py-0.5 text-xs font-semibold ${label.className}`}>
                    {label.text}
                  </span>
                  <span className="text-base font-semibold">{p.reference}</span>
                </div>

                <p className="mt-1 text-md font-semibold">{p.vehicle_title ?? 'Vehicle'}</p>

                <div className="mt-2 h-2 overflow-hidden rounded-full bg-grey-200">
                  <div
                    className={pct >= 100 ? 'h-full bg-ctaGreen' : 'h-full bg-brand'}
                    style={{ width: `${pct}%` }}
                  />
                </div>
                <p className="mt-1 text-base text-grey-800">
                  {formatPrice(p.paid_cents)} paid · {p.remaining} payment
                  {p.remaining === 1 ? '' : 's'} left
                </p>
              </div>

              <div className="text-right">
                <p className="text-lg font-semibold">{formatPrice(p.total_cents)}</p>
                <p className="text-base text-grey-800">over {p.term_months} months</p>
              </div>
            </Link>
          </li>
        );
      })}
    </ul>
  );
}

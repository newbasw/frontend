'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { clientApi } from '@/lib/api';

/**
 * The merged activity feed: registrations, enquiries, chat messages, offers and
 * the bot's counter-offers, newest first. Refreshes on a timer so an admin can
 * leave the dashboard open and watch things land.
 */

interface Item {
  kind:
    | 'registration'
    | 'inquiry'
    | 'message'
    | 'bid'
    | 'bot_counter'
    | 'auction_won'
    | 'payment'
    | 'payment_reported'
    | 'payment_confirmed';
  at: string;
  title: string | null;
  detail: string | null;
  href: string | null;
}

const LABELS: Record<Item['kind'], { text: string; className: string }> = {
  registration: { text: 'Signed up', className: 'bg-grey-200 text-ink' },
  inquiry: { text: 'Enquiry', className: 'bg-cta text-ink' },
  message: { text: 'Message', className: 'bg-link text-white' },
  bid: { text: 'Offer', className: 'bg-ink text-white' },
  bot_counter: { text: 'Counter', className: 'bg-brand/25 text-brand-dark' },
  auction_won: { text: 'Agreed', className: 'bg-ctaGreen text-white' },
  payment: { text: 'Payment request', className: 'bg-cta text-ink' },
  payment_reported: { text: 'Payment sent', className: 'bg-brand/25 text-brand-dark' },
  payment_confirmed: { text: 'Paid', className: 'bg-ctaGreen text-white' },
};

function when(iso: string): string {
  const ms = Date.now() - new Date(iso).getTime();
  const mins = Math.round(ms / 60_000);
  if (mins < 1) return 'just now';
  if (mins < 60) return `${mins}m ago`;
  const hours = Math.round(mins / 60);
  if (hours < 24) return `${hours}h ago`;
  return new Date(iso).toLocaleDateString('en-GB');
}

export function AdminActivity() {
  const [items, setItems] = useState<Item[] | null>(null);

  useEffect(() => {
    const load = () =>
      clientApi<{ items: Item[] }>('/api/admin/activity?limit=60')
        .then((res) => setItems(res.items))
        .catch(() => setItems([]));
    load();
    const timer = setInterval(load, 15_000);
    return () => clearInterval(timer);
  }, []);

  if (items === null) {
    return (
      <div className="space-y-2">
        {Array.from({ length: 6 }).map((_, i) => (
          <div key={i} className="h-12 animate-pulse rounded-minimal bg-grey-100" />
        ))}
      </div>
    );
  }

  if (items.length === 0) {
    return (
      <p className="rounded-minimal border border-dashed border-grey-400 p-6 text-center text-base text-grey-800">
        Nothing has happened yet.
      </p>
    );
  }

  return (
    <ul data-testid="admin-activity" className="divide-y divide-grey-300 rounded-minimal border border-grey-300">
      {items.map((item, index) => {
        const label = LABELS[item.kind] ?? { text: item.kind, className: 'bg-grey-200 text-ink' };
        const row = (
          <div className="flex items-center gap-3 px-4 py-3">
            <span className={`shrink-0 rounded-minimal px-2 py-0.5 text-xs font-semibold ${label.className}`}>
              {label.text}
            </span>
            <span className="shrink-0 text-base font-medium">{item.title}</span>
            <span className="min-w-0 flex-1 truncate text-base text-grey-800">{item.detail}</span>
            <time className="shrink-0 text-xs text-grey-800" dateTime={item.at}>
              {when(item.at)}
            </time>
          </div>
        );
        return (
          <li key={`${item.kind}-${item.at}-${index}`}>
            {item.href ? (
              <Link href={item.href} className="block hover:bg-grey-100">
                {row}
              </Link>
            ) : (
              row
            )}
          </li>
        );
      })}
    </ul>
  );
}

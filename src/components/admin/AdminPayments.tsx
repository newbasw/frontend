'use client';

import { useEffect, useState } from 'react';
import { clientApi } from '@/lib/api';
import { formatPrice } from '@/lib/format';
import { Spinner } from '../icons';

/**
 * Admin side of the payment flow: read the request, paste the account details,
 * then confirm once the money lands.
 */

interface Payment {
  id: string;
  reference: string;
  status: 'requested' | 'details_sent' | 'reported_paid' | 'confirmed' | 'cancelled';
  method: string;
  amount_cents: number;
  kind: string;
  buyer_name: string;
  buyer_email: string | null;
  buyer_phone: string | null;
  note: string | null;
  payment_details: string | null;
  notified: boolean;
  notify_error: string | null;
  created_at: string;
  vehicle_title: string | null;
  vehicle_reference: string | null;
}

const STATUS_STYLE: Record<Payment['status'], string> = {
  requested: 'bg-cta text-ink',
  details_sent: 'bg-link text-white',
  reported_paid: 'bg-brand/25 text-brand-dark',
  confirmed: 'bg-ctaGreen text-white',
  cancelled: 'bg-grey-300 text-ink',
};

export function AdminPayments() {
  const [items, setItems] = useState<Payment[] | null>(null);
  const [drafts, setDrafts] = useState<Record<string, string>>({});
  const [busy, setBusy] = useState<string | null>(null);

  const load = () =>
    clientApi<{ items: Payment[] }>('/api/admin/payments')
      .then((res) => setItems(res.items))
      .catch(() => setItems([]));

  useEffect(() => {
    load();
    const timer = setInterval(load, 12_000);
    return () => clearInterval(timer);
  }, []);

  async function act(id: string, path: string, body?: unknown) {
    setBusy(id);
    try {
      await clientApi(`/api/admin/payments/${id}/${path}`, {
        method: 'POST',
        ...(body ? { body: JSON.stringify(body) } : {}),
      });
      await load();
    } finally {
      setBusy(null);
    }
  }

  if (items === null) return <div className="h-64 animate-pulse rounded-minimal bg-grey-100" />;

  if (items.length === 0) {
    return (
      <p className="rounded-minimal border border-dashed border-grey-400 p-8 text-center text-base text-grey-800">
        No payment requests yet.
      </p>
    );
  }

  return (
    <ul data-testid="admin-payments" className="space-y-4">
      {items.map((p) => (
        <li key={p.id} className="rounded-minimal border border-grey-300">
          <div className="flex flex-wrap items-center gap-3 border-b border-grey-300 px-4 py-3">
            <span
              className={`rounded-minimal px-2 py-0.5 text-xs font-semibold ${STATUS_STYLE[p.status]}`}
            >
              {p.status.replace('_', ' ')}
            </span>
            <span className="font-semibold">{p.reference}</span>
            <span className="text-base text-grey-800">{p.method.replace('_', ' ')}</span>
            <span className="ml-auto text-lg font-semibold">
              {formatPrice(p.amount_cents)}
              {p.kind === 'deposit' && (
                <span className="ml-1 text-base font-normal text-grey-800">deposit</span>
              )}
            </span>
          </div>

          <div className="grid gap-4 p-4 md:grid-cols-2">
            <div className="space-y-1 text-base">
              <p>
                <span className="text-grey-800">Buyer:</span> <strong>{p.buyer_name}</strong>
              </p>
              {p.buyer_email && (
                <p>
                  <span className="text-grey-800">Email:</span> {p.buyer_email}
                </p>
              )}
              {p.buyer_phone && (
                <p>
                  <span className="text-grey-800">Phone:</span> {p.buyer_phone}
                </p>
              )}
              {p.vehicle_title && (
                <p>
                  <span className="text-grey-800">Vehicle:</span> {p.vehicle_title} (
                  {p.vehicle_reference})
                </p>
              )}
              {p.note && <p className="text-grey-800">&ldquo;{p.note}&rdquo;</p>}
              <p className="text-xs text-grey-800">
                Telegram: {p.notified ? 'alert sent' : (p.notify_error ?? 'not sent')}
              </p>
            </div>

            <div>
              {p.status === 'requested' ? (
                <>
                  <label htmlFor={`details-${p.id}`} className="bw-label">
                    Account details to send
                  </label>
                  <textarea
                    id={`details-${p.id}`}
                    rows={4}
                    value={drafts[p.id] ?? ''}
                    onChange={(e) => setDrafts((d) => ({ ...d, [p.id]: e.target.value }))}
                    placeholder={`IBAN NL00 BANK 0000 0000 00\nName: BAS World BV\nReference: ${p.reference}`}
                    className="w-full rounded-minimal border border-grey-400 p-3 font-mono text-base outline-none focus:border-ink"
                  />
                  <button
                    type="button"
                    disabled={busy === p.id || !(drafts[p.id] ?? '').trim()}
                    onClick={() => act(p.id, 'details', { payment_details: drafts[p.id] })}
                    data-testid="send-details"
                    className="bw-btn-black mt-2 w-full"
                  >
                    {busy === p.id ? <Spinner size={16} /> : 'Send details to buyer'}
                  </button>
                </>
              ) : (
                <>
                  {p.payment_details && (
                    <pre className="whitespace-pre-wrap rounded-minimal bg-grey-100 p-3 font-sans text-base">
                      {p.payment_details}
                    </pre>
                  )}
                  {(p.status === 'details_sent' || p.status === 'reported_paid') && (
                    <div className="mt-2 flex gap-2">
                      <button
                        type="button"
                        disabled={busy === p.id}
                        onClick={() => act(p.id, 'confirm')}
                        className="bw-btn-cta-green flex-1"
                      >
                        Payment received
                      </button>
                      <button
                        type="button"
                        disabled={busy === p.id}
                        onClick={() => act(p.id, 'cancel')}
                        className="bw-btn-outline"
                      >
                        Cancel
                      </button>
                    </div>
                  )}
                </>
              )}
            </div>
          </div>
        </li>
      ))}
    </ul>
  );
}

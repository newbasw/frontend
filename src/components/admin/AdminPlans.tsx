'use client';

import { useEffect, useState } from 'react';
import { API_URL, clientApi } from '@/lib/api';
import { formatPrice } from '@/lib/format';
import { Spinner } from '../icons';

/**
 * Admin review of instalment plans: check the paperwork, approve or decline,
 * and see where each buyer stands.
 */

interface Plan {
  id: string;
  reference: string;
  status: string;
  total_cents: number;
  deposit_cents: number;
  term_months: number;
  interest_bps: number;
  buyer_name: string;
  buyer_email: string | null;
  buyer_phone: string | null;
  delivery_address: string | null;
  delivery_country: string | null;
  admin_note: string | null;
  created_at: string;
  delivered_at: string | null;
  vehicle_title: string | null;
  vehicle_reference: string | null;
  paid_cents: number;
  document_count: number;
  documents_pending: number;
  notified: boolean;
  notify_error: string | null;
}

interface Doc {
  id: string;
  doc_type: string;
  original_name: string;
  mime_type: string;
  size_bytes: number;
  status: string;
  review_note: string | null;
}

interface Detail {
  documents: Doc[];
  missingDocuments: string[];
  installments: {
    seq: number;
    amount_cents: number;
    due_date: string;
    status: string;
    extension_count: number;
  }[];
  progress: { paidCents: number; percentPaid: number; deliveryUnlocked: boolean };
}

const STATUS_STYLE: Record<string, string> = {
  documents_pending: 'bg-cta text-ink',
  under_review: 'bg-link text-white',
  approved: 'bg-brand/25 text-brand-dark',
  active: 'bg-brand/25 text-brand-dark',
  delivered: 'bg-ctaGreen text-white',
  completed: 'bg-ctaGreen text-white',
  rejected: 'bg-sale text-white',
  cancelled: 'bg-grey-300 text-ink',
  draft: 'bg-grey-300 text-ink',
};

export function AdminPlans() {
  const [items, setItems] = useState<Plan[] | null>(null);
  const [openId, setOpenId] = useState<string | null>(null);
  const [detail, setDetail] = useState<Detail | null>(null);
  const [busy, setBusy] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  const load = () =>
    clientApi<{ items: Plan[] }>('/api/admin/plans')
      .then((res) => setItems(res.items))
      .catch(() => setItems([]));

  useEffect(() => {
    void load();
    const timer = setInterval(load, 15_000);
    return () => clearInterval(timer);
  }, []);

  async function openPlan(id: string) {
    if (openId === id) {
      setOpenId(null);
      setDetail(null);
      return;
    }
    setOpenId(id);
    setDetail(null);
    const res = await clientApi<Detail>(`/api/admin/plans/${id}`);
    setDetail(res);
  }

  async function act(id: string, path: string, body?: unknown) {
    setBusy(id);
    setError(null);
    try {
      await clientApi(`/api/admin/plans/${id}/${path}`, {
        method: 'POST',
        ...(body ? { body: JSON.stringify(body) } : {}),
      });
      await load();
      if (openId === id) {
        setDetail(await clientApi<Detail>(`/api/admin/plans/${id}`));
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'That did not work.');
    } finally {
      setBusy(null);
    }
  }

  if (items === null) return <div className="h-64 animate-pulse rounded-minimal bg-grey-100" />;

  if (items.length === 0) {
    return (
      <p className="rounded-minimal border border-dashed border-grey-400 p-8 text-center text-base text-grey-800">
        No instalment plans yet.
      </p>
    );
  }

  return (
    <>
      {error && (
        <p role="alert" className="bw-field-error mb-3">
          {error}
        </p>
      )}

      <ul data-testid="admin-plans" className="space-y-4">
        {items.map((p) => (
          <li key={p.id} className="rounded-minimal border border-grey-300">
            <div className="flex flex-wrap items-center gap-3 border-b border-grey-300 px-4 py-3">
              <span
                className={`rounded-minimal px-2 py-0.5 text-xs font-semibold ${
                  STATUS_STYLE[p.status] ?? 'bg-grey-300 text-ink'
                }`}
              >
                {p.status.replace('_', ' ')}
              </span>
              <span className="font-semibold">{p.reference}</span>
              <span className="text-base text-grey-800">
                {p.term_months} months · {(p.interest_bps / 100).toFixed(2)}%
              </span>
              {p.documents_pending > 0 && (
                <span className="rounded-full bg-sale px-2 py-0.5 text-xs text-white">
                  {p.documents_pending} to check
                </span>
              )}
              <span className="ml-auto text-lg font-semibold">{formatPrice(p.total_cents)}</span>
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
                {p.delivery_address && (
                  <p>
                    <span className="text-grey-800">Deliver to:</span> {p.delivery_address}
                    {p.delivery_country ? `, ${p.delivery_country}` : ''}
                  </p>
                )}
                <p>
                  <span className="text-grey-800">Paid:</span>{' '}
                  <strong>{formatPrice(p.paid_cents)}</strong> of {formatPrice(p.total_cents)}
                </p>
                <p className="text-xs text-grey-800">
                  Telegram: {p.notified ? 'alert sent' : (p.notify_error ?? 'not sent')}
                </p>
              </div>

              <div className="flex flex-col gap-2">
                <button
                  type="button"
                  onClick={() => openPlan(p.id)}
                  className="bw-btn-outline"
                  data-testid={`review-${p.reference}`}
                >
                  {openId === p.id ? 'Hide' : `Review ${p.document_count} document${p.document_count === 1 ? '' : 's'}`}
                </button>

                {(p.status === 'under_review' || p.status === 'documents_pending') && (
                  <div className="flex gap-2">
                    <button
                      type="button"
                      disabled={busy === p.id}
                      onClick={() => act(p.id, 'approve')}
                      className="bw-btn-cta-green flex-1"
                    >
                      {busy === p.id ? <Spinner size={14} /> : 'Approve plan'}
                    </button>
                    <button
                      type="button"
                      disabled={busy === p.id}
                      onClick={() => act(p.id, 'reject')}
                      className="bw-btn-outline"
                    >
                      Decline
                    </button>
                  </div>
                )}

                {['approved', 'active'].includes(p.status) && !p.delivered_at && (
                  <button
                    type="button"
                    disabled={busy === p.id}
                    onClick={() => act(p.id, 'deliver')}
                    className="bw-btn-black"
                  >
                    Mark delivered
                  </button>
                )}
              </div>
            </div>

            {/* Paperwork */}
            {openId === p.id && (
              <div className="border-t border-grey-300 bg-grey-100 p-4">
                {!detail ? (
                  <div className="h-24 animate-pulse rounded-minimal bg-white" />
                ) : (
                  <>
                    {detail.missingDocuments.length > 0 && (
                      <p className="mb-3 text-base text-sale">
                        Still missing: {detail.missingDocuments.join(', ')}
                      </p>
                    )}

                    <ul className="space-y-2">
                      {detail.documents.map((d) => (
                        <li
                          key={d.id}
                          className="flex flex-wrap items-center gap-2 rounded-minimal bg-white p-3"
                        >
                          <span className="text-base font-semibold">
                            {d.doc_type.replace(/_/g, ' ')}
                          </span>
                          <a
                            /* Opens through the authenticated admin route —
                               documents have no public URL. */
                            href={`${API_URL}/api/admin/plans/${p.id}/documents/${d.id}`}
                            target="_blank"
                            rel="noreferrer noopener"
                            className="text-base text-link hover:underline"
                          >
                            {d.original_name}
                          </a>
                          <span className="text-xs text-grey-800">
                            {(d.size_bytes / 1024).toFixed(0)} KB
                          </span>

                          <span className="ml-auto flex gap-2">
                            <span
                              className={`rounded-minimal px-2 py-0.5 text-xs font-semibold ${
                                d.status === 'approved'
                                  ? 'bg-ctaGreen text-white'
                                  : d.status === 'rejected'
                                    ? 'bg-sale text-white'
                                    : 'bg-cta text-ink'
                              }`}
                            >
                              {d.status}
                            </span>
                            {d.status === 'pending' && (
                              <>
                                <button
                                  type="button"
                                  onClick={() =>
                                    act(p.id, `documents/${d.id}/review`, { status: 'approved' })
                                  }
                                  className="bw-btn-outline px-2 py-0.5 text-base"
                                >
                                  Accept
                                </button>
                                <button
                                  type="button"
                                  onClick={() =>
                                    act(p.id, `documents/${d.id}/review`, {
                                      status: 'rejected',
                                      review_note: 'Not readable — please send a clearer copy.',
                                    })
                                  }
                                  className="bw-btn-outline px-2 py-0.5 text-base"
                                >
                                  Reject
                                </button>
                              </>
                            )}
                          </span>
                        </li>
                      ))}
                      {detail.documents.length === 0 && (
                        <li className="text-base text-grey-800">Nothing uploaded yet.</li>
                      )}
                    </ul>

                    {/* Schedule */}
                    <table className="mt-4 w-full text-base">
                      <thead>
                        <tr className="text-left text-grey-800">
                          <th className="py-1">#</th>
                          <th>Due</th>
                          <th>Amount</th>
                          <th>Status</th>
                        </tr>
                      </thead>
                      <tbody>
                        {detail.installments.map((i) => (
                          <tr key={i.seq} className="border-t border-grey-300">
                            <td className="py-1">{i.seq === 0 ? 'Deposit' : i.seq}</td>
                            <td>
                              {i.due_date}
                              {i.extension_count > 0 && (
                                <span className="ml-1 text-xs text-grey-800">
                                  ({i.extension_count}× deferred)
                                </span>
                              )}
                            </td>
                            <td>{formatPrice(i.amount_cents)}</td>
                            <td>{i.status}</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </>
                )}
              </div>
            )}
          </li>
        ))}
      </ul>
    </>
  );
}

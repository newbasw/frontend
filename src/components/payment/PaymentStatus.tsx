'use client';

import { useCallback, useEffect, useState } from 'react';
import { ApiRequestError, clientApi } from '@/lib/api';
import { formatPrice } from '@/lib/format';
import { Check, Copy, Spinner } from '../icons';
import { ChatWidget } from '../chat/ChatWidget';

/**
 * The buyer's view of a payment request, shared by the panel on the vehicle
 * page and the standalone /pay/[reference] page.
 *
 * It polls while the request is still moving, so the account details appear as
 * soon as an admin sends them without the buyer refreshing.
 */

export interface PaymentRequest {
  reference: string;
  status: 'requested' | 'details_sent' | 'reported_paid' | 'confirmed' | 'cancelled';
  method: string;
  amount_cents: number;
  kind: string;
  payment_details: string | null;
  admin_note: string | null;
  vehicle_title?: string | null;
}

const COPY: Record<PaymentRequest['status'], { title: string; body: string }> = {
  requested: {
    title: 'Request sent',
    body: 'Our team has been alerted and will send your account details here, usually within a few minutes. This page updates on its own.',
  },
  details_sent: {
    title: 'Account details ready',
    body: 'Send the payment using the details below, quoting your reference, then let us know.',
  },
  reported_paid: {
    title: 'Thanks — we are checking',
    body: 'We are confirming the transfer. You will hear from us as soon as it clears.',
  },
  confirmed: {
    title: 'Payment confirmed',
    body: 'We have received your payment. Our team will be in touch about collection or delivery.',
  },
  cancelled: {
    title: 'Request cancelled',
    body: 'This payment request is no longer active. Start a new one if you still want the vehicle.',
  },
};

const SETTLED = new Set(['confirmed', 'cancelled']);

export function PaymentStatus({
  reference,
  initial,
  vehicleId = null,
  showChat = true,
}: {
  reference: string;
  initial?: PaymentRequest;
  vehicleId?: string | null;
  /** Offer the chat while the buyer is waiting on us. */
  showChat?: boolean;
}) {
  const [request, setRequest] = useState<PaymentRequest | null>(initial ?? null);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  const [copied, setCopied] = useState(false);

  const refresh = useCallback(
    () =>
      clientApi<{ request: PaymentRequest }>(`/api/payments/${reference}`)
        .then((res) => {
          setRequest(res.request);
          setLoadError(null);
        })
        .catch((err) => {
          if (!request) {
            setLoadError(
              err instanceof ApiRequestError
                ? err.message
                : 'We could not load that payment reference.',
            );
          }
        }),
    [reference, request],
  );

  useEffect(() => {
    if (!initial) void refresh();
    // Only on mount, and whenever the reference changes.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [reference]);

  useEffect(() => {
    if (request && SETTLED.has(request.status)) return;
    const timer = setInterval(() => void refresh(), 6000);
    return () => clearInterval(timer);
  }, [request, refresh]);

  async function reportPaid() {
    setBusy(true);
    setError(null);
    try {
      await clientApi(`/api/payments/${reference}/reported`, { method: 'POST' });
      await refresh();
    } catch (err) {
      setError(err instanceof ApiRequestError ? err.message : 'Could not update that.');
    } finally {
      setBusy(false);
    }
  }

  if (loadError) {
    return (
      <p role="alert" className="rounded-minimal border border-sale p-4 text-base">
        {loadError}
      </p>
    );
  }

  if (!request) return <div className="h-48 animate-pulse rounded-minimal bg-grey-100" />;

  const copy = COPY[request.status];

  return (
    <section data-testid="payment-status" className="rounded-minimal border border-grey-300">
      <header className="flex items-center gap-2 border-b border-grey-300 bg-grey-100 px-4 py-3">
        {request.status === 'confirmed' && <Check size={16} className="text-brand" />}
        <p className="text-md font-semibold">{copy.title}</p>
      </header>

      <div className="space-y-3 p-4">
        <p className="text-base text-grey-800">{copy.body}</p>

        <div className="flex items-center justify-between gap-2 rounded-minimal bg-grey-100 px-3 py-2 text-base">
          <span className="text-grey-800">Your reference</span>
          <button
            type="button"
            onClick={() => {
              navigator.clipboard?.writeText(request.reference).then(
                () => {
                  setCopied(true);
                  setTimeout(() => setCopied(false), 2000);
                },
                () => undefined,
              );
            }}
            className="flex items-center gap-2 font-semibold hover:text-link"
            title="Copy reference"
          >
            {request.reference}
            {copied ? <Check size={13} className="text-brand" /> : <Copy size={13} />}
          </button>
        </div>

        <div className="flex justify-between text-base">
          <span className="text-grey-800">Amount</span>
          <span className="font-semibold">
            {formatPrice(request.amount_cents)}
            {request.kind === 'deposit' ? ' deposit' : ''}
          </span>
        </div>

        {request.vehicle_title && (
          <div className="flex justify-between gap-4 text-base">
            <span className="text-grey-800">Vehicle</span>
            <span className="text-right font-semibold">{request.vehicle_title}</span>
          </div>
        )}

        {request.payment_details && (
          <div className="rounded-minimal border border-brand bg-brand/5 p-3">
            <p className="mb-1 text-xs font-semibold uppercase tracking-wide text-brand-dark">
              Where to send it
            </p>
            <pre className="whitespace-pre-wrap font-sans text-base">{request.payment_details}</pre>
            {request.admin_note && (
              <p className="mt-2 border-t border-brand/30 pt-2 text-base text-grey-800">
                {request.admin_note}
              </p>
            )}
          </div>
        )}

        {request.status === 'details_sent' && (
          <button
            type="button"
            onClick={reportPaid}
            disabled={busy}
            data-testid="report-paid"
            className="bw-btn-cta-green w-full"
          >
            {busy ? <Spinner size={16} /> : 'I have sent the payment'}
          </button>
        )}

        {request.status === 'requested' && (
          <p className="flex items-center gap-2 text-base text-grey-800">
            <Spinner size={14} /> Waiting for our team…
          </p>
        )}

        {/*
          Nobody should sit staring at a spinner. While we owe them a reply,
          put the chat right here rather than making them find it.
        */}
        {showChat && !SETTLED.has(request.status) && (
          <details data-testid="payment-chat" className="rounded-minimal border border-grey-300">
            <summary className="cursor-pointer list-none px-3 py-2 text-base font-semibold hover:bg-grey-100">
              💬 Need this faster? Chat to us now
            </summary>
            <div className="border-t border-grey-300 p-3">
              <p className="mb-2 text-base text-grey-800">
                We usually reply within a few minutes. Ask us anything about payment {reference}.
              </p>
              <ChatWidget
                inline
                vehicleId={vehicleId}
                vehicleTitle={request.vehicle_title ?? undefined}
              />
            </div>
          </details>
        )}

        {error && (
          <p role="alert" className="bw-field-error">
            {error}
          </p>
        )}
      </div>
    </section>
  );
}

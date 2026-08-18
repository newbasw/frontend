'use client';

import Link from 'next/link';
import { useEffect, useState } from 'react';
import { ApiRequestError, clientApi } from '@/lib/api';
import { useAuth } from '../auth/AuthProvider';
import { formatPrice } from '@/lib/format';
import { Spinner } from '../icons';
import { PaymentStatus, type PaymentRequest } from './PaymentStatus';
import { AccountRequired } from '../auth/AccountRequired';

/**
 * Buy-now panel.
 *
 * Deliberately not card checkout. The buyer picks how they would like to pay,
 * an admin is alerted on Telegram, and the account details come back here —
 * so no payment credentials are stored in, or pass through, this application.
 */

interface Method {
  value: string;
  label: string;
  blurb: string;
}

export function PaymentPanel({
  vehicleId,
  priceCents,
  title,
}: {
  vehicleId: string;
  priceCents: number | null;
  title: string;
}) {
  const { user } = useAuth();
  const [methods, setMethods] = useState<Method[]>([]);
  const [open, setOpen] = useState(false);
  const [method, setMethod] = useState('bank_transfer');
  const [kind, setKind] = useState<'full' | 'deposit'>('full');
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [phone, setPhone] = useState('');
  const [note, setNote] = useState('');
  const [busy, setBusy] = useState(false);
  const [request, setRequest] = useState<PaymentRequest | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [errors, setErrors] = useState<Record<string, string[]>>({});

  useEffect(() => {
    clientApi<{ items: Method[] }>('/api/payments/methods')
      .then((res) => setMethods(res.items))
      .catch(() => setMethods([]));
  }, []);

  useEffect(() => {
    if (user) {
      setName([user.first_name, user.last_name].filter(Boolean).join(' '));
      setEmail(user.email);
      setPhone(user.phone ?? '');
    }
  }, [user]);

  const deposit = priceCents ? Math.round(priceCents * 0.1) : 0;
  const amountCents = kind === 'deposit' ? deposit : (priceCents ?? 0);

  async function submit(event: React.FormEvent) {
    event.preventDefault();
    setBusy(true);
    setError(null);
    setErrors({});
    try {
      const res = await clientApi<{ request: PaymentRequest }>('/api/payments/request', {
        method: 'POST',
        body: JSON.stringify({ vehicleId, method, amountCents, kind, name, email, phone, note }),
      });
      setRequest(res.request);
    } catch (err) {
      if (err instanceof ApiRequestError) {
        setErrors(err.details ?? {});
        setError(err.details ? null : err.message);
      } else setError('Could not send the request.');
    } finally {
      setBusy(false);
    }
  }

  // Once a request exists the shared status view takes over, and keeps the
  // buyer here on the vehicle page rather than sending them elsewhere.
  if (request) {
    return (
      <div className="space-y-2">
        <PaymentStatus reference={request.reference} initial={request} />
        <p className="text-xs text-grey-800">
          Keep this link:{' '}
          <Link href={`/pay/${request.reference}`} className="text-link hover:underline">
            /pay/{request.reference}
          </Link>
        </p>
      </div>
    );
  }

  return (
    <section data-testid="payment-panel" className="rounded-minimal border border-grey-300">
      <header className="border-b border-grey-300 bg-grey-100 px-4 py-3">
        <p className="text-md font-semibold">Buy this vehicle</p>
      </header>

      <div className="p-4">
        {!user ? (
          <AccountRequired
            action="buy this vehicle"
            reason="Paying means we hold a record for you — your reference, the account details we send, and the status of the transfer. That needs an account."
          />
        ) : !open ? (
          <>
            <p className="text-base text-grey-800">
              Pay by bank transfer, Zelle, Chime, Wise, Revolut or crypto. Tell us how you would
              like to pay and we will send the account details straight away.
            </p>
            <button
              type="button"
              onClick={() => setOpen(true)}
              data-testid="open-payment"
              className="bw-btn-cta mt-3 w-full"
            >
              Buy now
            </button>
          </>
        ) : (
          <form onSubmit={submit} className="space-y-4">
            <fieldset>
              <legend className="bw-label">Paying</legend>
              <div className="grid grid-cols-2 gap-2">
                {(['full', 'deposit'] as const).map((k) => (
                  <label
                    key={k}
                    className={`cursor-pointer rounded-minimal border px-3 py-2 text-base ${
                      kind === k ? 'border-ink bg-grey-100 font-semibold' : 'border-grey-400'
                    }`}
                  >
                    <input
                      type="radio"
                      name="kind"
                      className="sr-only"
                      checked={kind === k}
                      onChange={() => setKind(k)}
                    />
                    {k === 'full' ? 'Full amount' : '10% deposit'}
                    <span className="block text-xs text-grey-800">
                      {formatPrice(k === 'full' ? priceCents : deposit)}
                    </span>
                  </label>
                ))}
              </div>
            </fieldset>

            <div>
              <label htmlFor="pay-method" className="bw-label">
                How would you like to pay?
              </label>
              <select
                id="pay-method"
                value={method}
                onChange={(e) => setMethod(e.target.value)}
                data-testid="payment-method"
                className="bw-input"
              >
                {methods.map((m) => (
                  <option key={m.value} value={m.value}>
                    {m.label}
                  </option>
                ))}
              </select>
              <p className="mt-1 text-xs text-grey-800">
                {methods.find((m) => m.value === method)?.blurb}
              </p>
            </div>

            <div className="grid gap-3 sm:grid-cols-2">
              <div>
                <label htmlFor="pay-name" className="bw-label">Name</label>
                <input id="pay-name" value={name} onChange={(e) => setName(e.target.value)} required className="bw-input" />
                {errors.name?.map((e) => <span key={e} className="bw-field-error">{e}</span>)}
              </div>
              <div>
                <label htmlFor="pay-email" className="bw-label">Email</label>
                <input id="pay-email" type="email" value={email} onChange={(e) => setEmail(e.target.value)} className="bw-input" />
                {errors.email?.map((e) => <span key={e} className="bw-field-error">{e}</span>)}
              </div>
            </div>

            <div>
              <label htmlFor="pay-phone" className="bw-label">Phone (optional)</label>
              <input id="pay-phone" value={phone} onChange={(e) => setPhone(e.target.value)} className="bw-input" />
            </div>

            <div>
              <label htmlFor="pay-note" className="bw-label">Anything we should know? (optional)</label>
              <textarea
                id="pay-note"
                rows={2}
                value={note}
                onChange={(e) => setNote(e.target.value)}
                className="w-full rounded-minimal border-0 border-b border-grey-600 bg-grey-100 p-3 text-base outline-none focus:border-link"
              />
            </div>

            {error && <p role="alert" className="bw-field-error">{error}</p>}

            <button type="submit" disabled={busy} data-testid="submit-payment" className="bw-btn-cta w-full">
              {busy ? <Spinner size={16} /> : `Request payment details for ${formatPrice(amountCents)}`}
            </button>
            <p className="text-xs text-grey-800">
              No card details are taken here. We send you our account details and you pay directly.
            </p>
          </form>
        )}
      </div>
    </section>
  );
}

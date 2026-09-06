'use client';

import Link from 'next/link';
import { useEffect, useMemo, useState } from 'react';
import { ApiRequestError, clientApi } from '@/lib/api';
import { useAuth } from '../auth/AuthProvider';
import { formatPrice } from '@/lib/format';
import { Spinner } from '../icons';
import { PaymentStatus, type PaymentRequest } from '../payment/PaymentStatus';
import { AccountRequired } from '../auth/AccountRequired';

/**
 * Rent panel — the third way to take a vehicle, beside buying and instalments.
 *
 * The quote (price + availability) is computed by the server on every date
 * change, so the figure shown is exactly what will be charged. On submit the
 * rental is created together with an ordinary payment request, and the shared
 * PaymentStatus view takes over — the money runs through the same flow as a
 * purchase, no separate checkout.
 */

interface Method {
  value: string;
  label: string;
  blurb: string;
}

interface Quote {
  available: boolean;
  reason: string | null;
  durationDays?: number;
  dailyRateCents?: number;
  priceCents?: number;
  message?: string;
}

const todayISO = () => new Date().toISOString().slice(0, 10);

export function RentPanel({ vehicleId, priceCents }: { vehicleId: string; priceCents: number | null }) {
  const { user } = useAuth();
  const [open, setOpen] = useState(false);
  const [methods, setMethods] = useState<Method[]>([]);
  const [terms, setTerms] = useState<string[]>([]);

  const [start, setStart] = useState('');
  const [end, setEnd] = useState('');
  const [method, setMethod] = useState('bank_transfer');
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [phone, setPhone] = useState('');
  const [note, setNote] = useState('');
  const [agree, setAgree] = useState(false);

  const [quote, setQuote] = useState<Quote | null>(null);
  const [quoting, setQuoting] = useState(false);
  const [busy, setBusy] = useState(false);
  const [request, setRequest] = useState<PaymentRequest | null>(null);
  const [rentalRef, setRentalRef] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [errors, setErrors] = useState<Record<string, string[]>>({});

  useEffect(() => {
    clientApi<{ terms: string[]; methods: Method[] }>('/api/rentals/terms')
      .then((r) => { setTerms(r.terms); setMethods(r.methods); })
      .catch(() => { setTerms([]); setMethods([]); });
  }, []);

  useEffect(() => {
    if (user) {
      setName([user.first_name, user.last_name].filter(Boolean).join(' '));
      setEmail(user.email);
      setPhone(user.phone ?? '');
    }
  }, [user]);

  // Re-quote whenever a valid date range is set.
  useEffect(() => {
    if (!start || !end || end <= start) { setQuote(null); return; }
    let cancelled = false;
    setQuoting(true);
    clientApi<Quote>(`/api/rentals/quote?vehicleId=${vehicleId}&start=${start}&end=${end}`)
      .then((q) => { if (!cancelled) setQuote(q); })
      .catch((e) => { if (!cancelled) setQuote({ available: false, reason: 'error', message: e instanceof ApiRequestError ? e.message : 'Could not price these dates.' }); })
      .finally(() => { if (!cancelled) setQuoting(false); });
    return () => { cancelled = true; };
  }, [vehicleId, start, end]);

  const canSubmit = useMemo(
    () => Boolean(start && end && end > start && quote?.available && agree && name.trim() && !busy),
    [start, end, quote, agree, name, busy],
  );

  async function submit(event: React.FormEvent) {
    event.preventDefault();
    setBusy(true); setError(null); setErrors({});
    try {
      const res = await clientApi<{ request: PaymentRequest; rental: { reference: string } }>('/api/rentals/request', {
        method: 'POST',
        body: JSON.stringify({ vehicleId, method, start, end, name, email, phone, note, agreementAccepted: agree }),
      });
      setRequest(res.request);
      setRentalRef(res.rental.reference);
    } catch (err) {
      if (err instanceof ApiRequestError) { setErrors(err.details ?? {}); setError(err.details ? null : err.message); }
      else setError('Could not send the rental request.');
    } finally { setBusy(false); }
  }

  // Once created, the shared payment status view drives the rest.
  if (request) {
    return (
      <div className="space-y-2">
        <div className="rounded-minimal border border-brand bg-brand/5 p-3 text-base">
          Rental <span className="font-semibold">{rentalRef}</span> created — complete the payment below to
          confirm your booking.
        </div>
        <PaymentStatus reference={request.reference} initial={request} />
        <p className="text-xs text-grey-800">
          Keep this link:{' '}
          <Link href={`/rent/${rentalRef}`} className="text-link hover:underline">/rent/{rentalRef}</Link>
        </p>
      </div>
    );
  }

  const priceLine = quote?.available && quote.priceCents != null
    ? `${formatPrice(quote.priceCents)} for ${quote.durationDays} day${quote.durationDays === 1 ? '' : 's'}`
    : null;

  return (
    <section data-testid="rent-panel" className="rounded-minimal border-2 border-brand">
      <header className="flex items-center justify-between border-b border-grey-300 bg-brand/10 px-4 py-3">
        <p className="text-md font-semibold text-brand-dark">Rent this vehicle</p>
        <span className="rounded-full bg-brand px-2 py-0.5 text-xs font-semibold text-white">New</span>
      </header>

      <div className="p-4">
        {!user ? (
          <AccountRequired
            action="rent this vehicle"
            reason="Renting means we hold a booking and a payment record for you. That needs an account."
          />
        ) : !open ? (
          <>
            <p className="text-base text-grey-800">
              Need it for a job, not for keeps? Rent this vehicle by the day — choose your dates and pay
              through the same secure methods we use for purchases.
            </p>
            <button type="button" onClick={() => setOpen(true)} data-testid="open-rent" className="bw-btn-cta mt-3 w-full">
              Rent now
            </button>
          </>
        ) : (
          <form onSubmit={submit} className="space-y-4">
            <div className="grid gap-3 sm:grid-cols-2">
              <div>
                <label htmlFor="rent-start" className="bw-label">Start date</label>
                <input id="rent-start" type="date" min={todayISO()} value={start}
                  onChange={(e) => setStart(e.target.value)} required className="bw-input" />
              </div>
              <div>
                <label htmlFor="rent-end" className="bw-label">End date</label>
                <input id="rent-end" type="date" min={start || todayISO()} value={end}
                  onChange={(e) => setEnd(e.target.value)} required className="bw-input" />
              </div>
            </div>

            {/* Live quote / availability */}
            {quoting && <p className="text-base text-grey-800"><Spinner size={14} /> Checking availability…</p>}
            {!quoting && quote && (
              quote.available ? (
                <div className="rounded-minimal border border-brand bg-brand/5 p-3">
                  <p className="text-lg font-semibold">{priceLine}</p>
                  {quote.dailyRateCents != null && (
                    <p className="text-xs text-grey-800">{formatPrice(quote.dailyRateCents)} / day · available for these dates</p>
                  )}
                </div>
              ) : (
                <p role="alert" className="rounded-minimal border border-sale/50 bg-sale/10 p-3 text-base text-sale">
                  {quote.message
                    || (quote.reason === 'dates_taken' ? 'Those dates are already booked. Try a different range.'
                      : quote.reason === 'not_online' ? 'This vehicle is not currently available to rent.'
                      : 'These dates are not available.')}
                </p>
              )
            )}

            <div>
              <label htmlFor="rent-method" className="bw-label">How would you like to pay?</label>
              <select id="rent-method" value={method} onChange={(e) => setMethod(e.target.value)} className="bw-input">
                {methods.map((m) => <option key={m.value} value={m.value}>{m.label}</option>)}
              </select>
            </div>

            <div className="grid gap-3 sm:grid-cols-2">
              <div>
                <label htmlFor="rent-name" className="bw-label">Name</label>
                <input id="rent-name" value={name} onChange={(e) => setName(e.target.value)} required className="bw-input" />
                {errors.name?.map((e) => <span key={e} className="bw-field-error">{e}</span>)}
              </div>
              <div>
                <label htmlFor="rent-email" className="bw-label">Email</label>
                <input id="rent-email" type="email" value={email} onChange={(e) => setEmail(e.target.value)} className="bw-input" />
              </div>
            </div>
            <div>
              <label htmlFor="rent-phone" className="bw-label">Phone (optional)</label>
              <input id="rent-phone" value={phone} onChange={(e) => setPhone(e.target.value)} className="bw-input" />
            </div>
            <div>
              <label htmlFor="rent-note" className="bw-label">Anything we should know? (optional)</label>
              <textarea id="rent-note" rows={2} value={note} onChange={(e) => setNote(e.target.value)}
                className="w-full rounded-minimal border-0 border-b border-grey-600 bg-grey-100 p-3 text-base outline-none focus:border-link" />
            </div>

            {/* Rental agreement — required */}
            {terms.length > 0 && (
              <div className="rounded-minimal border border-grey-300 bg-grey-100 p-3">
                <p className="bw-label mb-1">Rental agreement</p>
                <ul className="mb-2 list-disc space-y-1 pl-5 text-xs text-grey-800">
                  {terms.map((t, i) => <li key={i}>{t}</li>)}
                </ul>
                <label className="flex items-start gap-2 text-base">
                  <input type="checkbox" checked={agree} onChange={(e) => setAgree(e.target.checked)} className="mt-1" />
                  <span>I have read and accept the rental agreement.</span>
                </label>
                {errors.agreementAccepted?.map((e) => <span key={e} className="bw-field-error">{e}</span>)}
              </div>
            )}

            {error && <p role="alert" className="bw-field-error">{error}</p>}

            <button type="submit" disabled={!canSubmit} data-testid="submit-rent" className="bw-btn-cta w-full">
              {busy ? <Spinner size={16} /> : priceLine ? `Request to rent — ${formatPrice(quote!.priceCents!)}` : 'Choose available dates'}
            </button>
            <p className="text-xs text-grey-800">
              No card details are taken here. We send you our account details and you pay directly, then your booking is confirmed.
            </p>
          </form>
        )}
      </div>
    </section>
  );
}

'use client';

import { useRouter } from 'next/navigation';
import { useEffect, useMemo, useState } from 'react';
import { ApiRequestError, clientApi } from '@/lib/api';
import { useAuth } from '../auth/AuthProvider';
import { formatPrice } from '@/lib/format';
import { Spinner } from '../icons';

/**
 * Start an instalment plan from the vehicle page.
 *
 * The quote is priced by the server on every change rather than in the
 * browser, so what a buyer is shown is exactly what will be written to their
 * schedule — there is no second copy of the maths to drift.
 */

interface Term {
  termMonths: number;
  interestBps: number;
  label: string;
  blurb: string;
}

interface Quote {
  totalCents: number;
  depositCents: number;
  financedCents: number;
  feeCents: number;
  termMonths: number;
  monthlyCents: number;
  payableCents: number;
  deliveryAtCents: number;
  deliveryThresholdPct: number;
}

const DEPOSIT_STEPS = [10, 20, 30, 50];

export function PlanStarter({
  vehicleId,
  priceCents,
}: {
  vehicleId: string;
  priceCents: number | null;
}) {
  const router = useRouter();
  const { user } = useAuth();

  const [open, setOpen] = useState(false);
  const [terms, setTerms] = useState<Term[]>([]);
  const [termMonths, setTermMonths] = useState(6);
  const [depositPct, setDepositPct] = useState(20);
  const [quote, setQuote] = useState<Quote | null>(null);
  const [quoteError, setQuoteError] = useState<string | null>(null);

  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [phone, setPhone] = useState('');
  const [address, setAddress] = useState('');
  const [country, setCountry] = useState('');
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [errors, setErrors] = useState<Record<string, string[]>>({});

  const depositCents = useMemo(
    () => (priceCents ? Math.ceil((priceCents * depositPct) / 100) : 0),
    [priceCents, depositPct],
  );

  useEffect(() => {
    clientApi<{ terms: Term[] }>('/api/plans/options')
      .then((res) => setTerms(res.terms))
      .catch(() => setTerms([]));
  }, []);

  useEffect(() => {
    if (user) {
      setName([user.first_name, user.last_name].filter(Boolean).join(' '));
      setEmail(user.email);
      setPhone(user.phone ?? '');
    }
  }, [user]);

  // Re-price whenever the terms change.
  useEffect(() => {
    if (!open || !priceCents) return;
    let cancelled = false;

    clientApi<{ quote: Quote }>('/api/plans/quote', {
      method: 'POST',
      body: JSON.stringify({ vehicleId, depositCents, termMonths }),
    })
      .then((res) => {
        if (cancelled) return;
        setQuote(res.quote);
        setQuoteError(null);
      })
      .catch((err) => {
        if (cancelled) return;
        setQuote(null);
        setQuoteError(err instanceof ApiRequestError ? err.message : 'Could not price that plan.');
      });

    return () => {
      cancelled = true;
    };
  }, [open, vehicleId, depositCents, termMonths, priceCents]);

  async function submit(event: React.FormEvent) {
    event.preventDefault();
    setBusy(true);
    setError(null);
    setErrors({});
    try {
      const res = await clientApi<{ plan: { reference: string } }>('/api/plans', {
        method: 'POST',
        body: JSON.stringify({
          vehicleId,
          depositCents,
          termMonths,
          name,
          email,
          phone,
          deliveryAddress: address,
          deliveryCountry: country,
        }),
      });
      router.push(`/plans/${res.plan.reference}`);
    } catch (err) {
      if (err instanceof ApiRequestError) {
        setErrors(err.details ?? {});
        setError(err.details ? null : err.message);
      } else setError('Could not start that plan.');
      setBusy(false);
    }
  }

  if (!priceCents) return null;

  return (
    <section data-testid="plan-starter" className="rounded-minimal border-2 border-brand">
      <header className="border-b border-brand/30 bg-brand/5 px-4 py-3">
        <p className="text-md font-semibold">Or pay in instalments</p>
        <p className="text-base text-grey-800">
          Spread the cost. We deliver once you reach half — you do not wait until the end.
        </p>
      </header>

      <div className="p-4">
        {!open ? (
          <>
            <p className="text-base">
              From{' '}
              <strong>
                {formatPrice(Math.ceil((priceCents * 0.8) / 24))}
              </strong>{' '}
              a month over 24 months.
            </p>
            <button
              type="button"
              onClick={() => setOpen(true)}
              data-testid="open-plan"
              className="bw-btn-black mt-3 w-full"
            >
              Build my payment plan
            </button>
          </>
        ) : (
          <form onSubmit={submit} className="space-y-4">
            {/* Deposit */}
            <fieldset>
              <legend className="bw-label">Deposit</legend>
              <div className="grid grid-cols-4 gap-2">
                {DEPOSIT_STEPS.map((pct) => (
                  <label
                    key={pct}
                    className={`cursor-pointer rounded-minimal border px-2 py-2 text-center text-base ${
                      depositPct === pct ? 'border-ink bg-grey-100 font-semibold' : 'border-grey-400'
                    }`}
                  >
                    <input
                      type="radio"
                      name="deposit"
                      className="sr-only"
                      checked={depositPct === pct}
                      onChange={() => setDepositPct(pct)}
                    />
                    {pct}%
                  </label>
                ))}
              </div>
              <p className="mt-1 text-xs text-grey-800">{formatPrice(depositCents)} up front</p>
            </fieldset>

            {/* Term */}
            <fieldset>
              <legend className="bw-label">Pay over</legend>
              <div className="grid grid-cols-2 gap-2">
                {terms.map((t) => (
                  <label
                    key={t.termMonths}
                    className={`cursor-pointer rounded-minimal border px-3 py-2 text-base ${
                      termMonths === t.termMonths
                        ? 'border-ink bg-grey-100 font-semibold'
                        : 'border-grey-400'
                    }`}
                  >
                    <input
                      type="radio"
                      name="term"
                      className="sr-only"
                      checked={termMonths === t.termMonths}
                      onChange={() => setTermMonths(t.termMonths)}
                    />
                    {t.label}
                    <span className="block text-xs font-normal text-grey-800">{t.blurb}</span>
                  </label>
                ))}
              </div>
            </fieldset>

            {/* Quote */}
            {quoteError && <p className="bw-field-error">{quoteError}</p>}
            {quote && (
              <div data-testid="plan-quote" className="rounded-minimal bg-grey-100 p-3 text-base">
                <div className="flex justify-between">
                  <span className="text-grey-800">Deposit today</span>
                  <span className="font-semibold">{formatPrice(quote.depositCents)}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-grey-800">
                    Then {quote.termMonths} × monthly
                  </span>
                  <span className="font-semibold">{formatPrice(quote.monthlyCents)}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-grey-800">Financing cost</span>
                  <span>{quote.feeCents === 0 ? 'Interest free' : formatPrice(quote.feeCents)}</span>
                </div>
                <div className="mt-2 flex justify-between border-t border-grey-300 pt-2">
                  <span className="text-grey-800">Total to pay</span>
                  <span className="font-semibold">{formatPrice(quote.payableCents)}</span>
                </div>
                <p className="mt-2 rounded-minimal bg-white p-2 text-base">
                  🚚 We deliver once <strong>{formatPrice(quote.deliveryAtCents)}</strong> has
                  cleared — {quote.deliveryThresholdPct}% of the price.
                </p>
              </div>
            )}

            {/* Buyer */}
            <div className="grid gap-3 sm:grid-cols-2">
              <div>
                <label htmlFor="plan-name" className="bw-label">Full name</label>
                <input id="plan-name" value={name} onChange={(e) => setName(e.target.value)} required className="bw-input" />
                {errors.name?.map((e) => <span key={e} className="bw-field-error">{e}</span>)}
              </div>
              <div>
                <label htmlFor="plan-email" className="bw-label">Email</label>
                <input id="plan-email" type="email" value={email} onChange={(e) => setEmail(e.target.value)} className="bw-input" />
                {errors.email?.map((e) => <span key={e} className="bw-field-error">{e}</span>)}
              </div>
            </div>

            <div>
              <label htmlFor="plan-phone" className="bw-label">Phone</label>
              <input id="plan-phone" value={phone} onChange={(e) => setPhone(e.target.value)} className="bw-input" />
            </div>

            <div>
              <label htmlFor="plan-address" className="bw-label">Delivery address</label>
              <textarea
                id="plan-address"
                rows={2}
                value={address}
                onChange={(e) => setAddress(e.target.value)}
                placeholder="Where should we deliver the vehicle?"
                className="w-full rounded-minimal border-0 border-b border-grey-600 bg-grey-100 p-3 text-base outline-none focus:border-link"
              />
            </div>

            <div>
              <label htmlFor="plan-country" className="bw-label">Country</label>
              <input id="plan-country" value={country} onChange={(e) => setCountry(e.target.value)} className="bw-input" />
            </div>

            {error && <p role="alert" className="bw-field-error">{error}</p>}

            <button type="submit" disabled={busy || !quote} data-testid="submit-plan" className="bw-btn-cta w-full">
              {busy ? <Spinner size={16} /> : 'Continue — upload documents'}
            </button>
            <p className="text-xs text-grey-800">
              Next we will ask for ID and proof of income. Nothing is charged now, and no card
              details are ever taken.
            </p>
          </form>
        )}
      </div>
    </section>
  );
}

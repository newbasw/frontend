'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { ApiRequestError, clientApi } from '@/lib/api';
import { formatPrice } from '@/lib/format';
import { useAuth } from '../auth/AuthProvider';
import { Check, Spinner } from '../icons';
import { PaymentSheet } from '../payment/PaymentSheet';
import { PaymentStatus } from '../payment/PaymentStatus';

/**
 * What happens the moment an offer is agreed.
 *
 * A buyer who has just haggled their way to a price should not be told
 * "we will be in touch". They are ready to pay right now, so the two ways of
 * doing that are put in front of them immediately: settle it in full, or
 * spread it over months.
 *
 * The agreed figure is displayed here, but it is never what gets charged: the
 * API re-derives it from the accepted bid, so this component cannot be used to
 * pay a price that was not actually agreed.
 */

type Mode = 'choose' | 'full' | 'plan';

const DEPOSIT_STEPS = [10, 20, 30, 50];

interface Quote {
  depositCents: number;
  monthlyCents: number;
  termMonths: number;
  feeCents: number;
  payableCents: number;
  deliveryAtCents: number;
  deliveryThresholdPct: number;
}

interface Term {
  termMonths: number;
  interestBps: number;
  label: string;
  blurb: string;
}

export function DealClosing({
  vehicleId,
  auctionId,
  agreedCents,
  vehicleTitle,
}: {
  vehicleId: string;
  auctionId: string;
  agreedCents: number;
  vehicleTitle?: string;
}) {
  const router = useRouter();
  const { user } = useAuth();

  const [mode, setMode] = useState<Mode>('choose');
  const [paymentRef, setPaymentRef] = useState<string | null>(null);

  // Plan builder
  const [terms, setTerms] = useState<Term[]>([]);
  const [termMonths, setTermMonths] = useState(6);
  const [depositPct, setDepositPct] = useState(20);
  const [quote, setQuote] = useState<Quote | null>(null);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const depositCents = Math.ceil((agreedCents * depositPct) / 100);

  async function openPlan() {
    setMode('plan');
    setError(null);
    try {
      const opts = await clientApi<{ terms: Term[] }>('/api/plans/options');
      setTerms(opts.terms);
      await priceIt(termMonths, depositCents);
    } catch {
      setError('Could not load the plan options.');
    }
  }

  async function priceIt(months: number, deposit: number) {
    try {
      const res = await clientApi<{ quote: Quote }>('/api/plans/quote', {
        method: 'POST',
        body: JSON.stringify({ vehicleId, auctionId, depositCents: deposit, termMonths: months }),
      });
      setQuote(res.quote);
      setError(null);
    } catch (err) {
      setQuote(null);
      setError(err instanceof ApiRequestError ? err.message : 'Could not price that plan.');
    }
  }

  async function payInFull(method: string) {
    const res = await clientApi<{ request: { reference: string } }>('/api/payments/request', {
      method: 'POST',
      body: JSON.stringify({
        vehicleId,
        auctionId,
        method,
        // Sent for completeness; the API takes the agreed figure regardless.
        amountCents: agreedCents,
        kind: 'full',
        name: [user?.first_name, user?.last_name].filter(Boolean).join(' ') || 'Buyer',
        email: user?.email ?? '',
        phone: user?.phone ?? '',
        note: `Agreed offer for ${vehicleTitle ?? 'this vehicle'}`,
      }),
    });
    setPaymentRef(res.request.reference);
  }

  async function startPlan() {
    setBusy(true);
    setError(null);
    try {
      const res = await clientApi<{ plan: { reference: string } }>('/api/plans', {
        method: 'POST',
        body: JSON.stringify({
          vehicleId,
          auctionId,
          depositCents,
          termMonths,
          name: [user?.first_name, user?.last_name].filter(Boolean).join(' ') || 'Buyer',
          email: user?.email ?? '',
          phone: user?.phone ?? '',
        }),
      });
      router.push(`/plans/${res.plan.reference}`);
    } catch (err) {
      setError(err instanceof ApiRequestError ? err.message : 'Could not start that plan.');
      setBusy(false);
    }
  }

  // Once a payment exists, the status view takes over.
  if (paymentRef) {
    return <PaymentStatus reference={paymentRef} vehicleId={vehicleId} />;
  }

  return (
    <section data-testid="deal-closing" className="rounded-minimal border-2 border-brand">
      <header className="flex items-center gap-2 border-b border-brand/30 bg-brand/5 px-4 py-3">
        <Check size={18} className="text-brand" />
        <div>
          <p className="text-md font-semibold">Deal agreed at {formatPrice(agreedCents)}</p>
          <p className="text-base text-grey-800">
            {mode === 'choose'
              ? 'This price is held for you. How would you like to pay?'
              : mode === 'full'
                ? 'Pay the full amount now.'
                : 'Spread it over monthly payments.'}
          </p>
        </div>
      </header>

      <div className="p-4">
        {mode === 'choose' && (
          <div className="grid gap-3 sm:grid-cols-2">
            <button
              type="button"
              onClick={() => setMode('full')}
              data-testid="deal-pay-full"
              className="rounded-minimal border border-grey-400 p-4 text-left transition hover:border-ink hover:bg-grey-100"
            >
              <span className="block text-md font-semibold">Pay in full</span>
              <span className="mt-1 block text-2xl font-semibold">{formatPrice(agreedCents)}</span>
              <span className="mt-1 block text-base text-grey-800">
                Bank transfer, Zelle, Wise, crypto and more. We send the details in minutes.
              </span>
            </button>

            <button
              type="button"
              onClick={openPlan}
              data-testid="deal-pay-monthly"
              className="rounded-minimal border-2 border-brand p-4 text-left transition hover:bg-brand/5"
            >
              <span className="block text-md font-semibold">Pay monthly</span>
              <span className="mt-1 block text-2xl font-semibold">
                from {formatPrice(Math.ceil((agreedCents * 0.8) / 24))}
                <span className="text-base font-normal text-grey-800"> /mo</span>
              </span>
              <span className="mt-1 block text-base text-grey-800">
                Deposit from 10%. We deliver once half has cleared — you do not wait until the end.
              </span>
            </button>
          </div>
        )}

        {mode === 'full' && (
          <>
            <PaymentSheet
              amountCents={agreedCents}
              heading="Agreed price"
              lines={[
                { label: 'Vehicle', value: vehicleTitle ?? '—' },
                { label: 'Agreed', value: formatPrice(agreedCents) ?? '—', strong: true },
              ]}
              submitLabel={`Get details to pay ${formatPrice(agreedCents)}`}
              onSubmit={payInFull}
            />
            <button
              type="button"
              onClick={() => setMode('choose')}
              className="mt-3 text-base text-link hover:underline"
            >
              ← Back to payment options
            </button>
          </>
        )}

        {mode === 'plan' && (
          <div className="space-y-4">
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
                      name="deal-deposit"
                      className="sr-only"
                      checked={depositPct === pct}
                      onChange={() => {
                        setDepositPct(pct);
                        void priceIt(termMonths, Math.ceil((agreedCents * pct) / 100));
                      }}
                    />
                    {pct}%
                  </label>
                ))}
              </div>
              <p className="mt-1 text-xs text-grey-800">{formatPrice(depositCents)} up front</p>
            </fieldset>

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
                      name="deal-term"
                      className="sr-only"
                      checked={termMonths === t.termMonths}
                      onChange={() => {
                        setTermMonths(t.termMonths);
                        void priceIt(t.termMonths, depositCents);
                      }}
                    />
                    {t.label}
                    <span className="block text-xs font-normal text-grey-800">{t.blurb}</span>
                  </label>
                ))}
              </div>
            </fieldset>

            {quote && (
              <div data-testid="deal-quote" className="rounded-minimal bg-grey-100 p-3 text-base">
                <div className="flex justify-between">
                  <span className="text-grey-800">Deposit today</span>
                  <span className="font-semibold">{formatPrice(quote.depositCents)}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-grey-800">Then {quote.termMonths} × monthly</span>
                  <span className="font-semibold">{formatPrice(quote.monthlyCents)}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-grey-800">Financing cost</span>
                  <span>{quote.feeCents === 0 ? 'Interest free' : formatPrice(quote.feeCents)}</span>
                </div>
                <div className="mt-2 flex justify-between border-t border-grey-300 pt-2">
                  <span className="text-grey-800">Total</span>
                  <span className="font-semibold">{formatPrice(quote.payableCents)}</span>
                </div>
                <p className="mt-2 rounded-minimal bg-white p-2">
                  🚚 Delivered once <strong>{formatPrice(quote.deliveryAtCents)}</strong> has
                  cleared — {quote.deliveryThresholdPct}% of the agreed price.
                </p>
              </div>
            )}

            {error && (
              <p role="alert" className="bw-field-error">
                {error}
              </p>
            )}

            <button
              type="button"
              onClick={startPlan}
              disabled={busy || !quote}
              data-testid="deal-start-plan"
              className="bw-btn-cta w-full"
            >
              {busy ? <Spinner size={16} /> : 'Continue — upload documents'}
            </button>

            <button
              type="button"
              onClick={() => setMode('choose')}
              className="text-base text-link hover:underline"
            >
              ← Back to payment options
            </button>
          </div>
        )}
      </div>
    </section>
  );
}

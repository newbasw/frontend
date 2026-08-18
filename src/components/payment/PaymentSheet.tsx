'use client';

import { useEffect, useState } from 'react';
import { clientApi } from '@/lib/api';
import { formatPrice } from '@/lib/format';
import { Check, Spinner } from '../icons';

/**
 * The method picker, laid out the way a hosted checkout is: order summary on
 * one side, payment choice on the other.
 *
 * It looks like a card checkout and deliberately is not one. No card fields
 * exist, nothing is tokenised, and no payment credential is ever typed into
 * this application — picking a method only asks an admin to send the account
 * details for it.
 */

export interface SheetMethod {
  value: string;
  label: string;
  blurb: string;
}

/** Simple mark per method so the grid reads at a glance, no remote logos. */
const GLYPH: Record<string, string> = {
  bank_transfer: '🏦',
  zelle: 'Z',
  chime: 'C',
  cash_app: '$',
  wise: 'W',
  revolut: 'R',
  crypto_usdt: '₮',
  crypto_btc: '₿',
  crypto_eth: 'Ξ',
  other: '…',
};

export function PaymentSheet({
  amountCents,
  heading,
  lines,
  submitLabel,
  onSubmit,
  footnote,
}: {
  amountCents: number;
  heading: string;
  /** Summary rows: label plus value. */
  lines: { label: string; value: string; strong?: boolean }[];
  submitLabel?: string;
  onSubmit: (method: string) => Promise<void>;
  footnote?: string;
}) {
  const [methods, setMethods] = useState<SheetMethod[]>([]);
  const [method, setMethod] = useState('bank_transfer');
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    clientApi<{ items: SheetMethod[] }>('/api/payments/methods')
      .then((res) => setMethods(res.items))
      .catch(() => setMethods([]));
  }, []);

  async function submit(event: React.FormEvent) {
    event.preventDefault();
    setBusy(true);
    setError(null);
    try {
      await onSubmit(method);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Something went wrong.');
    } finally {
      setBusy(false);
    }
  }

  return (
    <div
      data-testid="payment-sheet"
      className="overflow-hidden rounded-minimal border border-grey-300 bg-white md:grid md:grid-cols-[minmax(0,1fr)_minmax(0,1.2fr)]"
    >
      {/* Summary */}
      <aside className="border-b border-grey-300 bg-grey-100 p-5 md:border-b-0 md:border-r">
        <p className="text-base text-grey-800">{heading}</p>
        <p className="mt-1 text-3xl font-semibold">{formatPrice(amountCents)}</p>

        <dl className="mt-5 space-y-2 text-base">
          {lines.map((l) => (
            <div key={l.label} className="flex justify-between gap-4">
              <dt className="text-grey-800">{l.label}</dt>
              <dd className={l.strong ? 'font-semibold' : ''}>{l.value}</dd>
            </div>
          ))}
        </dl>

        <p className="mt-5 flex items-start gap-2 text-xs text-grey-800">
          <Check size={13} className="mt-0.5 shrink-0 text-brand" />
          We never ask for card numbers. You pay directly from your own bank or
          wallet using details we send you.
        </p>
      </aside>

      {/* Method */}
      <form onSubmit={submit} className="p-5">
        <p className="bw-label">Pay with</p>

        <div className="mt-2 grid grid-cols-2 gap-2 sm:grid-cols-3">
          {methods.map((m) => {
            const active = m.value === method;
            return (
              <button
                key={m.value}
                type="button"
                onClick={() => setMethod(m.value)}
                data-testid={`method-${m.value}`}
                aria-pressed={active}
                className={`flex flex-col items-start gap-1 rounded-minimal border p-3 text-left transition ${
                  active
                    ? 'border-ink bg-grey-100 ring-1 ring-ink'
                    : 'border-grey-400 hover:border-grey-600'
                }`}
              >
                <span className="text-lg leading-none" aria-hidden>
                  {GLYPH[m.value] ?? '•'}
                </span>
                <span className="text-base font-semibold leading-tight">{m.label}</span>
              </button>
            );
          })}
          {methods.length === 0 && (
            <p className="col-span-full text-base text-grey-800">Loading payment methods…</p>
          )}
        </div>

        <p className="mt-2 min-h-[1.25rem] text-xs text-grey-800">
          {methods.find((m) => m.value === method)?.blurb}
        </p>

        {error && (
          <p role="alert" className="bw-field-error mt-2">
            {error}
          </p>
        )}

        <button
          type="submit"
          disabled={busy || methods.length === 0}
          data-testid="sheet-submit"
          className="bw-btn-cta mt-4 w-full"
        >
          {busy ? <Spinner size={16} /> : (submitLabel ?? `Pay ${formatPrice(amountCents)}`)}
        </button>

        <p className="mt-2 text-xs text-grey-800">
          {footnote ??
            'We will send the account details here within a few minutes, and you can chat to us while you wait.'}
        </p>
      </form>
    </div>
  );
}

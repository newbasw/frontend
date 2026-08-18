'use client';

import Link from 'next/link';
import { useCallback, useEffect, useState } from 'react';
import { ApiRequestError, clientApi } from '@/lib/api';
import { formatPrice } from '@/lib/format';
import { Check, Spinner } from '../icons';
import { PaymentSheet } from '../payment/PaymentSheet';
import { PaymentStatus } from '../payment/PaymentStatus';
import { PlanDocuments } from './PlanDocuments';
import { ChatWidget } from '../chat/ChatWidget';

/**
 * A buyer's view of one instalment plan: where they stand, what is due next,
 * their paperwork, and a way to pay or defer without waiting for anyone.
 */

interface Installment {
  id: string;
  seq: number;
  amount_cents: number;
  due_date: string;
  status: 'pending' | 'due' | 'paid' | 'late' | 'waived';
  paid_at: string | null;
  extension_count: number;
  payment_reference: string | null;
  payment_status: string | null;
}

interface PlanView {
  plan: {
    reference: string;
    status: string;
    term_months: number;
    total_cents: number;
    deposit_cents: number;
    delivery_threshold_pct: number;
    vehicle_title: string | null;
    vehicle_slug: string | null;
    vehicle_condition: string | null;
    vehicle_image: string | null;
    vehicle_id: string | null;
    delivered_at: string | null;
  };
  quote: {
    payableCents: number;
    feeCents: number;
    deliveryAtCents: number;
    financedCents: number;
  };
  progress: {
    paidCents: number;
    outstandingCents: number;
    percentPaid: number;
    deliveryUnlocked: boolean;
    settled: boolean;
  };
  installments: Installment[];
  documents: { id: string; doc_type: string; status: string }[];
  missingDocuments: string[];
}

const STATUS_LABEL: Record<string, { text: string; className: string }> = {
  draft: { text: 'Draft', className: 'bg-grey-300 text-ink' },
  documents_pending: { text: 'Documents needed', className: 'bg-cta text-ink' },
  under_review: { text: 'Under review', className: 'bg-link text-white' },
  approved: { text: 'Approved', className: 'bg-brand/25 text-brand-dark' },
  active: { text: 'Active', className: 'bg-brand/25 text-brand-dark' },
  delivered: { text: 'Delivered', className: 'bg-ctaGreen text-white' },
  completed: { text: 'Paid in full', className: 'bg-ctaGreen text-white' },
  rejected: { text: 'Not approved', className: 'bg-sale text-white' },
  cancelled: { text: 'Cancelled', className: 'bg-grey-300 text-ink' },
};

export function PlanDashboard({ reference }: { reference: string }) {
  const [view, setView] = useState<PlanView | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [paying, setPaying] = useState<Installment | null>(null);
  const [activePayment, setActivePayment] = useState<string | null>(null);
  const [busySeq, setBusySeq] = useState<number | null>(null);

  const load = useCallback(
    () =>
      clientApi<PlanView>(`/api/plans/${reference}`)
        .then((res) => {
          setView(res);
          setError(null);
        })
        .catch((err) =>
          setError(err instanceof ApiRequestError ? err.message : 'Could not load that plan.'),
        ),
    [reference],
  );

  useEffect(() => {
    void load();
  }, [load]);

  // Keep the schedule fresh while a payment is in flight.
  useEffect(() => {
    if (!activePayment) return;
    const timer = setInterval(() => void load(), 8000);
    return () => clearInterval(timer);
  }, [activePayment, load]);

  async function payInstallment(inst: Installment, method: string) {
    const res = await clientApi<{ payment: { reference: string } }>(
      `/api/plans/${reference}/installments/${inst.seq}/pay`,
      { method: 'POST', body: JSON.stringify({ method }) },
    );
    setActivePayment(res.payment.reference);
    setPaying(null);
    await load();
  }

  async function extend(inst: Installment) {
    setBusySeq(inst.seq);
    try {
      await clientApi(`/api/plans/${reference}/installments/${inst.seq}/extend`, {
        method: 'POST',
        body: JSON.stringify({ reason: 'Requested from the dashboard' }),
      });
      await load();
    } catch (err) {
      setError(err instanceof ApiRequestError ? err.message : 'Could not defer that instalment.');
    } finally {
      setBusySeq(null);
    }
  }

  if (error && !view) {
    return (
      <p role="alert" className="rounded-minimal border border-sale p-4 text-base">
        {error}
      </p>
    );
  }
  if (!view) return <div className="h-96 animate-pulse rounded-minimal bg-grey-100" />;

  const { plan, quote, progress, installments } = view;
  const label = STATUS_LABEL[plan.status] ?? STATUS_LABEL.draft!;
  const nextDue = installments.find((i) => i.status !== 'paid');

  return (
    <div className="space-y-6">
      {/* Header */}
      <section className="rounded-minimal border border-grey-300">
        <div className="flex flex-wrap items-center gap-3 border-b border-grey-300 px-4 py-3">
          <span className={`rounded-minimal px-2 py-0.5 text-xs font-semibold ${label.className}`}>
            {label.text}
          </span>
          <span className="font-semibold">{plan.reference}</span>
          <span className="ml-auto text-base text-grey-800">
            {plan.term_months} monthly payments
          </span>
        </div>

        <div className="p-4">
          {plan.vehicle_title && (
            <p className="mb-3 text-md font-semibold">
              {plan.vehicle_slug && plan.vehicle_condition ? (
                <Link
                  href={`/vehicles/${plan.vehicle_condition}/${plan.vehicle_slug}`}
                  className="hover:underline"
                >
                  {plan.vehicle_title}
                </Link>
              ) : (
                plan.vehicle_title
              )}
            </p>
          )}

          {/* Progress */}
          <div className="mb-2 flex justify-between text-base">
            <span className="text-grey-800">Paid so far</span>
            <span className="font-semibold">
              {formatPrice(progress.paidCents)} of {formatPrice(quote.payableCents)}
            </span>
          </div>

          <div
            className="relative h-3 overflow-hidden rounded-full bg-grey-200"
            role="progressbar"
            aria-valuenow={Math.round(progress.percentPaid)}
            aria-valuemin={0}
            aria-valuemax={100}
            aria-label="Plan progress"
          >
            <div
              className={`h-full transition-all ${progress.settled ? 'bg-ctaGreen' : 'bg-brand'}`}
              style={{ width: `${Math.min(100, progress.percentPaid)}%` }}
            />
            {/* Where the vehicle is released. */}
            <span
              className="absolute top-0 h-full w-0.5 bg-ink/50"
              style={{ left: `${(quote.deliveryAtCents / quote.payableCents) * 100}%` }}
              title={`Delivery at ${formatPrice(quote.deliveryAtCents)}`}
            />
          </div>

          <div className="mt-3 grid gap-2 text-base sm:grid-cols-3">
            <div>
              <p className="text-grey-800">Outstanding</p>
              <p className="font-semibold">{formatPrice(progress.outstandingCents)}</p>
            </div>
            <div>
              <p className="text-grey-800">Financing cost</p>
              <p className="font-semibold">
                {quote.feeCents === 0 ? 'Interest free' : formatPrice(quote.feeCents)}
              </p>
            </div>
            <div>
              <p className="text-grey-800">Delivery at</p>
              <p className="font-semibold">{formatPrice(quote.deliveryAtCents)}</p>
            </div>
          </div>

          <div
            className={`mt-3 flex items-start gap-2 rounded-minimal p-3 text-base ${
              progress.deliveryUnlocked ? 'bg-ctaGreen/10' : 'bg-grey-100'
            }`}
          >
            {progress.deliveryUnlocked ? (
              <>
                <Check size={16} className="mt-0.5 shrink-0 text-brand" />
                <span>
                  {plan.delivered_at
                    ? 'Your vehicle has been released for delivery. Our team will confirm the details with you.'
                    : `You have passed ${plan.delivery_threshold_pct}% — we are arranging delivery. You can keep paying the balance from here.`}
                </span>
              </>
            ) : (
              <span>
                Pay {formatPrice(Math.max(0, quote.deliveryAtCents - progress.paidCents))} more and
                we deliver the vehicle to you, before the plan is finished.
              </span>
            )}
          </div>
        </div>
      </section>

      {error && (
        <p role="alert" className="bw-field-error">
          {error}
        </p>
      )}

      {/* A payment in flight */}
      {activePayment && (
        <PaymentStatus
          reference={activePayment}
          vehicleId={plan.vehicle_id}
        />
      )}

      {/* Paying an instalment */}
      {paying && (
        <section>
          <div className="mb-2 flex items-center justify-between">
            <h2 className="text-lg font-semibold">
              {paying.seq === 0 ? 'Pay your deposit' : `Pay instalment ${paying.seq}`}
            </h2>
            <button type="button" onClick={() => setPaying(null)} className="text-base text-link hover:underline">
              Cancel
            </button>
          </div>
          <PaymentSheet
            amountCents={paying.amount_cents}
            heading={paying.seq === 0 ? 'Deposit' : `Instalment ${paying.seq} of ${plan.term_months}`}
            lines={[
              { label: 'Plan', value: plan.reference },
              { label: 'Vehicle', value: plan.vehicle_title ?? '—' },
              { label: 'Due', value: paying.due_date },
              {
                label: 'Remaining after this',
                value: formatPrice(Math.max(0, progress.outstandingCents - paying.amount_cents)) ?? '—',
                strong: true,
              },
            ]}
            submitLabel={`Get details to pay ${formatPrice(paying.amount_cents)}`}
            onSubmit={(method) => payInstallment(paying, method)}
          />
        </section>
      )}

      {/* Documents */}
      <PlanDocuments
        reference={reference}
        documents={view.documents}
        missing={view.missingDocuments}
        onChange={load}
      />

      {/* Schedule */}
      <section className="rounded-minimal border border-grey-300">
        <header className="border-b border-grey-300 bg-grey-100 px-4 py-3">
          <p className="text-md font-semibold">Payment schedule</p>
        </header>
        <ul data-testid="plan-schedule" className="divide-y divide-grey-300">
          {installments.map((inst) => {
            const isNext = nextDue?.seq === inst.seq;
            return (
              <li
                key={inst.id}
                className={`flex flex-wrap items-center gap-3 px-4 py-3 ${isNext ? 'bg-grey-100' : ''}`}
              >
                <span className="w-28 shrink-0 text-base font-semibold">
                  {inst.seq === 0 ? 'Deposit' : `Instalment ${inst.seq}`}
                </span>
                <span className="text-base text-grey-800">
                  due {inst.due_date}
                  {inst.extension_count > 0 && (
                    <span className="ml-1 text-xs">(deferred {inst.extension_count}×)</span>
                  )}
                </span>
                <span className="ml-auto font-semibold">{formatPrice(inst.amount_cents)}</span>

                {inst.status === 'paid' ? (
                  <span className="flex w-36 shrink-0 items-center justify-end gap-1 text-base text-brand">
                    <Check size={14} /> Paid
                  </span>
                ) : (
                  <span className="flex w-36 shrink-0 justify-end gap-2">
                    <button
                      type="button"
                      onClick={() => setPaying(inst)}
                      data-testid={`pay-${inst.seq}`}
                      className="bw-btn-cta px-3 py-1 text-base"
                    >
                      Pay
                    </button>
                    <button
                      type="button"
                      onClick={() => extend(inst)}
                      disabled={busySeq === inst.seq}
                      title="Move this payment back by 30 days"
                      className="bw-btn-outline px-3 py-1 text-base"
                    >
                      {busySeq === inst.seq ? <Spinner size={13} /> : 'Defer'}
                    </button>
                  </span>
                )}
              </li>
            );
          })}
        </ul>
      </section>

      {/* Help */}
      <section className="rounded-minimal border border-grey-300 p-4">
        <p className="mb-2 text-md font-semibold">Questions about your plan?</p>
        <p className="mb-3 text-base text-grey-800">
          Message us here and we will reply quickly — no need to email or wait.
        </p>
        <ChatWidget
          inline
          vehicleId={plan.vehicle_id}
          vehicleTitle={plan.vehicle_title ?? undefined}
        />
      </section>
    </div>
  );
}

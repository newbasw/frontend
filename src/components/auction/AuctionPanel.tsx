'use client';

import { useEffect, useRef, useState } from 'react';
import { useRouter } from 'next/navigation';
import { ApiRequestError, clientApi } from '@/lib/api';
import { useAuth } from '../auth/AuthProvider';
import { formatPrice } from '@/lib/format';
import { DealClosing } from './DealClosing';
import { BasWorldMark } from '../ui/BasWorldMark';
import { Check, Spinner } from '../icons';

/**
 * Make-an-offer panel.
 *
 * The seller's floor price never reaches the browser — the buyer offers, the
 * server decides, and the thread below shows the back-and-forth. Deliberately
 * not a plain bid box: the point is that it reads as a negotiation.
 */

interface Bid {
  id: string;
  kind: 'user' | 'bot' | 'accepted';
  amount_cents: number;
  message: string | null;
  created_at: string;
  author: string | null;
}

interface Auction {
  id: string;
  status: string;
  starting_price_cents: number;
  min_increment_cents: number;
  ends_at: string;
  highest_bid_cents: number | null;
  bid_count: number;
  minimum_bid_cents: number;
}

interface Outcome {
  decision: 'accept' | 'counter' | 'reject';
  message: string;
  counterCents: number | null;
  isFinal: boolean;
}

function timeLeft(ends: string): string {
  const ms = new Date(ends).getTime() - Date.now();
  if (ms <= 0) return 'Ended';
  const days = Math.floor(ms / 86_400_000);
  const hours = Math.floor((ms % 86_400_000) / 3_600_000);
  const mins = Math.floor((ms % 3_600_000) / 60_000);
  if (days > 0) return `${days}d ${hours}h left`;
  if (hours > 0) return `${hours}h ${mins}m left`;
  return `${mins}m left`;
}

export function AuctionPanel({
  vehicleId,
  vehicleTitle,
}: {
  vehicleId: string;
  vehicleTitle?: string;
}) {
  const { user } = useAuth();
  const router = useRouter();

  const [auction, setAuction] = useState<Auction | null>(null);
  const [bids, setBids] = useState<Bid[]>([]);
  const [amount, setAmount] = useState('');
  const [outcome, setOutcome] = useState<Outcome | null>(null);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [loaded, setLoaded] = useState(false);
  const [deal, setDeal] = useState<{ auctionId: string; agreedCents: number } | null>(null);
  const threadRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    clientApi<{
      auction: Auction;
      bids: Bid[];
      agreed: { auctionId: string; agreedCents: number } | null;
    }>(`/api/auctions/vehicle/${vehicleId}`)
      .then((res) => {
        setAuction(res.auction);
        setBids(res.bids);
        setDeal(res.agreed);
        setAmount(String(Math.round(res.auction.starting_price_cents / 100)));
      })
      .catch(() => setAuction(null))
      .finally(() => setLoaded(true));
  }, [vehicleId]);

  useEffect(() => {
    threadRef.current?.scrollTo({ top: threadRef.current.scrollHeight, behavior: 'smooth' });
  }, [bids.length]);

  if (!loaded) return <div className="h-40 animate-pulse rounded-minimal bg-grey-100" />;
  if (!auction) return null;

  const closed = auction.status !== 'live';
  const lastCounter = [...bids].reverse().find((b) => b.kind === 'bot');
  const agreed = bids.find((b) => b.kind === 'accepted');
  // The API is the authority on what was agreed; the thread is only a display.
  const agreedCents = deal?.agreedCents ?? agreed?.amount_cents ?? null;

  async function submit(event: React.FormEvent) {
    event.preventDefault();
    if (!user) {
      router.push(`/login?next=${encodeURIComponent(window.location.pathname)}`);
      return;
    }
    const cents = Math.round(Number(amount.replace(/[^\d.]/g, '')) * 100);
    if (!Number.isFinite(cents) || cents <= 0) {
      setError('Enter an amount.');
      return;
    }

    setBusy(true);
    setError(null);
    try {
      const res = await clientApi<{ bid: Bid; reply: Bid; outcome: Outcome; auction: Auction }>(
        `/api/auctions/${auction!.id}/bid`,
        { method: 'POST', body: JSON.stringify({ amountCents: cents }) },
      );
      setBids((prev) => [...prev, res.bid, res.reply].filter(Boolean));
      setOutcome(res.outcome);
      if (res.auction) setAuction(res.auction);
      if (res.outcome.counterCents) setAmount(String(Math.round(res.outcome.counterCents / 100)));
    } catch (err) {
      setError(err instanceof ApiRequestError ? err.message : 'Could not send that offer.');
    } finally {
      setBusy(false);
    }
  }

  async function acceptCounter() {
    setBusy(true);
    try {
      await clientApi(`/api/auctions/${auction!.id}/accept`, { method: 'POST' });
      const res = await clientApi<{ auction: Auction; bids: Bid[] }>(
        `/api/auctions/vehicle/${vehicleId}`,
      );
      setAuction(res.auction);
      setBids(res.bids);
      setOutcome(null);
    } catch (err) {
      setError(err instanceof ApiRequestError ? err.message : 'Could not accept.');
    } finally {
      setBusy(false);
    }
  }

  return (
    <section data-testid="auction-panel" className="rounded-minimal border border-grey-300">
      <header className="flex items-center justify-between gap-3 border-b border-grey-300 bg-grey-100 px-4 py-3">
        <p className="text-md font-semibold">Make an offer</p>
        <span className="text-base text-grey-800">
          {closed ? 'Closed' : timeLeft(auction.ends_at)}
        </span>
      </header>

      <div className="p-4">
        <div className="flex items-baseline justify-between gap-3">
          <span className="text-base text-grey-800">Opening price</span>
          <span className="text-xl font-semibold">{formatPrice(auction.starting_price_cents)}</span>
        </div>
        {auction.bid_count > 0 && (
          <p className="mt-1 text-base text-grey-800">
            {auction.bid_count} offer{auction.bid_count === 1 ? '' : 's'} so far
            {auction.highest_bid_cents ? ` · highest ${formatPrice(auction.highest_bid_cents)}` : ''}
          </p>
        )}

        {bids.length > 0 && (
          <div
            ref={threadRef}
            data-testid="auction-thread"
            className="mt-4 max-h-64 space-y-3 overflow-y-auto border-t border-grey-300 pt-4"
          >
            {bids.map((bid) => {
              const mine = bid.kind === 'user';
              return (
                <div key={bid.id} className={`flex ${mine ? 'justify-end' : 'justify-start'}`}>
                  <div
                    className={`max-w-[85%] rounded-minimal px-3 py-2 text-base ${
                      mine
                        ? 'bg-ink text-white'
                        : bid.kind === 'accepted'
                          ? 'bg-brand/15 text-ink'
                          : 'bg-grey-100 text-ink'
                    }`}
                  >
                    {!mine && (
                      <p className="mb-1 flex items-center gap-1.5 text-xs font-semibold">
                        {bid.kind === 'accepted' ? (
                          <Check size={12} className="text-brand" />
                        ) : (
                          <BasWorldMark size={12} />
                        )}
                        BAS World
                      </p>
                    )}
                    <p className="font-semibold">{formatPrice(bid.amount_cents)}</p>
                    {bid.message && <p className="mt-0.5 opacity-90">{bid.message}</p>}
                  </div>
                </div>
              );
            })}
          </div>
        )}

        {agreed || closed ? (
          /*
            A struck deal goes straight to payment. Telling someone who has
            just agreed a price to wait for a phone call loses the sale.
          */
          agreedCents != null ? (
            <div className="mt-4">
              <DealClosing
                vehicleId={vehicleId}
                auctionId={deal?.auctionId ?? auction.id}
                agreedCents={agreedCents}
                vehicleTitle={vehicleTitle}
              />
            </div>
          ) : (
            <div
              data-testid="auction-agreed"
              className="mt-4 flex items-center gap-2 rounded-minimal bg-brand/15 p-3 text-base"
            >
              <Check size={16} className="text-brand" />
              This lot has closed.
            </div>
          )
        ) : (
          <>
            {outcome?.decision === 'counter' && lastCounter && (
              <button
                type="button"
                onClick={acceptCounter}
                disabled={busy}
                data-testid="accept-counter"
                className="bw-btn-cta-green mt-4 w-full"
              >
                Accept {formatPrice(lastCounter.amount_cents)}
              </button>
            )}

            <form onSubmit={submit} className="mt-4 space-y-2">
              <label htmlFor="offer" className="bw-label">
                Your offer
              </label>
              <div className="flex gap-2">
                <div className="flex h-11 flex-1 items-center rounded-minimal border border-grey-400 bg-white px-3">
                  <span className="mr-1 text-grey-800">€</span>
                  <input
                    id="offer"
                    inputMode="numeric"
                    value={amount}
                    onChange={(e) => setAmount(e.target.value)}
                    data-testid="offer-input"
                    className="h-11 w-full bg-transparent text-md outline-none"
                  />
                </div>
                <button type="submit" disabled={busy} data-testid="submit-offer" className="bw-btn-cta shrink-0">
                  {busy ? <Spinner size={16} /> : 'Send offer'}
                </button>
              </div>

              {error && (
                <p role="alert" className="bw-field-error">
                  {error}
                </p>
              )}
              <p className="text-xs text-grey-800">
                Offers are answered straight away. You can keep negotiating until we agree.
              </p>
            </form>
          </>
        )}
      </div>
    </section>
  );
}

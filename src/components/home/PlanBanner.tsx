import Link from 'next/link';
import { SmartImage as Image } from '../ui/SmartImage';
import { cmsImage, HOME_MEDIA } from '@/lib/basImages';

/**
 * Homepage banner for instalment buying.
 *
 * The claim that matters is the one people do not expect — the vehicle arrives
 * at half, not at the end — so it leads, and the three steps under it explain
 * how without needing another page.
 */
export function PlanBanner() {
  const steps = [
    { n: '1', title: 'Choose your terms', body: 'Pick a deposit from 10% and a term up to 24 months.' },
    { n: '2', title: 'Send your documents', body: 'ID, proof of address and income. Uploaded securely.' },
    { n: '3', title: 'We deliver at 50%', body: 'The vehicle is yours to use while you pay the rest.' },
  ];

  return (
    <section
      data-testid="plan-banner"
      className="relative mt-10 overflow-hidden rounded-minimal bg-ink text-white"
    >
      <div className="absolute inset-0">
        <Image
          src={cmsImage(HOME_MEDIA.yard, 1600)}
          alt=""
          fill
          sizes="100vw"
          className="object-cover opacity-25"
        />
      </div>

      <div className="relative grid gap-6 p-6 md:grid-cols-[1.1fr_1fr] md:p-8">
        <div>
          <p className="text-base font-semibold uppercase tracking-wide text-cta">
            Buy now, pay monthly
          </p>
          <h2 className="mt-1 text-3xl font-semibold leading-tight">
            Drive it away at half.
            <br />
            Pay the rest at your pace.
          </h2>
          <p className="mt-3 max-w-[46ch] text-md text-white/80">
            Spread the cost of any vehicle over up to 24 months. Once half the price has cleared we
            deliver it to you — you do not wait until the final instalment.
          </p>

          <div className="mt-5 flex flex-wrap gap-3">
            <Link href="/stock/all" className="bw-btn-cta">
              Find a vehicle
            </Link>
            <Link
              href="/account/plans"
              className="rounded-minimal border border-white/40 px-4 py-2 text-base font-semibold hover:bg-white/10"
            >
              My plans
            </Link>
          </div>

          <p className="mt-3 text-xs text-white/60">
            Deposit from 10%. Interest free over 3 months. Subject to approval — no card details
            are ever taken.
          </p>
        </div>

        <ol className="space-y-3 self-center">
          {steps.map((s) => (
            <li key={s.n} className="flex gap-3 rounded-minimal bg-white/10 p-3 backdrop-blur-sm">
              <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-cta text-base font-semibold text-ink">
                {s.n}
              </span>
              <span>
                <span className="block text-base font-semibold">{s.title}</span>
                <span className="block text-base text-white/75">{s.body}</span>
              </span>
            </li>
          ))}
        </ol>
      </div>
    </section>
  );
}

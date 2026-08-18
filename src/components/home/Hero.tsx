'use client';

import Link from 'next/link';
import { useEffect, useRef, useState } from 'react';
import { SmartImage as Image } from '../ui/SmartImage';
import { cmsImage, cmsVideo, HERO_VIDEO } from '@/lib/basImages';
import { ChevronRight } from '../icons';

/**
 * Homepage hero, rebuilt from the live reference.
 *
 * The background is BAS World's 30-second brand film, served from the same
 * Amplience CMS as their imagery. The reference ships it with a still image
 * behind it (`fallBackbackground` in their content model), and so do we: the
 * poster shows immediately, the film fades in once it can play.
 *
 * The narrow profile is used on small screens — 2.3 MB against 7.5 MB — and the
 * video is skipped entirely for anyone who asked for reduced motion, who just
 * gets the still.
 */
export function Hero({ totalStock }: { totalStock: number }) {
  const videoRef = useRef<HTMLVideoElement>(null);
  const [playing, setPlaying] = useState(false);
  const [allowMotion, setAllowMotion] = useState(true);

  useEffect(() => {
    setAllowMotion(!window.matchMedia('(prefers-reduced-motion: reduce)').matches);
  }, []);

  useEffect(() => {
    const video = videoRef.current;
    if (!video || !allowMotion) return;
    // Autoplay can still be refused; the poster simply stays in that case.
    video.play().then(() => setPlaying(true)).catch(() => setPlaying(false));
  }, [allowMotion]);

  const narrow = typeof window !== 'undefined' && window.innerWidth < 768;

  return (
    <section className="grid gap-4 lg:grid-cols-[1fr_360px]">
      {/* Main panel — brand film with the headline over it */}
      <Link
        href="/stock/all"
        className="group relative flex min-h-[300px] items-center overflow-hidden rounded-minimal bg-ink md:min-h-[420px]"
      >
        <Image
          src={cmsImage(HERO_VIDEO.poster, 1600)}
          alt=""
          fill
          sizes="(max-width: 1024px) 100vw, 940px"
          priority
          className="object-cover"
        />

        {allowMotion && (
          <video
            ref={videoRef}
            muted
            loop
            playsInline
            preload="metadata"
            poster={cmsImage(HERO_VIDEO.poster, 1600)}
            aria-hidden="true"
            className={`absolute inset-0 h-full w-full object-cover transition-opacity duration-700 ${
              playing ? 'opacity-100' : 'opacity-0'
            }`}
          >
            <source src={cmsVideo(HERO_VIDEO.name, narrow ? 'mp4_480p' : 'mp4_720p')} type="video/mp4" />
          </video>
        )}

        {/* The reference darkens the footage so the headline stays readable. */}
        <div aria-hidden="true" className="absolute inset-0 bg-black/35" />

        <div className="relative z-10 w-full px-6 text-center md:px-12">
          <h1 className="mx-auto max-w-[16ch] text-3xl font-bold uppercase italic leading-[1.05] tracking-tight text-white drop-shadow-lg md:text-5xl lg:text-6xl">
            Buy vehicles and machinery worldwide
          </h1>
          <span className="mt-6 inline-flex h-11 items-center rounded-minimal bg-link px-6 text-md font-semibold text-white transition-colors group-hover:bg-[#0353e9]">
            View stock
          </span>
        </div>
      </Link>

      {/* Two stacked teasers */}
      <div className="grid gap-4">
        <HeroTeaser
          title="Weekly auctions. Sharp prices."
          cta="Browse live lots"
          href="/auctions"
        />
        <HeroTeaser
          title="Buy now, pay monthly"
          cta="Build a payment plan"
          href="/stock/all"
          subtitle={`${totalStock.toLocaleString('en-GB')} vehicles ready to buy`}
        />
      </div>
    </section>
  );
}

function HeroTeaser({
  title,
  subtitle,
  cta,
  href,
}: {
  title: string;
  subtitle?: string;
  cta: string;
  href: string;
}) {
  return (
    <Link
      href={href}
      className="group flex min-h-[140px] flex-col justify-center gap-4 rounded-minimal bg-ink p-6 text-white transition-colors hover:bg-black md:min-h-[202px]"
    >
      <p className="text-xl font-semibold leading-7">{title}</p>
      {subtitle && <p className="-mt-2 text-base text-grey-450">{subtitle}</p>}
      <span className="flex items-center gap-3 text-md">
        <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-link transition-transform group-hover:translate-x-1">
          <ChevronRight size={14} className="text-white" />
        </span>
        {cta}
      </span>
    </Link>
  );
}

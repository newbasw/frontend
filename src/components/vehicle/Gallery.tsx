'use client';

import { useCallback, useEffect, useRef, useState } from 'react';
import { SmartImage as Image } from '../ui/SmartImage';
import { ChevronLeft, ChevronRight, Close } from '../icons';
import type { VehicleImage } from '@shared/types';
import { vehicleThumb } from '@/lib/basImages';

interface Props {
  images: VehicleImage[];
  title: string;
  isNew?: boolean;
}

/**
 * PDP gallery. Working prev/next (disabled at the bounds), clickable
 * thumbnails, a photo-count badge, keyboard arrows, swipe, and a lightbox —
 * the same interactions the reference offers.
 */
export function Gallery({ images, title, isNew }: Props) {
  const [index, setIndex] = useState(0);
  const [lightbox, setLightbox] = useState(false);
  const touchStart = useRef<number | null>(null);
  const thumbsRef = useRef<HTMLDivElement>(null);

  const count = images.length;
  const go = useCallback(
    (next: number) => setIndex(Math.max(0, Math.min(count - 1, next))),
    [count],
  );

  useEffect(() => {
    function onKey(e: KeyboardEvent) {
      if (e.key === 'ArrowLeft') go(index - 1);
      if (e.key === 'ArrowRight') go(index + 1);
      if (e.key === 'Escape') setLightbox(false);
    }
    if (lightbox) {
      document.addEventListener('keydown', onKey);
      return () => document.removeEventListener('keydown', onKey);
    }
    return undefined;
  }, [lightbox, index, go]);

  // Keep the active thumbnail in view.
  useEffect(() => {
    const strip = thumbsRef.current;
    const active = strip?.querySelector<HTMLElement>(`[data-thumb="${index}"]`);
    active?.scrollIntoView({ block: 'nearest', inline: 'nearest', behavior: 'smooth' });
  }, [index]);

  if (count === 0) {
    return (
      <div className="flex aspect-[4/3] w-full items-center justify-center bg-grey-100 text-grey-800">
        No photographs available
      </div>
    );
  }

  const current = images[index]!;

  return (
    <div data-testid="gallery">
      <div
        className="relative aspect-[4/3] w-full overflow-hidden bg-grey-100"
        onTouchStart={(e) => {
          touchStart.current = e.touches[0]?.clientX ?? null;
        }}
        onTouchEnd={(e) => {
          const start = touchStart.current;
          const end = e.changedTouches[0]?.clientX;
          if (start == null || end == null) return;
          if (start - end > 40) go(index + 1);
          if (end - start > 40) go(index - 1);
          touchStart.current = null;
        }}
      >
        <button
          type="button"
          onClick={() => setLightbox(true)}
          aria-label="Open photograph full screen"
          className="absolute inset-0 h-full w-full"
        >
          <Image
            src={current.url}
            alt={current.alt ?? title}
            fill
            sizes="(max-width: 1024px) 100vw, 730px"
            priority
            className="object-cover"
          />
        </button>

        {isNew && (
          <span className="pointer-events-none absolute left-0 top-4 bg-brand px-3 py-1 text-xs font-semibold uppercase text-white">
            Brand NEW
          </span>
        )}

        <span
          data-testid="photo-count"
          className="pointer-events-none absolute bottom-3 right-3 bg-black/70 px-2 py-1 text-xs text-white"
        >
          {index + 1} / {count}
        </span>

        <button
          type="button"
          onClick={() => go(index - 1)}
          disabled={index === 0}
          aria-label="Previous photograph"
          data-testid="gallery-prev"
          className="absolute left-3 top-1/2 flex h-10 w-10 -translate-y-1/2 items-center justify-center bg-white/90 text-ink disabled:cursor-not-allowed disabled:opacity-40"
        >
          <ChevronLeft size={16} />
        </button>
        <button
          type="button"
          onClick={() => go(index + 1)}
          disabled={index === count - 1}
          aria-label="Next photograph"
          data-testid="gallery-next"
          className="absolute right-3 top-1/2 flex h-10 w-10 -translate-y-1/2 items-center justify-center bg-white/90 text-ink disabled:cursor-not-allowed disabled:opacity-40"
        >
          <ChevronRight size={16} />
        </button>
      </div>

      <div ref={thumbsRef} className="no-scrollbar mt-2 flex gap-2 overflow-x-auto">
        {images.map((image, i) => (
          <button
            key={image.id}
            type="button"
            data-thumb={i}
            data-testid={`gallery-thumb-${i}`}
            onClick={() => go(i)}
            aria-label={`Show photograph ${i + 1}`}
            aria-current={i === index}
            className={`relative aspect-[4/3] h-16 shrink-0 overflow-hidden border-2 ${
              i === index ? 'border-ink' : 'border-transparent opacity-70 hover:opacity-100'
            }`}
          >
            {/* The strip renders at 88px, so pull the small variant rather
                than a full-size photo per thumbnail. */}
            <Image src={vehicleThumb(image.url)} alt="" fill sizes="88px" className="object-cover" />
          </button>
        ))}
      </div>

      {lightbox && (
        <div
          role="dialog"
          aria-modal="true"
          aria-label={`${title} — photograph ${index + 1} of ${count}`}
          className="fixed inset-0 z-[90] flex flex-col bg-black/95"
        >
          <div className="flex h-14 items-center justify-between px-4 text-white">
            <span className="text-base">
              {index + 1} / {count}
            </span>
            <button type="button" onClick={() => setLightbox(false)} aria-label="Close" className="p-2">
              <Close size={20} />
            </button>
          </div>
          <div className="relative flex-1">
            <Image
              src={current.url}
              alt={current.alt ?? title}
              fill
              sizes="100vw"
              className="object-contain"
            />
            <button
              type="button"
              onClick={() => go(index - 1)}
              disabled={index === 0}
              aria-label="Previous photograph"
              className="absolute left-4 top-1/2 flex h-12 w-12 -translate-y-1/2 items-center justify-center bg-white/90 disabled:opacity-30"
            >
              <ChevronLeft size={18} />
            </button>
            <button
              type="button"
              onClick={() => go(index + 1)}
              disabled={index === count - 1}
              aria-label="Next photograph"
              className="absolute right-4 top-1/2 flex h-12 w-12 -translate-y-1/2 items-center justify-center bg-white/90 disabled:opacity-30"
            >
              <ChevronRight size={18} />
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

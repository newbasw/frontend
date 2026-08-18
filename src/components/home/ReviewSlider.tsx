'use client';

import { useEffect, useRef, useState } from 'react';
import { ChevronLeft, ChevronRight, StarSolid } from '../icons';
import type { Review } from '@shared/types';

/** Trustpilot-style review carousel from the homepage. */
export function ReviewSlider({ reviews }: { reviews: Review[] }) {
  const trackRef = useRef<HTMLDivElement>(null);
  const [atStart, setAtStart] = useState(true);
  const [atEnd, setAtEnd] = useState(false);

  const update = () => {
    const el = trackRef.current;
    if (!el) return;
    setAtStart(el.scrollLeft <= 4);
    setAtEnd(el.scrollLeft + el.clientWidth >= el.scrollWidth - 4);
  };

  useEffect(() => {
    update();
    const el = trackRef.current;
    el?.addEventListener('scroll', update, { passive: true });
    return () => el?.removeEventListener('scroll', update);
  }, []);

  if (reviews.length === 0) return null;

  return (
    <div className="relative">
      <div ref={trackRef} className="no-scrollbar flex gap-4 overflow-x-auto scroll-smooth pb-2">
        {reviews.map((review) => (
          <article
            key={review.id}
            className="flex w-[280px] shrink-0 flex-col border border-grey-300 p-4"
          >
            <div className="flex items-center gap-[2px]" aria-label={`${review.rating} out of 5`}>
              {Array.from({ length: review.rating }).map((_, i) => (
                <span key={i} className="flex h-5 w-5 items-center justify-center bg-[#00b67a]">
                  <StarSolid size={13} className="text-white" />
                </span>
              ))}
            </div>
            <p className="mt-3 text-md font-semibold">{review.title}</p>
            <p className="mt-2 flex-1 text-base text-grey-800">{review.body}</p>
            <p className="mt-3 text-xs text-grey-800">
              {review.author} ·{' '}
              <time dateTime={review.published_at}>
                {new Date(review.published_at).toLocaleDateString('en-GB')}
              </time>
            </p>
          </article>
        ))}
      </div>

      <button
        type="button"
        onClick={() => trackRef.current?.scrollBy({ left: -296, behavior: 'smooth' })}
        disabled={atStart}
        aria-label="Previous reviews"
        className="absolute -left-3 top-1/2 hidden h-10 w-10 -translate-y-1/2 items-center justify-center border border-grey-400 bg-white shadow-card disabled:opacity-30 md:flex"
      >
        <ChevronLeft size={14} />
      </button>
      <button
        type="button"
        onClick={() => trackRef.current?.scrollBy({ left: 296, behavior: 'smooth' })}
        disabled={atEnd}
        aria-label="Next reviews"
        className="absolute -right-3 top-1/2 hidden h-10 w-10 -translate-y-1/2 items-center justify-center border border-grey-400 bg-white shadow-card disabled:opacity-30 md:flex"
      >
        <ChevronRight size={14} />
      </button>
    </div>
  );
}

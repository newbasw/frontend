'use client';

import { useRef, useState, useEffect } from 'react';
import { SmartImage as Image } from '../ui/SmartImage';
import Link from 'next/link';
import { ChevronLeft, ChevronRight } from '../icons';

export interface SliderItem {
  key: string;
  title: string;
  excerpt: string;
  href: string;
  image: string;
}

/**
 * Horizontal card carousel used by the homepage "Latest news & articles" and
 * "Browse by category" sections. Cards are 338×230 like the reference;
 * the track scrolls natively (so touch swipe works) with arrow buttons that
 * disable at the bounds.
 */
export function CardSlider({ items }: { items: SliderItem[] }) {
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
    window.addEventListener('resize', update);
    return () => {
      el?.removeEventListener('scroll', update);
      window.removeEventListener('resize', update);
    };
  }, []);

  const scrollBy = (direction: 1 | -1) => {
    trackRef.current?.scrollBy({ left: direction * 354, behavior: 'smooth' });
  };

  if (items.length === 0) return null;

  return (
    <div className="relative">
      <div
        ref={trackRef}
        className="no-scrollbar flex gap-4 overflow-x-auto scroll-smooth pb-2"
        data-testid="card-slider"
      >
        {items.map((item) => (
          <article key={item.key} className="w-[290px] shrink-0 sm:w-[338px]">
            <Link href={item.href} className="group block">
              <div className="relative aspect-[338/230] w-full overflow-hidden bg-grey-100">
                <Image
                  src={item.image}
                  alt=""
                  fill
                  sizes="338px"
                  className="object-cover transition-transform duration-300 group-hover:scale-105"
                />
              </div>
              <h3 className="mt-3 text-md font-semibold group-hover:underline">{item.title}</h3>
              {item.excerpt && (
                <p className="mt-1 line-clamp-2 text-base text-grey-800">{item.excerpt}</p>
              )}
              <span className="mt-2 inline-block text-base font-semibold text-link">Read more</span>
            </Link>
          </article>
        ))}
      </div>

      <button
        type="button"
        onClick={() => scrollBy(-1)}
        disabled={atStart}
        aria-label="Scroll left"
        className="absolute -left-3 top-[100px] hidden h-10 w-10 items-center justify-center border border-grey-400 bg-white shadow-card disabled:opacity-30 md:flex"
      >
        <ChevronLeft size={14} />
      </button>
      <button
        type="button"
        onClick={() => scrollBy(1)}
        disabled={atEnd}
        aria-label="Scroll right"
        className="absolute -right-3 top-[100px] hidden h-10 w-10 items-center justify-center border border-grey-400 bg-white shadow-card disabled:opacity-30 md:flex"
      >
        <ChevronRight size={14} />
      </button>
    </div>
  );
}

'use client';

import Link from 'next/link';
import { useSelectedLayoutSegments } from 'next/navigation';
import { CategoryIcon, hasCategoryIcon } from '../icons/CategoryIcons';
import type { CategoryNav } from '@/lib/queries';

/**
 * The category strip below the header.
 *
 * Matches the reference: each entry is the category's line-art vehicle icon
 * above its label, the count in parentheses after the label, and a black
 * underline on the active category. Scrolls horizontally on narrow viewports
 * rather than wrapping.
 */
export function CategoryBar({ categories }: { categories: CategoryNav[] }) {
  const segments = useSelectedLayoutSegments();
  const activeSlug = segments[0] === 'stock' ? segments[1] : undefined;

  if (categories.length === 0) return null;

  return (
    <div className="border-b border-grey-300 bg-white" data-testid="category-bar">
      <div className="page-wrapper">
        <ul className="no-scrollbar flex items-stretch justify-between gap-6 overflow-x-auto whitespace-nowrap md:gap-8">
          {categories.map((category) => {
            const isActive = activeSlug === category.slug;
            return (
              <li key={category.slug} className="flex shrink-0 items-stretch">
                <Link
                  href={`/stock/${category.slug}`}
                  title={`${category.label} stock BAS World`}
                  aria-current={isActive ? 'page' : undefined}
                  className={`group flex flex-col items-center justify-end gap-1 border-b-2 pb-2 pt-3 transition-colors ${
                    isActive ? 'border-ink' : 'border-transparent hover:border-grey-400'
                  }`}
                >
                  {hasCategoryIcon(category.slug) && (
                    <span className="flex h-[26px] items-end justify-center text-iconStroke">
                      <CategoryIcon slug={category.slug} />
                    </span>
                  )}
                  <span className="text-xs text-ink md:text-base">
                    {category.label} ({category.vehicle_count})
                  </span>
                </Link>
              </li>
            );
          })}
        </ul>
      </div>
    </div>
  );
}

'use client';

import { useState } from 'react';
import Link from 'next/link';
import { ChevronRight } from '../icons';
import type { CategoryNav } from '@/lib/queries';

const INFO_LINKS = [
  { label: 'How to buy', href: '/content/how-to-buy' },
  { label: 'BAS World Store', href: '/content/bas-world-store' },
  { label: 'About BAS World', href: '/content/about-bas-world' },
  { label: 'FAQ', href: '/content/faq' },
];

interface Props {
  categories: CategoryNav[];
  open: boolean;
  onClose: () => void;
}

/**
 * Desktop mega menu. Left rail lists the categories; hovering or focusing one
 * swaps the right pane, which holds up to four link columns:
 * Emission standard · Axle configuration · Super structure · Brands.
 */
export function MegaMenu({ categories, open, onClose }: Props) {
  const [activeIndex, setActiveIndex] = useState(0);
  const active = categories[activeIndex];

  if (!open || categories.length === 0) return null;

  return (
    <>
      <button
        type="button"
        aria-label="Close menu"
        onClick={onClose}
        className="fixed inset-0 top-[calc(var(--bw-usp-height)+var(--bw-header-height))] z-40 bg-black/40"
      />
      <div
        data-testid="mega-menu"
        className="absolute left-0 right-0 top-full z-50 hidden max-h-[calc(100vh-160px)] overflow-y-auto border-t border-grey-300 bg-white shadow-menu lg:block"
      >
        <div className="page-wrapper flex gap-8 py-6">
          {/* Left rail */}
          <div className="w-[260px] shrink-0 border-r border-grey-300 pr-6">
            <p className="mb-3 text-xs font-semibold uppercase tracking-wide text-grey-800">
              Vehicle categories
            </p>
            <nav>
              <ul>
                {categories.map((category, index) => (
                  <li key={category.slug}>
                    <Link
                      href={`/stock/${category.slug}`}
                      data-testid={`category-${index}`}
                      onMouseEnter={() => setActiveIndex(index)}
                      onFocus={() => setActiveIndex(index)}
                      onClick={onClose}
                      className={`flex w-full items-center justify-between py-2 text-base ${
                        index === activeIndex ? 'font-semibold text-ink' : 'text-ink hover:font-semibold'
                      }`}
                    >
                      <span>{category.label}</span>
                      <ChevronRight size={14} className="text-grey-700" />
                    </Link>
                  </li>
                ))}
              </ul>
            </nav>

            <p className="mb-3 mt-6 text-xs font-semibold uppercase tracking-wide text-grey-800">
              More information about
            </p>
            <ul>
              {INFO_LINKS.map((link) => (
                <li key={link.href}>
                  <Link
                    href={link.href}
                    onClick={onClose}
                    className="block py-2 text-base hover:underline"
                  >
                    {link.label}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          {/* Right pane */}
          {active && (
            <div className="grid flex-1 grid-cols-4 gap-6">
              <MenuColumn
                title="Emission standard"
                links={active.emission_norms.slice(0, 8).map((n) => ({
                  label: n.value,
                  href: `/stock/${active.slug}?stageTier=${encodeURIComponent(n.value)}`,
                }))}
                onClose={onClose}
              />
              <MenuColumn
                title="Axle configuration"
                links={active.axle_configurations.slice(0, 11).map((a) => ({
                  label: a.value,
                  href: `/stock/${active.slug}?axleConfiguration=${encodeURIComponent(a.value)}`,
                }))}
                onClose={onClose}
              />
              <MenuColumn
                title="Super structure"
                links={active.body_types.slice(0, 22).map((b) => ({
                  label: b.label,
                  href: `/stock/${active.slug}/${b.slug}`,
                }))}
                onClose={onClose}
              />
              <MenuColumn
                title="Brands"
                links={active.brands.slice(0, 22).map((b) => ({
                  label: b.label,
                  href: `/stock/${active.slug}/${b.slug}`,
                }))}
                onClose={onClose}
              />
            </div>
          )}
        </div>
      </div>
    </>
  );
}

function MenuColumn({
  title,
  links,
  onClose,
}: {
  title: string;
  links: { label: string; href: string }[];
  onClose: () => void;
}) {
  if (links.length === 0) return <div />;
  return (
    <div>
      <p className="mb-3 text-xs font-semibold uppercase tracking-wide text-grey-800">{title}</p>
      <ul className="space-y-1">
        {links.map((link) => (
          <li key={link.href + link.label}>
            <Link href={link.href} onClick={onClose} className="block py-1 text-base hover:underline">
              {link.label}
            </Link>
          </li>
        ))}
      </ul>
    </div>
  );
}

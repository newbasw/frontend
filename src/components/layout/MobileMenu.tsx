'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { ChevronLeft, ChevronRight, Close } from '../icons';
import type { CategoryNav } from '@/lib/queries';

interface Props {
  categories: CategoryNav[];
  open: boolean;
  signedIn: boolean;
  onClose: () => void;
}

/**
 * Full-screen mobile overlay with drill-in navigation, matching the reference's
 * `MobileMenuWrapper_overlay`: root level lists Categories / Browse stock /
 * About BAS World / FAQ's / language; tapping Categories slides in the category
 * list, and tapping a category slides in its body types and brands.
 */
export function MobileMenu({ categories, open, signedIn, onClose }: Props) {
  const [level, setLevel] = useState<'root' | 'categories' | 'category'>('root');
  const [activeSlug, setActiveSlug] = useState<string | null>(null);
  const active = categories.find((c) => c.slug === activeSlug) ?? null;

  // Lock body scroll while the overlay is open.
  useEffect(() => {
    if (!open) return;
    const previous = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    return () => {
      document.body.style.overflow = previous;
    };
  }, [open]);

  useEffect(() => {
    if (!open) {
      setLevel('root');
      setActiveSlug(null);
    }
  }, [open]);

  if (!open) return null;

  return (
    <div
      data-testid="mobile-menu"
      className="fixed inset-0 z-[60] flex flex-col bg-white lg:hidden"
      role="dialog"
      aria-modal="true"
      aria-label="Menu"
    >
      <div className="flex h-14 shrink-0 items-center justify-between border-b border-grey-300 px-4">
        {level === 'root' ? (
          <span className="text-md font-semibold">Menu</span>
        ) : (
          <button
            type="button"
            onClick={() => (level === 'category' ? setLevel('categories') : setLevel('root'))}
            className="flex items-center gap-2 text-md font-semibold"
          >
            <ChevronLeft size={16} />
            {level === 'category' ? active?.label : 'Categories'}
          </button>
        )}
        <button type="button" onClick={onClose} aria-label="Close menu" className="p-2">
          <Close size={18} />
        </button>
      </div>

      <nav className="flex-1 overflow-y-auto">
        {level === 'root' && (
          <ul className="divide-y divide-grey-300">
            <li>
              <button
                type="button"
                onClick={() => setLevel('categories')}
                className="flex w-full items-center justify-between px-4 py-4 text-md"
              >
                Categories <ChevronRight size={14} />
              </button>
            </li>
            <MobileLink href="/stock/all" label="Browse all stock" onClose={onClose} />
            <MobileLink href="/content/about-bas-world" label="About BAS World" onClose={onClose} />
            <MobileLink href="/content/faq" label="FAQ's" onClose={onClose} />
            <MobileLink href="/favorites" label="Saved vehicles" onClose={onClose} />
            <MobileLink
              href={signedIn ? '/account' : '/login'}
              label={signedIn ? 'My account' : 'Login'}
              onClose={onClose}
            />
            <li className="px-4 py-4 text-md text-grey-800">English</li>
          </ul>
        )}

        {level === 'categories' && (
          <ul className="divide-y divide-grey-300">
            {categories.map((category) => (
              <li key={category.slug}>
                <button
                  type="button"
                  onClick={() => {
                    setActiveSlug(category.slug);
                    setLevel('category');
                  }}
                  className="flex w-full items-center justify-between px-4 py-4 text-md"
                >
                  <span>
                    {category.label}
                    <span className="ml-1 text-grey-800">({category.vehicle_count})</span>
                  </span>
                  <ChevronRight size={14} />
                </button>
              </li>
            ))}
          </ul>
        )}

        {level === 'category' && active && (
          <div className="pb-8">
            <Link
              href={`/stock/${active.slug}`}
              onClick={onClose}
              className="block border-b border-grey-300 px-4 py-4 text-md font-semibold text-link"
            >
              View all {active.label.toLowerCase()} ({active.vehicle_count})
            </Link>

            <MobileGroup
              title="Super structure"
              links={active.body_types.map((b) => ({
                label: b.label,
                href: `/stock/${active.slug}/${b.slug}`,
              }))}
              onClose={onClose}
            />
            <MobileGroup
              title="Brands"
              links={active.brands.map((b) => ({
                label: b.label,
                href: `/stock/${active.slug}/${b.slug}`,
              }))}
              onClose={onClose}
            />
            <MobileGroup
              title="Emission standard"
              links={active.emission_norms.map((n) => ({
                label: n.value,
                href: `/stock/${active.slug}?stageTier=${encodeURIComponent(n.value)}`,
              }))}
              onClose={onClose}
            />
          </div>
        )}
      </nav>
    </div>
  );
}

function MobileLink({ href, label, onClose }: { href: string; label: string; onClose: () => void }) {
  return (
    <li>
      <Link
        href={href}
        onClick={onClose}
        className="flex items-center justify-between px-4 py-4 text-md"
      >
        {label} <ChevronRight size={14} />
      </Link>
    </li>
  );
}

function MobileGroup({
  title,
  links,
  onClose,
}: {
  title: string;
  links: { label: string; href: string }[];
  onClose: () => void;
}) {
  if (links.length === 0) return null;
  return (
    <div className="border-b border-grey-300 py-2">
      <p className="px-4 py-2 text-xs font-semibold uppercase tracking-wide text-grey-800">{title}</p>
      <ul>
        {links.map((link) => (
          <li key={link.href + link.label}>
            <Link href={link.href} onClick={onClose} className="block px-4 py-2 text-base">
              {link.label}
            </Link>
          </li>
        ))}
      </ul>
    </div>
  );
}

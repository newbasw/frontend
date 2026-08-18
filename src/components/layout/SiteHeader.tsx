'use client';

import { useEffect, useState } from 'react';
import { SmartImage as Image } from '../ui/SmartImage';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { SearchBar } from '../search/SearchBar';
import { MegaMenu } from './MegaMenu';
import { MobileMenu } from './MobileMenu';
import { AccountMenu } from './AccountMenu';
import { useAuth } from '../auth/AuthProvider';
import { ChevronDown, CircleUser, Menu, CirclePhone } from '../icons';
import type { CategoryNav } from '@/lib/queries';

interface Props {
  categories: CategoryNav[];
}

/**
 * Site header, rebuilt against the live reference.
 *
 * Layout, left to right: logo · bordered "Categories" dropdown · a wide pill
 * search field with the green "Try AI Search" chip *inside* it and a magnifier
 * at its right edge · the account control · a black "Start buying" button.
 * 80px tall on desktop, 56px on mobile.
 */
export function SiteHeader({ categories }: Props) {
  const [menuOpen, setMenuOpen] = useState(false);
  const [mobileOpen, setMobileOpen] = useState(false);
  const pathname = usePathname();
  const { user } = useAuth();

  useEffect(() => {
    setMenuOpen(false);
    setMobileOpen(false);
  }, [pathname]);

  useEffect(() => {
    function onKey(e: KeyboardEvent) {
      if (e.key === 'Escape') {
        setMenuOpen(false);
        setMobileOpen(false);
      }
    }
    document.addEventListener('keydown', onKey);
    return () => document.removeEventListener('keydown', onKey);
  }, []);

  return (
    <div className="relative bg-white">
      {/* ---------------- desktop ---------------- */}
      <header
        data-testid="headerDesktop"
        className="page-wrapper hidden h-20 items-center gap-5 lg:flex"
      >
        <Link href="/" aria-label="BAS World home" className="shrink-0">
          <Image
            src="/resources/icons/logos/logo-desktop.svg"
            alt="BAS World"
            width={250}
            height={38}
            priority
            className="h-[38px] w-[250px]"
          />
        </Link>

        <button
          type="button"
          aria-label="Categories"
          aria-expanded={menuOpen}
          title="Categories"
          onClick={() => setMenuOpen((v) => !v)}
          className="flex h-12 shrink-0 items-center gap-2 rounded-minimal border border-grey-400 px-4 text-md font-semibold hover:border-ink"
        >
          Categories
          <ChevronDown size={14} className={menuOpen ? 'rotate-180' : ''} />
        </button>

        <SearchBar className="min-w-0 flex-1" variant="pill" />

        <AccountMenu />

        <Link href="/stock/all" className="h-12 shrink-0 rounded-minimal bg-ink px-6 text-md font-semibold leading-[48px] text-white transition-colors hover:bg-black">
          Start buying
        </Link>
      </header>

      <MegaMenu categories={categories} open={menuOpen} onClose={() => setMenuOpen(false)} />

      {/* ---------------- mobile ---------------- */}
      <header
        data-testid="headerMobile"
        className="page-wrapper flex h-14 items-center gap-3 lg:hidden"
      >
        <button
          type="button"
          aria-label="Open menu"
          aria-expanded={mobileOpen}
          onClick={() => setMobileOpen(true)}
          className="flex h-10 w-7 shrink-0 items-center justify-center"
        >
          <Menu size={22} />
        </button>

        <SearchBar className="min-w-0 flex-1" variant="pill" placeholder="Search for vehicles or enter the Ref no." />

        <div className="flex shrink-0 items-center gap-3">
          <a href="tel:+31413728320" aria-label="Call BAS World">
            <CirclePhone size={22} />
          </a>
          <Link href={user ? '/account' : '/login'} aria-label={user ? 'Account' : 'Login'}>
            <CircleUser size={24} />
          </Link>
        </div>
      </header>

      <MobileMenu
        categories={categories}
        open={mobileOpen}
        onClose={() => setMobileOpen(false)}
        signedIn={!!user}
      />
    </div>
  );
}

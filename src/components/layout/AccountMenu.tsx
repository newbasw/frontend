'use client';

import { useEffect, useRef, useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useAuth } from '../auth/AuthProvider';
import { ChevronDown, ChevronRight, CircleUser } from '../icons';

/**
 * The signed-in account dropdown, matching the reference's own menu:
 * the email at the top, then four groups separated by rules —
 *   overview / orders / favourites / saved searches
 *   seller dashboard / add new vehicle
 *   company switcher
 *   profile & settings / customer support / log out
 *
 * Signed out, the same control is a plain "Login" link, as on the reference.
 */

function Icon({ d, filled }: { d: string; filled?: boolean }) {
  return (
    <svg
      width={20}
      height={20}
      viewBox="0 0 24 24"
      fill={filled ? 'currentColor' : 'none'}
      stroke={filled ? 'none' : 'currentColor'}
      strokeWidth={1.7}
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
      className="shrink-0"
    >
      <path d={d} />
    </svg>
  );
}

const ICONS = {
  gauge: 'M12 14a2 2 0 1 0 0-4 2 2 0 0 0 0 4Zm0-11a9 9 0 1 0 9 9M12 3a9 9 0 0 1 9 9M13.4 10.6 18 6',
  orders: 'M6 3h12a1 1 0 0 1 1 1v16l-3.5-2-3.5 2-3.5-2L5 20V4a1 1 0 0 1 1-1Zm3 5h6M9 12h6',
  heart: 'M12 20.7 3.9 12.6a4.9 4.9 0 0 1 6.9-7l1.2 1.2 1.2-1.2a4.9 4.9 0 0 1 6.9 7L12 20.7Z',
  bell: 'M18 8a6 6 0 1 0-12 0c0 7-3 8-3 8h18s-3-1-3-8M13.7 21a2 2 0 0 1-3.4 0',
  plus: 'M12 3a9 9 0 1 0 0 18 9 9 0 0 0 0-18Zm0 5v8m-4-4h8',
  building: 'M4 21V5a2 2 0 0 1 2-2h8a2 2 0 0 1 2 2v16M16 8h2a2 2 0 0 1 2 2v11M4 21h16M8 7h4M8 11h4M8 15h4',
  gear: 'M12 15a3 3 0 1 0 0-6 3 3 0 0 0 0 6Zm7.4-3a7.4 7.4 0 0 0-.1-1.2l2-1.6-2-3.4-2.4 1a7.3 7.3 0 0 0-2-1.2l-.4-2.6h-4l-.4 2.6a7.3 7.3 0 0 0-2 1.2l-2.4-1-2 3.4 2 1.6a7.5 7.5 0 0 0 0 2.4l-2 1.6 2 3.4 2.4-1a7.3 7.3 0 0 0 2 1.2l.4 2.6h4l.4-2.6a7.3 7.3 0 0 0 2-1.2l2.4 1 2-3.4-2-1.6c.06-.4.1-.8.1-1.2Z',
  support: 'M4 14v-2a8 8 0 0 1 16 0v2M4 14a2 2 0 0 0 2 2h1v-6H6a2 2 0 0 0-2 2Zm16 0a2 2 0 0 1-2 2h-1v-6h1a2 2 0 0 1 2 2Zm-3 2v1a3 3 0 0 1-3 3h-2',
  logout: 'M15 17l5-5-5-5M20 12H9M12 20H6a2 2 0 0 1-2-2V6a2 2 0 0 1 2-2h6',
};

interface Item {
  label: string;
  href: string;
  icon: keyof typeof ICONS;
  filled?: boolean;
}

const GROUPS: Item[][] = [
  [
    { label: 'Account overview', href: '/account', icon: 'gauge' },
    { label: 'Orders', href: '/account/orders', icon: 'orders' },
    { label: 'Favorites', href: '/favorites', icon: 'heart', filled: true },
    { label: 'Saved searches', href: '/account/saved-searches', icon: 'bell' },
  ],
  [
    { label: 'My payment plans', href: '/account/plans', icon: 'gauge' },
  ],
  [
    { label: 'Profile & Settings', href: '/account/settings', icon: 'gear' },
    { label: 'Customer support', href: '/content/contact-us', icon: 'support' },
  ],
];

export function AccountMenu() {
  const { user, logout } = useAuth();
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    function onClick(event: MouseEvent) {
      if (!ref.current?.contains(event.target as Node)) setOpen(false);
    }
    function onKey(event: KeyboardEvent) {
      if (event.key === 'Escape') setOpen(false);
    }
    document.addEventListener('mousedown', onClick);
    document.addEventListener('keydown', onKey);
    return () => {
      document.removeEventListener('mousedown', onClick);
      document.removeEventListener('keydown', onKey);
    };
  }, []);

  if (!user) {
    return (
      <Link
        href="/login"
        data-testid="togglerDesktop"
        className="flex shrink-0 items-center gap-2 text-md"
      >
        <CircleUser size={34} />
        Login
      </Link>
    );
  }

  const company = user.company_name?.trim();

  return (
    <div ref={ref} className="relative shrink-0">
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        aria-expanded={open}
        aria-haspopup="menu"
        data-testid="togglerDesktop"
        className="flex items-center gap-2 text-md"
      >
        <span className="relative">
          <CircleUser size={34} />
          {/* The reference shows a blue dot for unread account activity. */}
          <span className="absolute -right-0.5 -top-0.5 h-2.5 w-2.5 rounded-full bg-link ring-2 ring-white" />
        </span>
        Account
        <ChevronDown size={14} className={open ? 'rotate-180' : ''} />
      </button>

      {open && (
        <div
          role="menu"
          data-testid="account-menu"
          className="absolute right-0 top-[calc(100%+12px)] z-50 w-[300px] overflow-hidden rounded-minimal border border-grey-300 bg-white shadow-menu"
        >
          <p className="px-5 py-4 text-center text-md font-semibold" title={user.email}>
            {user.email}
          </p>

          {GROUPS.map((group, index) => (
            <div key={index} className="border-t border-grey-300 py-2">
              {group.map((item) => (
                <Link
                  key={item.href}
                  href={item.href}
                  role="menuitem"
                  onClick={() => setOpen(false)}
                  className="flex items-center gap-3 px-5 py-2.5 text-md hover:bg-grey-100"
                >
                  <Icon d={ICONS[item.icon]} filled={item.filled} />
                  {item.label}
                </Link>
              ))}

              {/* Company switcher sits between the seller and settings groups. */}
              {index === 1 && (
                <div className="mt-2 flex items-center justify-between gap-3 border-t border-grey-300 px-5 pb-1 pt-4">
                  <span className="flex items-center gap-3 text-md">
                    <Icon d={ICONS.building} />
                    {company || 'My company'}
                  </span>
                  <button
                    type="button"
                    className="flex items-center gap-1 text-base text-grey-800 hover:text-ink"
                  >
                    Switch company
                    <ChevronRight size={12} />
                  </button>
                </div>
              )}
            </div>
          ))}

          <div className="border-t border-grey-300 py-2">
            <button
              type="button"
              role="menuitem"
              data-testid="menu-logout"
              onClick={async () => {
                setOpen(false);
                await logout();
                window.location.assign('/');
              }}
              className="flex w-full items-center gap-3 px-5 py-2.5 text-left text-md hover:bg-grey-100"
            >
              <Icon d={ICONS.logout} />
              Log out
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

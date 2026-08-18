'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { Close } from '../icons';

const STORAGE_KEY = 'bw_cookie_consent';

/**
 * First-party stand-in for the CookieScript modal on the reference site: same
 * placement, same three actions (Accept all / Decline / close), same blocking
 * behaviour on first visit. The choice is persisted locally.
 */
export function CookieBanner() {
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    try {
      if (!localStorage.getItem(STORAGE_KEY)) setVisible(true);
    } catch {
      /* storage blocked — do not nag */
    }
  }, []);

  function decide(choice: 'all' | 'declined') {
    try {
      localStorage.setItem(STORAGE_KEY, choice);
    } catch {
      /* ignore */
    }
    setVisible(false);
  }

  if (!visible) return null;

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-label="Cookie consent dialog"
      className="fixed inset-x-0 bottom-0 z-[80] border-t border-grey-300 bg-white shadow-menu"
    >
      <div className="page-wrapper flex flex-col gap-4 py-5 md:flex-row md:items-center md:justify-between">
        <div className="max-w-3xl">
          <p className="text-md font-semibold">We use cookies</p>
          <p className="mt-1 text-base text-grey-800">
            We use functional cookies to keep you signed in, analytics cookies to understand how the
            site is used, and marketing cookies to measure our campaigns. Read our{' '}
            <Link href="/content/cookies" className="cds-link">
              Cookie Policy
            </Link>{' '}
            and{' '}
            <Link href="/content/privacy-disclaimer" className="cds-link">
              Privacy Policy
            </Link>
            .
          </p>
        </div>
        <div className="flex shrink-0 items-center gap-3">
          {/* Declining is the privacy-preserving default and is given equal weight. */}
          <button type="button" onClick={() => decide('declined')} className="bw-btn-outline">
            Decline
          </button>
          <button type="button" onClick={() => decide('all')} className="bw-btn-black">
            Accept all
          </button>
          <button
            type="button"
            onClick={() => decide('declined')}
            aria-label="Close"
            className="p-2 text-grey-700 hover:text-ink"
          >
            <Close size={16} />
          </button>
        </div>
      </div>
    </div>
  );
}

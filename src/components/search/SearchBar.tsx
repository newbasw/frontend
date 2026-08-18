'use client';

import { useEffect, useId, useRef, useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { clientApi } from '@/lib/api';
import { Close, Search, Spinner } from '../icons';
import type { SearchSuggestion } from '@shared/types';

interface Props {
  className?: string;
  placeholder?: string;
  initialValue?: string;
  autoFocus?: boolean;
  onNavigate?: () => void;
  /**
   * `pill` matches the reference header: a rounded, bordered field with the
   * green "Try AI Search" chip inside it and the magnifier at the right edge.
   * `flat` is the plainer field used on the advisor page.
   */
  variant?: 'pill' | 'flat';
}

/**
 * Header search. Reproduces the reference's autocomplete behaviour:
 * debounced suggestions, keyboard navigation, clear button, loading spinner,
 * Enter submits to the stock page with `?q=`.
 */
export function SearchBar({
  className = '',
  placeholder = 'Search for vehicles or enter the Ref no.',
  initialValue = '',
  autoFocus,
  onNavigate,
  variant = 'flat',
}: Props) {
  const router = useRouter();
  const listboxId = useId();
  const [term, setTerm] = useState(initialValue);
  const [items, setItems] = useState<SearchSuggestion[]>([]);
  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [active, setActive] = useState(-1);
  const isPill = variant === 'pill';
  const containerRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  // Debounced suggestion fetch.
  useEffect(() => {
    const value = term.trim();
    if (value.length < 2) {
      setItems([]);
      setLoading(false);
      return;
    }
    setLoading(true);
    const controller = new AbortController();
    const timer = setTimeout(() => {
      clientApi<{ items: SearchSuggestion[] }>(
        `/api/search/suggest?q=${encodeURIComponent(value)}`,
        { signal: controller.signal },
      )
        .then((res) => {
          setItems(res.items);
          setOpen(true);
        })
        .catch(() => setItems([]))
        .finally(() => setLoading(false));
    }, 220);

    return () => {
      clearTimeout(timer);
      controller.abort();
    };
  }, [term]);

  // Close on outside click.
  useEffect(() => {
    function handle(event: MouseEvent) {
      if (!containerRef.current?.contains(event.target as Node)) setOpen(false);
    }
    document.addEventListener('mousedown', handle);
    return () => document.removeEventListener('mousedown', handle);
  }, []);

  function submit(value: string) {
    setOpen(false);
    onNavigate?.();
    router.push(value.trim() ? `/stock/all?q=${encodeURIComponent(value.trim())}` : '/stock/all');
  }

  function onKeyDown(event: React.KeyboardEvent<HTMLInputElement>) {
    if (event.key === 'ArrowDown') {
      event.preventDefault();
      setOpen(true);
      setActive((i) => Math.min(i + 1, items.length - 1));
    } else if (event.key === 'ArrowUp') {
      event.preventDefault();
      setActive((i) => Math.max(i - 1, -1));
    } else if (event.key === 'Enter') {
      event.preventDefault();
      const chosen = items[active];
      if (chosen) {
        setOpen(false);
        onNavigate?.();
        router.push(chosen.href);
      } else {
        submit(term);
      }
    } else if (event.key === 'Escape') {
      setOpen(false);
      setActive(-1);
    }
  }

  return (
    <div ref={containerRef} className={`relative ${className}`}>
      <form
        role="search"
        className={
          isPill
            ? 'flex h-12 items-center gap-2 rounded-[26px] border border-grey-400 bg-white pl-5 pr-2 focus-within:border-ink'
            : 'flex h-11 items-center bg-grey-100'
        }
        onSubmit={(e) => {
          e.preventDefault();
          submit(term);
        }}
      >
        {!isPill && (
          <button
            type="submit"
            title="Submit"
            aria-label="Submit search"
            className="flex h-11 w-11 shrink-0 items-center justify-center text-ink"
          >
            <Search size={20} />
          </button>
        )}

        <input
          ref={inputRef}
          type="search"
          value={term}
          autoFocus={autoFocus}
          onChange={(e) => {
            setTerm(e.target.value);
            setActive(-1);
          }}
          onFocus={() => term.trim().length >= 2 && setOpen(true)}
          onKeyDown={onKeyDown}
          placeholder={placeholder}
          maxLength={512}
          autoComplete="off"
          spellCheck={false}
          enterKeyHint="search"
          aria-label="Search for vehicles"
          aria-autocomplete="list"
          aria-expanded={open}
          aria-controls={listboxId}
          className={`w-full min-w-0 bg-transparent text-md text-ink outline-none placeholder:text-grey-800 ${
            isPill ? 'h-12' : 'h-11 pr-2'
          }`}
        />

        {term && (
          <button
            type="button"
            title="Clear"
            aria-label="Clear search"
            onClick={() => {
              setTerm('');
              setItems([]);
              inputRef.current?.focus();
            }}
            className="flex h-8 w-8 shrink-0 items-center justify-center text-grey-700 hover:text-ink"
          >
            <Close size={16} />
          </button>
        )}

        {isPill && (
          <>
            {/* The AI-search chip sits inside the field on the reference. */}
            <Link
              href="/advisor"
              data-testid="ai-advisor-btn"
              onClick={onNavigate}
              className="hidden shrink-0 rounded-[18px] bg-brand/25 px-4 py-1.5 text-base font-semibold text-brand-dark hover:bg-brand/35 sm:block"
            >
              Try AI Search
            </Link>
            <button
              type="submit"
              title="Submit"
              aria-label="Submit search"
              className="flex h-10 w-10 shrink-0 items-center justify-center text-ink"
            >
              {loading ? <Spinner size={18} className="text-grey-700" /> : <Search size={20} />}
            </button>
          </>
        )}

        {!isPill && loading && (
          <span className="flex h-11 w-11 shrink-0 items-center justify-center">
            <Spinner size={18} className="text-grey-700" />
          </span>
        )}
      </form>

      {open && (items.length > 0 || (!loading && term.trim().length >= 2)) && (
        <div
          id={listboxId}
          role="listbox"
          className="absolute left-0 right-0 top-full z-50 max-h-[70vh] overflow-y-auto border border-grey-300 bg-white shadow-menu"
        >
          {items.length === 0 ? (
            <p className="px-4 py-6 text-center text-base text-grey-800">
              No results for “{term}”. Try a brand, model or reference number.
            </p>
          ) : (
            <ul>
              {items.map((item, index) => (
                <li key={`${item.type}-${item.href}-${index}`}>
                  <Link
                    href={item.href}
                    role="option"
                    aria-selected={index === active}
                    onClick={() => {
                      setOpen(false);
                      onNavigate?.();
                    }}
                    className={`flex items-baseline justify-between gap-3 px-4 py-2 text-base hover:bg-grey-100 ${
                      index === active ? 'bg-grey-100' : ''
                    }`}
                  >
                    <span className="truncate">{item.label}</span>
                    {item.sublabel && (
                      <span className="shrink-0 text-xs text-grey-800">{item.sublabel}</span>
                    )}
                  </Link>
                </li>
              ))}
              <li className="border-t border-grey-300">
                <button
                  type="button"
                  onClick={() => submit(term)}
                  className="w-full px-4 py-3 text-left text-base font-semibold text-link hover:bg-grey-100"
                >
                  See all results for “{term}”
                </button>
              </li>
            </ul>
          )}
        </div>
      )}
    </div>
  );
}

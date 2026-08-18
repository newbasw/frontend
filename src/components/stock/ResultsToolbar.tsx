'use client';

import { useEffect, useRef, useState } from 'react';
import { useStockParams } from '@/lib/useStockParams';
import { formatNumber } from '@/lib/format';
import { ChevronDown, Grid, List } from '../icons';
import { SORT_OPTIONS, type SortValue } from '@shared/types';

interface Props {
  total: number;
  sort: SortValue;
  view: 'grid' | 'list';
}

/** "N Vehicles found · Sort by: … · List | Grid" — the reference's results bar. */
export function ResultsToolbar({ total, sort, view }: Props) {
  const { setParam } = useStockParams();
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    function handle(e: MouseEvent) {
      if (!ref.current?.contains(e.target as Node)) setOpen(false);
    }
    document.addEventListener('mousedown', handle);
    return () => document.removeEventListener('mousedown', handle);
  }, []);

  const activeLabel = SORT_OPTIONS.find((o) => o.value === sort)?.label ?? 'Relevance';

  return (
    <div className="mb-4 flex flex-wrap items-center justify-between gap-3 border-b border-grey-300 pb-3">
      <p className="text-base" data-testid="results-count">
        <strong>{formatNumber(total)}</strong> Vehicles found
      </p>

      <div className="flex items-center gap-4">
        <div ref={ref} className="relative">
          <button
            type="button"
            onClick={() => setOpen((v) => !v)}
            aria-expanded={open}
            aria-haspopup="listbox"
            data-testid="sort-toggle"
            className="flex items-center gap-2 text-base"
          >
            <span className="text-grey-800">Sort by:</span>
            <span className="font-semibold">{activeLabel}</span>
            <ChevronDown size={12} />
          </button>
          {open && (
            <ul
              role="listbox"
              data-testid="sort-menu"
              className="absolute right-0 top-full z-40 mt-1 w-64 border border-grey-300 bg-white shadow-menu"
            >
              {SORT_OPTIONS.map((option) => (
                <li key={option.value}>
                  <button
                    type="button"
                    role="option"
                    aria-selected={option.value === sort}
                    onClick={() => {
                      setParam('sort', option.value === 'relevance' ? null : option.value);
                      setOpen(false);
                    }}
                    className={`w-full px-4 py-2 text-left text-base hover:bg-grey-100 ${
                      option.value === sort ? 'bg-grey-100 font-semibold' : ''
                    }`}
                  >
                    {option.label}
                  </button>
                </li>
              ))}
            </ul>
          )}
        </div>

        <div className="hidden items-center gap-1 md:flex">
          <button
            type="button"
            aria-label="List view"
            aria-pressed={view === 'list'}
            onClick={() => setParam('view', 'list', { resetPage: false })}
            className={`flex h-8 w-8 items-center justify-center border ${
              view === 'list' ? 'border-ink bg-ink text-white' : 'border-grey-400 text-grey-800'
            }`}
          >
            <List size={14} />
          </button>
          <button
            type="button"
            aria-label="Grid view"
            aria-pressed={view === 'grid'}
            onClick={() => setParam('view', null, { resetPage: false })}
            className={`flex h-8 w-8 items-center justify-center border ${
              view === 'grid' ? 'border-ink bg-ink text-white' : 'border-grey-400 text-grey-800'
            }`}
          >
            <Grid size={14} />
          </button>
        </div>
      </div>
    </div>
  );
}

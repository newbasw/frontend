'use client';

import { useEffect, useState } from 'react';
import { FilterPanel } from './FilterPanel';
import { useStockParams } from '@/lib/useStockParams';
import { ChevronDown, Close, Filter } from '../icons';
import { SORT_OPTIONS, type FilterGroup, type SortValue } from '@shared/types';

interface Props {
  filters: FilterGroup[];
  appliedCount: number;
  sort: SortValue;
  total: number;
}

/**
 * Mobile-only sticky action bar + full-screen sheets, reproducing the
 * reference's `Stock_actionBar` pattern: the sidebar is replaced by a
 * "Filter (N)" button and a sort button, each opening a sheet.
 */
export function MobileFilterBar({ filters, appliedCount, sort, total }: Props) {
  const [sheet, setSheet] = useState<'none' | 'filters' | 'sort'>('none');
  const { setParam, clearAll } = useStockParams();

  useEffect(() => {
    if (sheet === 'none') return;
    const previous = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    return () => {
      document.body.style.overflow = previous;
    };
  }, [sheet]);

  const activeLabel = SORT_OPTIONS.find((o) => o.value === sort)?.label ?? 'Relevance';

  return (
    <>
      <div
        data-testid="mobile-action-bar"
        className="sticky bottom-0 z-40 border-t border-grey-300 bg-white p-3 lg:hidden"
      >
        <div className="flex gap-2">
          <button
            type="button"
            onClick={() => setSheet('filters')}
            data-testid="mobile-filter-button"
            className="flex h-11 flex-1 items-center justify-center gap-2 bg-ink text-base font-semibold text-white"
          >
            <Filter size={14} />
            Filter{appliedCount > 0 ? ` (${appliedCount})` : ''}
          </button>
          <button
            type="button"
            onClick={() => setSheet('sort')}
            className="flex h-11 flex-1 items-center justify-center gap-2 border border-ink text-base font-semibold"
          >
            {activeLabel}
            <ChevronDown size={12} />
          </button>
        </div>
      </div>

      {sheet !== 'none' && (
        <div
          role="dialog"
          aria-modal="true"
          aria-label={sheet === 'filters' ? 'Filters' : 'Sort'}
          className="fixed inset-0 z-[70] flex flex-col bg-white lg:hidden"
        >
          <div className="flex h-14 shrink-0 items-center justify-between border-b border-grey-300 px-4">
            <span className="text-md font-semibold">
              {sheet === 'filters' ? 'Filter' : 'Sort by'}
            </span>
            <button type="button" onClick={() => setSheet('none')} aria-label="Close" className="p-2">
              <Close size={18} />
            </button>
          </div>

          <div className="flex-1 overflow-y-auto px-4 pb-24">
            {sheet === 'filters' ? (
              <FilterPanel filters={filters} />
            ) : (
              <ul className="divide-y divide-grey-300">
                {SORT_OPTIONS.map((option) => (
                  <li key={option.value}>
                    <button
                      type="button"
                      onClick={() => {
                        setParam('sort', option.value === 'relevance' ? null : option.value);
                        setSheet('none');
                      }}
                      className={`w-full py-4 text-left text-md ${
                        option.value === sort ? 'font-semibold' : ''
                      }`}
                    >
                      {option.label}
                    </button>
                  </li>
                ))}
              </ul>
            )}
          </div>

          {sheet === 'filters' && (
            <div className="flex shrink-0 gap-2 border-t border-grey-300 p-3">
              <button
                type="button"
                onClick={() => {
                  clearAll();
                  setSheet('none');
                }}
                className="h-11 flex-1 border border-ink text-base font-semibold"
              >
                Reset
              </button>
              <button
                type="button"
                onClick={() => setSheet('none')}
                className="h-11 flex-1 bg-ink text-base font-semibold text-white"
              >
                Show {total} results
              </button>
            </div>
          )}
        </div>
      )}
    </>
  );
}

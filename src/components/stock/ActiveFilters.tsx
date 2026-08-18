'use client';

import { useStockParams } from '@/lib/useStockParams';
import { Close, RotateLeft } from '../icons';
import type { AppliedFilter } from '@shared/types';

export function ActiveFilters({ applied }: { applied: AppliedFilter[] }) {
  const { removeFilter, clearAll } = useStockParams();

  if (applied.length === 0) return null;

  return (
    <div data-testid="activeFilters" className="mb-4">
      <p className="mb-2 text-base font-semibold">
        {applied.length} selected filter{applied.length === 1 ? '' : 's'}
      </p>
      <div className="flex flex-wrap items-center gap-2">
        <button
          type="button"
          onClick={clearAll}
          data-testid="clear-filters"
          className="flex h-8 items-center gap-2 border border-ink px-3 text-xs font-semibold hover:bg-grey-100"
        >
          Clear
          <RotateLeft size={12} />
        </button>
        {applied.map((filter) => (
          <span key={`${filter.key}:${filter.value}`} className="bw-tag">
            {filter.label}
            <button
              type="button"
              aria-label={`Clear filter ${filter.label}`}
              title="Clear filter"
              onClick={() => removeFilter(filter.key, filter.value)}
              className="flex h-5 w-5 items-center justify-center rounded-full hover:bg-grey-400"
            >
              <Close size={12} />
            </button>
          </span>
        ))}
      </div>
    </div>
  );
}

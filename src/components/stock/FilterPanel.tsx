'use client';

import { useEffect, useState, useTransition } from 'react';
import { useStockParams } from '@/lib/useStockParams';
import { formatNumber } from '@/lib/format';
import type { FacetOption, FilterGroup } from '@shared/types';

/**
 * The filter sidebar. Every control writes to the URL, which re-runs the server
 * query — nothing here is decorative. Facet counts come from the API and update
 * as filters change (disjunctive faceting, like the reference).
 */
export function FilterPanel({ filters }: { filters: FilterGroup[] }) {
  return (
    <div data-testid="filter-panel">
      <p className="mb-2 text-lg font-semibold">Filter</p>
      <div className="divide-y divide-grey-300 border-t border-grey-300">
        {filters.map((group) =>
          group.type === 'checkbox' ? (
            <CheckboxGroup key={`${group.key}-${group.label}`} group={group} />
          ) : (
            <RangeGroup key={`${group.key}-${group.label}`} group={group} />
          ),
        )}
      </div>
    </div>
  );
}

function CheckboxGroup({ group }: { group: FilterGroup }) {
  const { toggleValue } = useStockParams();
  const [expanded, setExpanded] = useState(false);
  const [collapsed, setCollapsed] = useState(false);
  const [pending, startTransition] = useTransition();

  const options = group.options ?? [];

  /**
   * The checked state is owned by the server (it comes back in `option.selected`),
   * but a round trip takes time. Without a local optimistic copy the box would
   * visibly snap back to its old state until the new page arrived, which reads
   * as "the click didn't work". This keeps the tick immediate and re-syncs when
   * the server response lands.
   */
  const [optimistic, setOptimistic] = useState<Record<string, boolean>>({});

  useEffect(() => {
    // Server state is authoritative once it arrives.
    setOptimistic({});
  }, [options]);

  const isChecked = (option: FacetOption) => optimistic[option.value] ?? option.selected;

  const limit = group.collapseAfter ?? options.length;
  const visible = expanded ? options : options.slice(0, limit);

  return (
    <fieldset className={`py-4 transition-opacity ${pending ? 'opacity-60' : ''}`}>
      <legend className="sr-only">{group.label}</legend>
      <button
        type="button"
        onClick={() => setCollapsed((v) => !v)}
        aria-expanded={!collapsed}
        className="mb-2 flex w-full items-center justify-between text-left text-base font-semibold"
      >
        {group.label}
        <span aria-hidden="true" className="text-grey-700">
          {collapsed ? '+' : '–'}
        </span>
      </button>

      {!collapsed && (
        <>
          <ul className="space-y-1">
            {visible.map((option) => (
              <li key={option.value}>
                <label className="flex cursor-pointer items-center justify-between gap-2 py-1 text-base hover:bg-grey-100">
                  <span className="flex min-w-0 items-center gap-2">
                    <input
                      type="checkbox"
                      checked={isChecked(option)}
                      onChange={(event) => {
                        const next = event.target.checked;
                        setOptimistic((prev) => ({ ...prev, [option.value]: next }));
                        startTransition(() => toggleValue(group.key, option.value));
                      }}
                      className="h-4 w-4 shrink-0 accent-ink"
                      data-testid={`filter-${group.key}-${option.value}`}
                    />
                    <span className="truncate">{option.label}</span>
                  </span>
                  <span className="shrink-0 text-xs text-grey-800">{formatNumber(option.count)}</span>
                </label>
              </li>
            ))}
          </ul>

          {options.length > limit && (
            <button
              type="button"
              onClick={() => setExpanded((v) => !v)}
              className="mt-2 text-base font-semibold text-link hover:underline"
            >
              {expanded ? 'Show less' : `Show more (${options.length - limit})`}
            </button>
          )}
        </>
      )}
    </fieldset>
  );
}

function RangeGroup({ group }: { group: FilterGroup }) {
  const { setRange } = useStockParams();
  const [from, setFrom] = useState(group.selectedMin != null ? String(group.selectedMin) : '');
  const [to, setTo] = useState(group.selectedMax != null ? String(group.selectedMax) : '');

  // Re-sync when the server sends a different selection (e.g. after Clear).
  useEffect(() => {
    setFrom(group.selectedMin != null ? String(group.selectedMin) : '');
    setTo(group.selectedMax != null ? String(group.selectedMax) : '');
  }, [group.selectedMin, group.selectedMax]);

  function apply() {
    const nextFrom = from.trim();
    const nextTo = to.trim();
    const currentFrom = group.selectedMin != null ? String(group.selectedMin) : '';
    const currentTo = group.selectedMax != null ? String(group.selectedMax) : '';
    // Avoid a pointless navigation when nothing actually changed (blur fires a lot).
    if (nextFrom === currentFrom && nextTo === currentTo) return;
    setRange(group.key, nextFrom, nextTo);
  }

  return (
    <div className="py-4">
      <p className="mb-2 text-base font-semibold">{group.label}</p>
      <div className="flex items-center gap-2">
        <label className="flex-1">
          <span className="sr-only">{group.label} from</span>
          <input
            type="number"
            inputMode="numeric"
            value={from}
            placeholder={group.min != null ? String(group.min) : 'From'}
            onChange={(e) => setFrom(e.target.value)}
            onBlur={apply}
            onKeyDown={(e) => e.key === 'Enter' && apply()}
            className="bw-input"
            data-testid={`filter-${group.key}-from`}
          />
        </label>
        <span className="text-xs text-grey-800">To</span>
        <label className="flex-1">
          <span className="sr-only">{group.label} to</span>
          <input
            type="number"
            inputMode="numeric"
            value={to}
            placeholder={group.max != null ? String(group.max) : 'To'}
            onChange={(e) => setTo(e.target.value)}
            onBlur={apply}
            onKeyDown={(e) => e.key === 'Enter' && apply()}
            className="bw-input"
            data-testid={`filter-${group.key}-to`}
          />
        </label>
      </div>
    </div>
  );
}

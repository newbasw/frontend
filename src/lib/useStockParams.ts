'use client';

import { useCallback } from 'react';
import { usePathname, useRouter, useSearchParams } from 'next/navigation';
import { isPathScoped, useStockScope, type StockScope } from '@/components/stock/StockScope';

const SCOPE_KEYS = ['category', 'bodyType', 'brand', 'model'] as const;

/**
 * Single place where listing state lives: the URL.
 *
 * Every filter, sort and page change is a URL change, so results are
 * bookmarkable, shareable and survive a refresh or a back-button press — the
 * same contract the reference site offers.
 *
 * Two URL shapes carry filters:
 *   • the path      `/stock/truck/volvo`  (pretty entry points, as on the reference)
 *   • the query     `?condition=used&priceTo=40000`
 *
 * When a user turns off a filter that the path is pinning, we cannot just edit
 * the query string — the path would still pin it. In that case the whole scope
 * is moved into the query string at `/stock/all`, which keeps every other
 * active filter intact.
 */
export function useStockParams() {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const scope = useStockScope();

  const commit = useCallback(
    (
      next: URLSearchParams,
      { resetPage = true, path = pathname }: { resetPage?: boolean; path?: string } = {},
    ) => {
      if (resetPage) next.delete('page');
      const qs = next.toString();
      router.push(qs ? `${path}?${qs}` : path, { scroll: false });
    },
    [pathname, router],
  );

  /** Flattens the path-pinned filters into a query string, minus one key/value. */
  const dissolveScope = useCallback(
    (next: URLSearchParams, exclude: { key: string; value: string }) => {
      for (const key of SCOPE_KEYS) {
        const pinned = scope[key as keyof StockScope];
        if (!pinned) continue;
        if (key === exclude.key && pinned.toLowerCase() === exclude.value.toLowerCase()) continue;
        if (!next.getAll(key).includes(pinned)) next.append(key, pinned);
      }
      return next;
    },
    [scope],
  );

  /** Adds or removes one value from a repeatable param. */
  const toggleValue = useCallback(
    (key: string, value: string) => {
      const next = new URLSearchParams(searchParams.toString());

      // Turning off a path-pinned filter: rewrite the path, keep everything else.
      if (isPathScoped(scope, key, value)) {
        dissolveScope(next, { key, value });
        commit(next, { path: '/stock/all' });
        return;
      }

      const current = next.getAll(key);
      next.delete(key);
      const remaining = current.includes(value)
        ? current.filter((v) => v !== value)
        : [...current, value];
      for (const v of remaining) next.append(key, v);
      commit(next);
    },
    [commit, dissolveScope, scope, searchParams],
  );

  /** Sets a From/To pair; empty strings clear the bound. */
  const setRange = useCallback(
    (key: string, from: string, to: string) => {
      const next = new URLSearchParams(searchParams.toString());
      if (from) next.set(`${key}From`, from);
      else next.delete(`${key}From`);
      if (to) next.set(`${key}To`, to);
      else next.delete(`${key}To`);
      commit(next);
    },
    [commit, searchParams],
  );

  const setParam = useCallback(
    (key: string, value: string | null, opts?: { resetPage?: boolean }) => {
      const next = new URLSearchParams(searchParams.toString());
      if (value == null || value === '') next.delete(key);
      else next.set(key, value);
      commit(next, opts);
    },
    [commit, searchParams],
  );

  /** Removes one applied filter, whether categorical, path-pinned or a range pair. */
  const removeFilter = useCallback(
    (key: string, value: string) => {
      const next = new URLSearchParams(searchParams.toString());

      if (isPathScoped(scope, key, value)) {
        dissolveScope(next, { key, value });
        commit(next, { path: '/stock/all' });
        return;
      }

      if (next.has(`${key}From`) || next.has(`${key}To`)) {
        next.delete(`${key}From`);
        next.delete(`${key}To`);
      } else {
        const remaining = next.getAll(key).filter((v) => v !== value);
        next.delete(key);
        for (const v of remaining) next.append(key, v);
      }
      commit(next);
    },
    [commit, dissolveScope, scope, searchParams],
  );

  /**
   * Clears every filter, including the ones the path pins, while keeping the
   * search term, sort and view mode.
   */
  const clearAll = useCallback(() => {
    const next = new URLSearchParams();
    for (const key of ['q', 'sort', 'view'] as const) {
      const value = searchParams.get(key);
      if (value) next.set(key, value);
    }
    const hasScope = SCOPE_KEYS.some((key) => scope[key as keyof StockScope]);
    commit(next, { path: hasScope ? '/stock/all' : pathname });
  }, [commit, pathname, scope, searchParams]);

  return { searchParams, toggleValue, setRange, setParam, removeFilter, clearAll };
}

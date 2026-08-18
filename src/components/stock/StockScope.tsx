'use client';

import { createContext, useContext } from 'react';

/**
 * Which filters are encoded in the *path* rather than the query string.
 *
 * `/stock/truck/volvo` means category=truck and brand=volvo, but neither
 * appears in `?…`. Without knowing that, unchecking "Truck" in the sidebar
 * would rewrite the query string and change nothing, because the path would
 * still pin the category. This context lets the filter controls rewrite the
 * path instead.
 */
export interface StockScope {
  category: string | null;
  bodyType: string | null;
  brand: string | null;
  model: string | null;
}

const EMPTY: StockScope = { category: null, bodyType: null, brand: null, model: null };

const StockScopeContext = createContext<StockScope>(EMPTY);

export function StockScopeProvider({
  scope,
  children,
}: {
  scope: StockScope;
  children: React.ReactNode;
}) {
  return <StockScopeContext.Provider value={scope}>{children}</StockScopeContext.Provider>;
}

export function useStockScope(): StockScope {
  return useContext(StockScopeContext);
}

/** True when this key/value pair is pinned by the path. */
export function isPathScoped(scope: StockScope, key: string, value: string): boolean {
  const pinned = scope[key as keyof StockScope];
  return typeof pinned === 'string' && pinned.toLowerCase() === value.toLowerCase();
}

'use client';

import { useStockParams } from '@/lib/useStockParams';
import { ChevronLeft, ChevronRight } from '../icons';

interface Props {
  page: number;
  totalPages: number;
}

/** `‹ 1 2 … 25 26 ›` — the reference's pagination, `page` in the URL. */
export function Pagination({ page, totalPages }: Props) {
  const { setParam } = useStockParams();
  if (totalPages <= 1) return null;

  const go = (target: number) => setParam('page', target === 1 ? null : String(target), { resetPage: false });

  const numbers = buildRange(page, totalPages);

  return (
    <nav
      aria-label="Pagination"
      data-testid="pagination"
      className="mt-8 flex items-center justify-center gap-1"
    >
      <button
        type="button"
        onClick={() => go(page - 1)}
        disabled={page <= 1}
        aria-label="Previous page"
        className="flex h-10 w-10 items-center justify-center border border-grey-400 disabled:opacity-40"
      >
        <ChevronLeft size={14} />
      </button>

      {numbers.map((entry, index) =>
        entry === '…' ? (
          <span key={`gap-${index}`} className="px-2 text-grey-800">
            …
          </span>
        ) : (
          <button
            key={entry}
            type="button"
            onClick={() => go(entry)}
            aria-current={entry === page ? 'page' : undefined}
            className={`h-10 min-w-10 border px-3 text-base ${
              entry === page
                ? 'border-ink bg-ink font-semibold text-white'
                : 'border-grey-400 hover:bg-grey-100'
            }`}
          >
            {entry}
          </button>
        ),
      )}

      <button
        type="button"
        onClick={() => go(page + 1)}
        disabled={page >= totalPages}
        aria-label="Next page"
        className="flex h-10 w-10 items-center justify-center border border-grey-400 disabled:opacity-40"
      >
        <ChevronRight size={14} />
      </button>
    </nav>
  );
}

/** Shows the first two, the last two, and a window around the current page. */
function buildRange(page: number, totalPages: number): (number | '…')[] {
  const pages = new Set<number>([1, 2, totalPages - 1, totalPages, page - 1, page, page + 1]);
  const sorted = [...pages].filter((p) => p >= 1 && p <= totalPages).sort((a, b) => a - b);

  const out: (number | '…')[] = [];
  let previous = 0;
  for (const p of sorted) {
    if (previous && p - previous > 1) out.push('…');
    out.push(p);
    previous = p;
  }
  return out;
}

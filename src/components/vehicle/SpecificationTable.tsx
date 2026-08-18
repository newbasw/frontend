'use client';

import { useState } from 'react';

interface Props {
  specifications: Record<string, Record<string, string>>;
  /** Groups shown before "Show all specifications" is pressed. */
  initialGroups?: number;
}

/**
 * The grouped spec table on the PDP, with the reference's
 * "Show all specifications" expander.
 */
export function SpecificationTable({ specifications, initialGroups = 3 }: Props) {
  const [expanded, setExpanded] = useState(false);
  const groups = Object.entries(specifications).filter(([, rows]) => Object.keys(rows).length > 0);

  if (groups.length === 0) return null;

  const visible = expanded ? groups : groups.slice(0, initialGroups);

  return (
    <section className="mt-8" data-testid="specifications">
      <h2 className="mb-4 text-xl font-semibold">About this vehicle</h2>

      <div className="space-y-6">
        {visible.map(([group, rows]) => (
          <div key={group}>
            <h3 className="mb-2 text-md font-semibold">{group}</h3>
            <dl className="divide-y divide-grey-300 border-t border-grey-300">
              {Object.entries(rows).map(([label, value]) => (
                <div key={label} className="flex justify-between gap-4 py-2 text-base">
                  <dt className="text-grey-800">{label}</dt>
                  <dd className="text-right font-medium">{value}</dd>
                </div>
              ))}
            </dl>
          </div>
        ))}
      </div>

      {groups.length > initialGroups && (
        <button
          type="button"
          onClick={() => setExpanded((v) => !v)}
          data-testid="show-all-specs"
          className="mt-4 text-base font-semibold text-link hover:underline"
        >
          {expanded ? 'Show fewer specifications' : 'Show all specifications'}
        </button>
      )}
    </section>
  );
}

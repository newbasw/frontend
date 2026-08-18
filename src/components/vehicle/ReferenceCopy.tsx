'use client';

import { useState } from 'react';
import { Check, Copy } from '../icons';

/** Reference number with copy-to-clipboard and the reference's "Copied" feedback. */
export function ReferenceCopy({ reference }: { reference: string }) {
  const [copied, setCopied] = useState(false);

  async function copy() {
    try {
      await navigator.clipboard.writeText(reference);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      /* clipboard blocked — the number stays visible and selectable */
    }
  }

  return (
    <div className="flex items-center justify-between gap-2 text-base">
      <span className="text-grey-800">Reference no.</span>
      <button
        type="button"
        onClick={copy}
        data-testid="reference-copy"
        className="flex items-center gap-2 font-medium hover:text-link"
        title="Copy reference number"
      >
        {reference}
        {copied ? <Check size={14} className="text-brand" /> : <Copy size={14} />}
        <span className="sr-only" role="status">
          {copied ? 'Copied' : ''}
        </span>
      </button>
    </div>
  );
}

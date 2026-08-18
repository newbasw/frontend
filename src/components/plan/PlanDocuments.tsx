'use client';

import { useEffect, useRef, useState } from 'react';
import { ApiRequestError, clientApi } from '@/lib/api';
import { Check, Spinner } from '../icons';

/**
 * Paperwork for an instalment plan.
 *
 * These are passports, bank statements and payslips, so the component is
 * deliberately plain about what happens to them: what is needed, what has been
 * received, and what an admin has said about it. Files upload one at a time as
 * a raw body — the API stores them privately and they are never given a public
 * URL.
 */

interface DocType {
  value: string;
  label: string;
  blurb: string;
  required: boolean;
}

interface Doc {
  id: string;
  doc_type: string;
  original_name?: string;
  status: string;
  review_note?: string | null;
  size_bytes?: number;
}

const ACCEPT = 'application/pdf,image/jpeg,image/png,image/webp,image/heic';
const MAX_BYTES = 12 * 1024 * 1024;

const STATUS_STYLE: Record<string, string> = {
  pending: 'bg-cta text-ink',
  approved: 'bg-ctaGreen text-white',
  rejected: 'bg-sale text-white',
};

export function PlanDocuments({
  reference,
  documents,
  missing,
  onChange,
}: {
  reference: string;
  documents: Doc[];
  missing: string[];
  onChange: () => void | Promise<void>;
}) {
  const [types, setTypes] = useState<DocType[]>([]);
  const [busy, setBusy] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const inputs = useRef<Record<string, HTMLInputElement | null>>({});

  useEffect(() => {
    clientApi<{ documents: DocType[] }>('/api/plans/options')
      .then((res) => setTypes(res.documents))
      .catch(() => setTypes([]));
  }, []);

  async function upload(docType: string, file: File) {
    setError(null);

    if (file.size > MAX_BYTES) {
      setError(`${file.name} is larger than 12 MB. Please send a smaller scan.`);
      return;
    }
    if (!ACCEPT.split(',').includes(file.type)) {
      setError('Send a PDF, JPG, PNG, WEBP or HEIC.');
      return;
    }

    setBusy(docType);
    try {
      // The file is the body; type and name ride along as query parameters so
      // there is no multipart parsing on either side.
      const qs = new URLSearchParams({ type: docType, name: file.name });
      await clientApi(`/api/plans/${reference}/documents?${qs}`, {
        method: 'POST',
        body: file,
        headers: { 'Content-Type': file.type },
      });
      await onChange();
    } catch (err) {
      setError(err instanceof ApiRequestError ? err.message : 'That upload did not go through.');
    } finally {
      setBusy(null);
      const input = inputs.current[docType];
      if (input) input.value = '';
    }
  }

  const byType = new Map<string, Doc>();
  for (const d of documents) {
    // Newest first from the API, so the first one seen is the current one.
    if (!byType.has(d.doc_type)) byType.set(d.doc_type, d);
  }

  return (
    <section data-testid="plan-documents" className="rounded-minimal border border-grey-300">
      <header className="border-b border-grey-300 bg-grey-100 px-4 py-3">
        <p className="text-md font-semibold">Your documents</p>
        <p className="text-base text-grey-800">
          {missing.length === 0
            ? 'Everything we need is in. We will confirm shortly.'
            : `${missing.length} still needed before we can approve your plan.`}
        </p>
      </header>

      <div className="divide-y divide-grey-300">
        {types.map((t) => {
          const existing = byType.get(t.value);
          const uploading = busy === t.value;

          return (
            <div key={t.value} className="flex flex-wrap items-start gap-3 p-4">
              <div className="min-w-[12rem] flex-1">
                <p className="text-base font-semibold">
                  {t.label}
                  {!t.required && <span className="ml-1 text-xs text-grey-800">(if it applies)</span>}
                </p>
                <p className="text-base text-grey-800">{t.blurb}</p>

                {existing?.review_note && (
                  <p className="mt-1 text-base text-sale">{existing.review_note}</p>
                )}
              </div>

              <div className="flex shrink-0 items-center gap-2">
                {existing && (
                  <span
                    className={`rounded-minimal px-2 py-0.5 text-xs font-semibold ${
                      STATUS_STYLE[existing.status] ?? 'bg-grey-300 text-ink'
                    }`}
                  >
                    {existing.status}
                  </span>
                )}

                <input
                  ref={(el) => {
                    inputs.current[t.value] = el;
                  }}
                  id={`doc-${t.value}`}
                  type="file"
                  accept={ACCEPT}
                  className="sr-only"
                  onChange={(e) => {
                    const file = e.target.files?.[0];
                    if (file) void upload(t.value, file);
                  }}
                />
                <label
                  htmlFor={`doc-${t.value}`}
                  data-testid={`upload-${t.value}`}
                  className={`cursor-pointer ${
                    existing && existing.status !== 'rejected' ? 'bw-btn-outline' : 'bw-btn-black'
                  } px-3 py-1 text-base`}
                >
                  {uploading ? (
                    <Spinner size={14} />
                  ) : existing ? (
                    existing.status === 'rejected' ? 'Send again' : 'Replace'
                  ) : (
                    'Upload'
                  )}
                </label>
              </div>
            </div>
          );
        })}
      </div>

      {error && (
        <p role="alert" className="bw-field-error px-4 pb-3">
          {error}
        </p>
      )}

      <footer className="flex items-start gap-2 border-t border-grey-300 px-4 py-3 text-xs text-grey-800">
        <Check size={13} className="mt-0.5 shrink-0 text-brand" />
        <span>
          Your documents are stored privately and are visible only to the team reviewing your
          plan. They are never published, never attached to a public link, and we ask for them
          only because this is a credit agreement.
        </span>
      </footer>
    </section>
  );
}

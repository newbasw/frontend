export const API_URL = process.env.NEXT_PUBLIC_API_URL ?? 'http://localhost:4000';

export class ApiRequestError extends Error {
  constructor(
    public status: number,
    public code: string,
    message: string,
    public details?: Record<string, string[]>,
  ) {
    super(message);
    this.name = 'ApiRequestError';
  }
}

/**
 * Browser-side API client. Cookies ride along via `credentials: 'include'`, so
 * the httpOnly session cookie is never read by JavaScript.
 *
 * The server-side counterpart lives in `./api.server` — it is a separate module
 * because it imports `next/headers`, which cannot be bundled for the browser.
 */
export async function clientApi<T>(path: string, options: RequestInit = {}): Promise<T> {
  const res = await fetch(`${API_URL}${path}`, {
    ...options,
    credentials: 'include',
    headers: {
      Accept: 'application/json',
      ...(options.body ? { 'Content-Type': 'application/json' } : {}),
      ...(options.headers ?? {}),
    },
  });

  if (!res.ok) {
    let payload: { error?: string; message?: string; details?: Record<string, string[]> } = {};
    try {
      payload = await res.json();
    } catch {
      /* ignore */
    }
    throw new ApiRequestError(
      res.status,
      payload.error ?? 'request_failed',
      payload.message ?? 'Something went wrong. Please try again.',
      payload.details,
    );
  }

  return (await res.json()) as T;
}

/** Turns a plain object into a query string, dropping empty values. */
export function toQuery(
  params: Record<string, string | number | string[] | undefined | null>,
): string {
  const search = new URLSearchParams();
  for (const [key, value] of Object.entries(params)) {
    if (value == null || value === '') continue;
    if (Array.isArray(value)) {
      for (const v of value) if (v) search.append(key, v);
    } else {
      search.set(key, String(value));
    }
  }
  const qs = search.toString();
  return qs ? `?${qs}` : '';
}

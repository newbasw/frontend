import 'server-only';
import { cookies } from 'next/headers';
import { API_URL, ApiRequestError } from './api';

const AUTH_COOKIE = process.env.AUTH_COOKIE_NAME ?? 'bw_session';

interface FetchOptions extends RequestInit {
  /** Seconds. `0` disables the cache for this call. */
  revalidate?: number;
  /** Forward the caller's session cookie so the API can resolve `req.user`. */
  withAuth?: boolean;
}

/**
 * Server-side API client, for Server Components and route handlers.
 *
 * Kept in its own module because it imports `next/headers`, which cannot be
 * pulled into a Client Component bundle. Browser code uses `clientApi` from
 * `./api` instead.
 */
export async function serverApi<T>(path: string, options: FetchOptions = {}): Promise<T> {
  const { revalidate, withAuth, headers, ...rest } = options;

  const finalHeaders = new Headers(headers);
  finalHeaders.set('Accept', 'application/json');

  if (withAuth) {
    const token = cookies().get(AUTH_COOKIE)?.value;
    if (token) finalHeaders.set('Authorization', `Bearer ${token}`);
  }

  // `cache: 'no-store'` and `next.revalidate` are mutually exclusive in Next 14 —
  // setting both logs a warning and the behaviour becomes ambiguous.
  const res = await fetch(`${API_URL}${path}`, {
    ...rest,
    headers: finalHeaders,
    ...(revalidate === 0
      ? { cache: 'no-store' as const }
      : revalidate === undefined
        ? {}
        : { next: { revalidate } }),
  });

  if (!res.ok) {
    let payload: { error?: string; message?: string; details?: Record<string, string[]> } = {};
    try {
      payload = await res.json();
    } catch {
      /* non-JSON error body */
    }
    throw new ApiRequestError(
      res.status,
      payload.error ?? 'request_failed',
      payload.message ?? `Request to ${path} failed with ${res.status}`,
      payload.details,
    );
  }

  return (await res.json()) as T;
}

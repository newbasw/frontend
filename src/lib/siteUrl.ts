/**
 * Resolving the public URLs of this deployment.
 *
 * `process.env.X ?? fallback` is not enough. A platform that defines a
 * variable but leaves it blank hands over an empty string, and `??` only
 * catches `undefined` — so the empty string wins and `new URL('')` throws
 * `ERR_INVALID_URL` during the build. That is exactly how a Vercel deploy
 * fails while the same code builds locally.
 *
 * Everything here treats blank as absent, and falls back through the values a
 * host is likely to provide before giving up on localhost.
 */

/** First value that is actually present, ignoring blanks. */
function firstSet(...values: (string | undefined)[]): string | undefined {
  for (const value of values) {
    const trimmed = value?.trim();
    if (trimmed) return trimmed;
  }
  return undefined;
}

/** Adds a scheme to a bare host, as Vercel supplies for VERCEL_URL. */
function withScheme(value: string): string {
  return /^https?:\/\//i.test(value) ? value : `https://${value}`;
}

/** Public origin of the site itself, never blank and always parseable. */
export function siteUrl(): string {
  const resolved = firstSet(
    process.env.NEXT_PUBLIC_SITE_URL,
    // Set automatically on Vercel, so a deploy works before the var is added.
    process.env.NEXT_PUBLIC_VERCEL_URL,
    process.env.VERCEL_URL,
  );
  return resolved ? withScheme(resolved).replace(/\/+$/, '') : 'http://localhost:3000';
}

/**
 * Absolute origin of the API.
 *
 * Used for server-side rendering, which cannot fetch a relative path, and as
 * the destination of the rewrite in next.config.mjs.
 */
export function apiOrigin(): string {
  const resolved = firstSet(process.env.NEXT_PUBLIC_API_URL);
  return resolved ? withScheme(resolved).replace(/\/+$/, '') : 'http://localhost:4000';
}

/**
 * What the *browser* should call.
 *
 * Empty, meaning same-origin: requests go to this site and are rewritten to
 * the API by next.config.mjs. That is what keeps the session cookie
 * first-party — calling the API host directly makes it third-party, and a
 * browser that refuses those lets a login succeed and then drops the session
 * on the very next request.
 *
 * On the server there is no origin to be relative to, so the absolute one is
 * used instead.
 */
export function apiUrl(): string {
  if (typeof window !== 'undefined') return '';
  return apiOrigin();
}

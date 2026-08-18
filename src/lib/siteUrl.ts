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

/** Origin of the API this frontend talks to. */
export function apiUrl(): string {
  const resolved = firstSet(process.env.NEXT_PUBLIC_API_URL);
  return resolved ? withScheme(resolved).replace(/\/+$/, '') : 'http://localhost:4000';
}

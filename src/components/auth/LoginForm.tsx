'use client';

import { useState } from 'react';
import Link from 'next/link';
import { useSearchParams } from 'next/navigation';
import { ApiRequestError, clientApi } from '@/lib/api';
import { useAuth } from './AuthProvider';
import { Spinner } from '../icons';
import type { AuthUser } from '@shared/types';

export function LoginForm() {
  const searchParams = useSearchParams();
  const { setUser } = useAuth();

  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [fieldErrors, setFieldErrors] = useState<Record<string, string[]>>({});

  // Only same-origin relative paths — never redirect to an attacker-supplied
  // absolute URL taken from the query string.
  /*
   * Return people to whatever sent them here — the vehicle they were about to
   * buy, or the conversation they were starting. With nothing to return to,
   * the homepage is the useful place to be, not the account page.
   *
   * Only same-site paths are honoured, so a crafted `next` cannot bounce
   * someone to another site after signing in.
   */
  const requested = searchParams.get('next') ?? '/';
  const next = requested.startsWith('/') && !requested.startsWith('//') ? requested : '/';

  async function onSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setSubmitting(true);
    setError(null);
    setFieldErrors({});

    const data = new FormData(event.currentTarget);
    try {
      const { user } = await clientApi<{ user: AuthUser }>('/api/auth/login', {
        method: 'POST',
        body: JSON.stringify({
          email: String(data.get('email') ?? ''),
          password: String(data.get('password') ?? ''),
        }),
      });
      setUser(user);
      // A full navigation, not router.push: the client Router Cache still holds
      // the middleware redirect that sent us here, so a soft navigation to a
      // protected route would bounce straight back to /login. Login is a
      // once-per-session transition, so the extra request is not worth the
      // subtle breakage.
      window.location.assign(next);
    } catch (err) {
      if (err instanceof ApiRequestError) {
        setFieldErrors(err.details ?? {});
        setError(err.details ? null : err.message);
      } else {
        setError('Something went wrong. Please try again.');
      }
      setSubmitting(false);
    }
  }

  return (
    <form onSubmit={onSubmit} noValidate data-testid="login-form" className="mt-6 space-y-4">
      <div>
        <label htmlFor="email" className="bw-label">
          Email address
        </label>
        <input
          id="email"
          name="email"
          type="email"
          autoComplete="email"
          required
          aria-invalid={!!fieldErrors.email}
          className="bw-input"
        />
        {fieldErrors.email?.map((e) => (
          <span key={e} className="bw-field-error">
            {e}
          </span>
        ))}
      </div>

      <div>
        <label htmlFor="password" className="bw-label">
          Password
        </label>
        <input
          id="password"
          name="password"
          type="password"
          autoComplete="current-password"
          required
          aria-invalid={!!fieldErrors.password}
          className="bw-input"
        />
        {fieldErrors.password?.map((e) => (
          <span key={e} className="bw-field-error">
            {e}
          </span>
        ))}
      </div>

      {error && (
        <p role="alert" data-testid="login-error" className="bw-field-error">
          {error}
        </p>
      )}

      <button type="submit" disabled={submitting} className="bw-btn-black w-full">
        {submitting ? <Spinner size={16} /> : 'Login'}
      </button>

      <Link href="/forgot-password" className="cds-link block text-center text-base">
        Forgot your password?
      </Link>
    </form>
  );
}

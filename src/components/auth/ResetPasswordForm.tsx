'use client';

import Link from 'next/link';
import { useState } from 'react';
import { ApiRequestError, clientApi } from '@/lib/api';
import { Check, Spinner } from '../icons';

/**
 * Choosing a new password from an emailed reset link.
 *
 * The token comes from the URL and is never shown or editable — it is proof
 * the person reached this page from their own inbox, so it is passed straight
 * through and nothing about it is echoed back to the page.
 */
export function ResetPasswordForm({ token }: { token: string }) {
  const [password, setPassword] = useState('');
  const [confirm, setConfirm] = useState('');
  const [busy, setBusy] = useState(false);
  const [done, setDone] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [errors, setErrors] = useState<Record<string, string[]>>({});

  async function submit(event: React.FormEvent) {
    event.preventDefault();
    setError(null);
    setErrors({});

    if (password !== confirm) {
      setError('Those two passwords do not match.');
      return;
    }

    setBusy(true);
    try {
      await clientApi('/api/auth/reset-password', {
        method: 'POST',
        body: JSON.stringify({ token, password }),
      });
      setDone(true);
    } catch (err) {
      if (err instanceof ApiRequestError) {
        setErrors(err.details ?? {});
        setError(err.details ? null : err.message);
      } else setError('Could not set that password. Please try again.');
    } finally {
      setBusy(false);
    }
  }

  if (done) {
    return (
      <div data-testid="reset-done" className="mt-6 rounded-minimal border border-grey-300 p-4">
        <p className="flex items-center gap-2 text-md font-semibold">
          <Check size={16} className="text-brand" />
          Your password has been changed
        </p>
        <p className="mt-2 text-base text-grey-800">
          You can now sign in with your new password.
        </p>
        <Link href="/login" className="bw-btn-cta mt-4">
          Go to login
        </Link>
      </div>
    );
  }

  return (
    <form onSubmit={submit} data-testid="reset-form" className="mt-6 space-y-4">
      <div>
        <label htmlFor="new-password" className="bw-label">
          New password
        </label>
        <input
          id="new-password"
          type="password"
          autoComplete="new-password"
          required
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          className="bw-input"
        />
        {errors.password?.map((e) => (
          <span key={e} className="bw-field-error">
            {e}
          </span>
        ))}
      </div>

      <div>
        <label htmlFor="confirm-password" className="bw-label">
          Repeat new password
        </label>
        <input
          id="confirm-password"
          type="password"
          autoComplete="new-password"
          required
          value={confirm}
          onChange={(e) => setConfirm(e.target.value)}
          className="bw-input"
        />
      </div>

      {errors.token?.map((e) => (
        <p key={e} role="alert" className="bw-field-error">
          That reset link is not valid. Request a new one.
        </p>
      ))}

      {error && (
        <p role="alert" className="bw-field-error">
          {error}
        </p>
      )}

      <button type="submit" disabled={busy} data-testid="reset-submit" className="bw-btn-cta w-full">
        {busy ? <Spinner size={16} /> : 'Set new password'}
      </button>
    </form>
  );
}

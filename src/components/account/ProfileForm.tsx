'use client';

import { useState } from 'react';
import { ApiRequestError, clientApi } from '@/lib/api';
import { useAuth } from '../auth/AuthProvider';
import { Check, Spinner } from '../icons';
import type { AuthUser } from '@shared/types';

export function ProfileForm({ user }: { user: AuthUser }) {
  const { setUser } = useAuth();
  const [status, setStatus] = useState<'idle' | 'saving' | 'saved'>('idle');
  const [error, setError] = useState<string | null>(null);

  async function onSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setStatus('saving');
    setError(null);

    const data = new FormData(event.currentTarget);
    try {
      const res = await clientApi<{ user: AuthUser }>('/api/auth/me', {
        method: 'PATCH',
        body: JSON.stringify({
          first_name: String(data.get('first_name') ?? ''),
          last_name: String(data.get('last_name') ?? ''),
          company_name: String(data.get('company_name') ?? '') || null,
          phone: String(data.get('phone') ?? '') || null,
          newsletter_opt_in: data.get('newsletter_opt_in') === 'on',
        }),
      });
      setUser(res.user);
      setStatus('saved');
      setTimeout(() => setStatus('idle'), 2500);
    } catch (err) {
      setStatus('idle');
      setError(err instanceof ApiRequestError ? err.message : 'Could not save your changes.');
    }
  }

  return (
    <form onSubmit={onSubmit} data-testid="profile-form" className="space-y-4 border border-grey-300 p-4">
      <div>
        <label htmlFor="p-first" className="bw-label">
          First name
        </label>
        <input id="p-first" name="first_name" defaultValue={user.first_name ?? ''} className="bw-input" />
      </div>
      <div>
        <label htmlFor="p-last" className="bw-label">
          Last name
        </label>
        <input id="p-last" name="last_name" defaultValue={user.last_name ?? ''} className="bw-input" />
      </div>
      <div>
        <label htmlFor="p-company" className="bw-label">
          Company
        </label>
        <input id="p-company" name="company_name" defaultValue={user.company_name ?? ''} className="bw-input" />
      </div>
      <div>
        <label htmlFor="p-phone" className="bw-label">
          Phone
        </label>
        <input id="p-phone" name="phone" type="tel" defaultValue={user.phone ?? ''} className="bw-input" />
      </div>

      <label className="flex items-start gap-2 text-base">
        <input
          type="checkbox"
          name="newsletter_opt_in"
          defaultChecked={user.newsletter_opt_in}
          className="mt-1 h-4 w-4 accent-ink"
        />
        <span>Keep me up to date with new stock and offers.</span>
      </label>

      {error && (
        <p role="alert" className="bw-field-error">
          {error}
        </p>
      )}

      <button type="submit" disabled={status === 'saving'} className="bw-btn-black w-full">
        {status === 'saving' ? (
          <Spinner size={16} />
        ) : status === 'saved' ? (
          <>
            <Check size={14} /> Saved
          </>
        ) : (
          'Save changes'
        )}
      </button>
    </form>
  );
}

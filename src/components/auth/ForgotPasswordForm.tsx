'use client';

import { useState } from 'react';
import { clientApi } from '@/lib/api';
import { Spinner } from '../icons';

export function ForgotPasswordForm() {
  const [status, setStatus] = useState<'idle' | 'sending' | 'sent'>('idle');

  async function onSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setStatus('sending');
    const data = new FormData(event.currentTarget);
    try {
      await clientApi('/api/auth/forgot-password', {
        method: 'POST',
        body: JSON.stringify({ email: String(data.get('email') ?? '') }),
      });
    } catch {
      /* the endpoint answers identically either way — never leak account existence */
    }
    setStatus('sent');
  }

  if (status === 'sent') {
    return (
      <p role="status" className="mt-6 border border-brand bg-brand/5 p-4 text-base">
        If that address has an account, a reset link is on its way. Check your inbox and your spam
        folder.
      </p>
    );
  }

  return (
    <form onSubmit={onSubmit} className="mt-6 space-y-4">
      <div>
        <label htmlFor="email" className="bw-label">
          Email address
        </label>
        <input id="email" name="email" type="email" autoComplete="email" required className="bw-input" />
      </div>
      <button type="submit" disabled={status === 'sending'} className="bw-btn-black w-full">
        {status === 'sending' ? <Spinner size={16} /> : 'Send reset link'}
      </button>
    </form>
  );
}

'use client';

import { useState } from 'react';
import { ApiRequestError, clientApi } from '@/lib/api';
import { useAuth } from './AuthProvider';
import { Spinner } from '../icons';
import type { AuthUser } from '@shared/types';

export function RegisterForm() {
  const { setUser } = useAuth();

  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [fieldErrors, setFieldErrors] = useState<Record<string, string[]>>({});
  const [confirmationSent, setConfirmationSent] = useState(false);

  async function onSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setSubmitting(true);
    setError(null);
    setFieldErrors({});

    const data = new FormData(event.currentTarget);
    try {
      const result = await clientApi<{ user: AuthUser; requires_confirmation: boolean }>(
        '/api/auth/register',
        {
          method: 'POST',
          body: JSON.stringify({
            first_name: String(data.get('first_name') ?? ''),
            last_name: String(data.get('last_name') ?? ''),
            email: String(data.get('email') ?? ''),
            password: String(data.get('password') ?? ''),
            company_name: String(data.get('company_name') ?? ''),
            phone: String(data.get('phone') ?? ''),
            newsletter_opt_in: data.get('newsletter_opt_in') === 'on',
          }),
        },
      );

      if (result.requires_confirmation) {
        setConfirmationSent(true);
        setSubmitting(false);
        return;
      }

      setUser(result.user);
      // Full navigation for the same reason as login — see LoginForm.
      window.location.assign('/account');
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

  if (confirmationSent) {
    return (
      <div
        role="status"
        data-testid="register-confirm"
        className="mt-6 border border-brand bg-brand/5 p-4"
      >
        <p className="text-md font-semibold">Check your inbox</p>
        <p className="mt-1 text-base text-grey-800">
          We have sent you a confirmation link. Click it to activate your account and sign in.
        </p>
      </div>
    );
  }

  return (
    <form onSubmit={onSubmit} noValidate data-testid="register-form" className="mt-6 space-y-4">
      <div className="grid gap-4 sm:grid-cols-2">
        <Field name="first_name" label="First name" autoComplete="given-name" required errors={fieldErrors.first_name} />
        <Field name="last_name" label="Last name" autoComplete="family-name" required errors={fieldErrors.last_name} />
      </div>

      <Field name="email" label="Email address" type="email" autoComplete="email" required errors={fieldErrors.email} />

      <div>
        <label htmlFor="password" className="bw-label">
          Password
        </label>
        <input
          id="password"
          name="password"
          type="password"
          autoComplete="new-password"
          required
          minLength={8}
          aria-describedby="password-hint"
          aria-invalid={!!fieldErrors.password}
          className="bw-input"
        />
        <span id="password-hint" className="mt-1 block text-xs text-grey-800">
          At least 8 characters, including a letter and a number.
        </span>
        {fieldErrors.password?.map((e) => (
          <span key={e} className="bw-field-error">
            {e}
          </span>
        ))}
      </div>

      <div className="grid gap-4 sm:grid-cols-2">
        <Field name="company_name" label="Company (optional)" autoComplete="organization" errors={fieldErrors.company_name} />
        <Field name="phone" label="Phone (optional)" type="tel" autoComplete="tel" errors={fieldErrors.phone} />
      </div>

      <label className="flex items-start gap-2 text-base">
        <input type="checkbox" name="newsletter_opt_in" className="mt-1 h-4 w-4 accent-ink" />
        <span>Keep me up to date with new stock and offers.</span>
      </label>

      {error && (
        <p role="alert" data-testid="register-error" className="bw-field-error">
          {error}
        </p>
      )}

      <button type="submit" disabled={submitting} className="bw-btn-black w-full">
        {submitting ? <Spinner size={16} /> : 'Create account'}
      </button>
    </form>
  );
}

function Field({
  name,
  label,
  type = 'text',
  required,
  autoComplete,
  errors,
}: {
  name: string;
  label: string;
  type?: string;
  required?: boolean;
  autoComplete?: string;
  errors?: string[];
}) {
  return (
    <div>
      <label htmlFor={name} className="bw-label">
        {label}
      </label>
      <input
        id={name}
        name={name}
        type={type}
        required={required}
        autoComplete={autoComplete}
        aria-invalid={!!errors}
        className="bw-input"
      />
      {errors?.map((e) => (
        <span key={e} className="bw-field-error">
          {e}
        </span>
      ))}
    </div>
  );
}

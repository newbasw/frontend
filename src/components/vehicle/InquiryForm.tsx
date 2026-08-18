'use client';

import { useState } from 'react';
import { clientApi, ApiRequestError } from '@/lib/api';
import { useAuth } from '../auth/AuthProvider';
import { Check, Spinner } from '../icons';
import type { InquiryKind } from '@shared/types';

interface Props {
  vehicleId?: string | null;
  vehicleTitle?: string | null;
  kind?: InquiryKind;
  heading?: string;
  submitLabel?: string;
  compact?: boolean;
}

/**
 * Enquiry form. Posts to the API, which stores the enquiry in Supabase and
 * sends the confirmation through Resend. Renders real server-side validation
 * errors per field.
 */
export function InquiryForm({
  vehicleId = null,
  vehicleTitle = null,
  kind = 'seller_message',
  heading,
  submitLabel = 'Send message',
  compact = false,
}: Props) {
  const { user } = useAuth();
  const [status, setStatus] = useState<'idle' | 'sending' | 'sent'>('idle');
  const [message, setMessage] = useState('');
  const [errors, setErrors] = useState<Record<string, string[]>>({});
  const [formError, setFormError] = useState<string | null>(null);

  async function onSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setStatus('sending');
    setErrors({});
    setFormError(null);

    const data = new FormData(event.currentTarget);
    try {
      await clientApi('/api/inquiries', {
        method: 'POST',
        body: JSON.stringify({
          vehicleId,
          kind,
          name: String(data.get('name') ?? ''),
          email: String(data.get('email') ?? ''),
          phone: String(data.get('phone') ?? ''),
          company_name: String(data.get('company_name') ?? ''),
          message: String(data.get('message') ?? ''),
        }),
      });
      setStatus('sent');
    } catch (err) {
      setStatus('idle');
      if (err instanceof ApiRequestError) {
        setErrors(err.details ?? {});
        setFormError(err.details ? null : err.message);
      } else {
        setFormError('Something went wrong. Please try again.');
      }
    }
  }

  if (status === 'sent') {
    return (
      <div
        data-testid="inquiry-success"
        className="border border-brand bg-brand/5 p-4 text-base"
        role="status"
      >
        <p className="flex items-center gap-2 font-semibold">
          <Check size={16} className="text-brand" />
          Message sent
        </p>
        <p className="mt-1 text-grey-800">
          We have emailed you a confirmation. One of our advisors will be in touch, usually within
          one working day.
        </p>
      </div>
    );
  }

  return (
    <form onSubmit={onSubmit} noValidate data-testid="inquiry-form" className="space-y-3">
      {heading && <h3 className="text-md font-semibold">{heading}</h3>}
      {vehicleTitle && (
        <p className="text-xs text-grey-800">
          About: <span className="text-ink">{vehicleTitle}</span>
        </p>
      )}

      <div className={compact ? 'space-y-3' : 'grid gap-3 sm:grid-cols-2'}>
        <Field
          name="name"
          label="Name"
          required
          defaultValue={
            user ? [user.first_name, user.last_name].filter(Boolean).join(' ') : undefined
          }
          errors={errors.name}
        />
        <Field
          name="email"
          label="Email"
          type="email"
          required
          defaultValue={user?.email}
          errors={errors.email}
        />
        <Field name="phone" label="Phone (optional)" type="tel" defaultValue={user?.phone ?? undefined} errors={errors.phone} />
        <Field
          name="company_name"
          label="Company (optional)"
          defaultValue={user?.company_name ?? undefined}
          errors={errors.company_name}
        />
      </div>

      <div>
        <label htmlFor="inquiry-message" className="bw-label">
          Message
        </label>
        <textarea
          id="inquiry-message"
          name="message"
          rows={4}
          required
          value={message}
          onChange={(e) => setMessage(e.target.value)}
          placeholder="I would like more information about this vehicle."
          aria-invalid={!!errors.message}
          className="w-full border-0 border-b border-grey-600 bg-grey-100 p-3 text-base outline-none focus:border-link"
        />
        {errors.message?.map((e) => (
          <span key={e} className="bw-field-error">
            {e}
          </span>
        ))}
      </div>

      {formError && (
        <p role="alert" className="bw-field-error">
          {formError}
        </p>
      )}

      <button type="submit" disabled={status === 'sending'} className="bw-btn-black w-full">
        {status === 'sending' ? <Spinner size={16} /> : submitLabel}
      </button>

      <p className="text-xs text-grey-800">
        By sending this message you agree to our privacy policy. We only use your details to answer
        your enquiry.
      </p>
    </form>
  );
}

function Field({
  name,
  label,
  type = 'text',
  required,
  defaultValue,
  errors,
}: {
  name: string;
  label: string;
  type?: string;
  required?: boolean;
  defaultValue?: string;
  errors?: string[];
}) {
  return (
    <div>
      <label htmlFor={`inquiry-${name}`} className="bw-label">
        {label}
      </label>
      <input
        id={`inquiry-${name}`}
        name={name}
        type={type}
        required={required}
        defaultValue={defaultValue}
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
